import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';

export type ConnectionRole = 'host' | 'guest' | null;
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface GameMessage {
  type: 'move' | 'reset' | 'undo' | 'sync' | 'chat';
  data: any;
  timestamp: number;
}

export interface SignalingData {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  ice?: RTCIceCandidateInit;
}

/**
 * WebRTCService
 *
 * Manages peer-to-peer connections for multiplayer games.
 * Handles:
 * - Signaling exchanges (Offer/Answer/ICE).
 * - DataChannel creation for low-latency game moves and chat.
 * - Connection state tracking.
 */
@Injectable({
  providedIn: 'root',
})
export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;

  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>('disconnected');
  private incomingMessage$ = new Subject<GameMessage>();
  private role$ = new BehaviorSubject<ConnectionRole>(null);

  // ICE candidates collected before remote description is set
  private pendingIceCandidates: RTCIceCandidateInit[] = [];

  // Configuration for STUN servers (helps with NAT traversal)
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor() {}

  // Observables for components to subscribe to
  get connectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$.asObservable();
  }

  get incomingMessages(): Observable<GameMessage> {
    return this.incomingMessage$.asObservable();
  }

  get role(): Observable<ConnectionRole> {
    return this.role$.asObservable();
  }

  getCurrentStatus(): ConnectionStatus {
    return this.connectionStatus$.value;
  }

  getCurrentRole(): ConnectionRole {
    return this.role$.value;
  }

  /**
   * Host creates an offer and returns signaling data as JSON string
   */
  async createOffer(): Promise<string> {
    try {
      this.role$.next('host');
      this.connectionStatus$.next('connecting');

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.rtcConfig);
      this.setupPeerConnectionListeners();

      // Create data channel (host creates it)
      this.dataChannel = this.peerConnection.createDataChannel('chess-game', {
        ordered: true,
      });
      this.setupDataChannelListeners();

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await this.waitForIceGathering();

      // Return the complete offer with ICE candidates
      const signalingData: SignalingData = {
        offer: this.peerConnection.localDescription!.toJSON(),
      };

      return JSON.stringify(signalingData);
    } catch (error) {
      console.error('Error creating offer:', error);
      this.connectionStatus$.next('error');
      throw error;
    }
  }

  /**
   * Guest receives offer and creates answer
   */
  async createAnswer(offerJson: string): Promise<string> {
    try {
      this.role$.next('guest');
      this.connectionStatus$.next('connecting');

      const signalingData: SignalingData = JSON.parse(offerJson);

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.rtcConfig);
      this.setupPeerConnectionListeners();

      // Guest listens for data channel from host
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannelListeners();
      };

      // Set remote description (the offer)
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(signalingData.offer!)
      );

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Wait for ICE gathering
      await this.waitForIceGathering();

      // Return the answer
      const answerData: SignalingData = {
        answer: this.peerConnection.localDescription!.toJSON(),
      };

      return JSON.stringify(answerData);
    } catch (error) {
      console.error('Error creating answer:', error);
      this.connectionStatus$.next('error');
      throw error;
    }
  }

  /**
   * Host receives answer from guest
   */
  async receiveAnswer(answerJson: string): Promise<void> {
    try {
      const signalingData: SignalingData = JSON.parse(answerJson);

      if (!this.peerConnection) {
        throw new Error('No peer connection exists');
      }

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(signalingData.answer!)
      );

      // Add any pending ICE candidates
      for (const candidate of this.pendingIceCandidates) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      this.pendingIceCandidates = [];
    } catch (error) {
      console.error('Error receiving answer:', error);
      this.connectionStatus$.next('error');
      throw error;
    }
  }

  /**
   * Send a game message to the peer
   */
  sendMessage(type: GameMessage['type'], data: any): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('Data channel not open, cannot send message');
      return;
    }

    const message: GameMessage = {
      type,
      data,
      timestamp: Date.now(),
    };

    try {
      this.dataChannel.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Close the connection
   */
  disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.connectionStatus$.next('disconnected');
    this.role$.next(null);
    this.pendingIceCandidates = [];
  }

  /**
   * Setup listeners for peer connection events
   */
  private setupPeerConnectionListeners(): void {
    if (!this.peerConnection) return;

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection?.iceConnectionState);

      switch (this.peerConnection?.iceConnectionState) {
        case 'connected':
        case 'completed':
          this.connectionStatus$.next('connected');
          break;
        case 'failed':
        case 'disconnected':
        case 'closed':
          this.connectionStatus$.next('disconnected');
          break;
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
    };

    this.peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', this.peerConnection?.iceGatheringState);
    };
  }

  /**
   * Setup listeners for data channel events
   */
  private setupDataChannelListeners(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.connectionStatus$.next('connected');
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      this.connectionStatus$.next('disconnected');
    };

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      this.connectionStatus$.next('error');
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message: GameMessage = JSON.parse(event.data);
        this.incomingMessage$.next(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }

  /**
   * Wait for ICE gathering to complete
   */
  private waitForIceGathering(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.peerConnection) {
        resolve();
        return;
      }

      // If already complete, resolve immediately
      if (this.peerConnection.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      // Wait for gathering to complete
      const checkState = () => {
        if (this.peerConnection?.iceGatheringState === 'complete') {
          this.peerConnection.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };

      this.peerConnection.addEventListener('icegatheringstatechange', checkState);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.peerConnection) {
          this.peerConnection.removeEventListener('icegatheringstatechange', checkState);
        }
        resolve();
      }, 5000);
    });
  }
}
