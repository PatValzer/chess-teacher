import { Injectable } from '@angular/core';
import { WebRTCService, GameMessage } from './webrtc.service';
import { Subject } from 'rxjs';

export interface MoveData {
  from: string;
  to: string;
  promotion?: string;
  fen: string;
}

export interface GameStateSync {
  fen: string;
  moveHistory: string[];
  turn: 'w' | 'b';
}

@Injectable({
  providedIn: 'root',
})
export class GameSyncService {
  private remoteMove$ = new Subject<MoveData>();
  private remoteReset$ = new Subject<void>();
  private remoteUndo$ = new Subject<void>();
  private remoteSync$ = new Subject<GameStateSync>();

  constructor(private webrtc: WebRTCService) {
    // Listen for incoming messages
    this.webrtc.incomingMessages.subscribe((message: GameMessage) => {
      this.handleIncomingMessage(message);
    });
  }

  // Observables for components
  get remoteMoves() {
    return this.remoteMove$.asObservable();
  }

  get remoteResets() {
    return this.remoteReset$.asObservable();
  }

  get remoteUndos() {
    return this.remoteUndo$.asObservable();
  }

  get remoteSyncs() {
    return this.remoteSync$.asObservable();
  }

  /**
   * Send a move to the opponent
   */
  sendMove(from: string, to: string, promotion: string | undefined, fen: string): void {
    const moveData: MoveData = {
      from,
      to,
      promotion,
      fen,
    };
    this.webrtc.sendMessage('move', moveData);
  }

  /**
   * Send game reset notification
   */
  sendReset(): void {
    this.webrtc.sendMessage('reset', {});
  }

  /**
   * Send undo move notification
   */
  sendUndo(): void {
    this.webrtc.sendMessage('undo', {});
  }

  /**
   * Send full game state sync
   */
  sendSync(fen: string, moveHistory: string[], turn: 'w' | 'b'): void {
    const syncData: GameStateSync = {
      fen,
      moveHistory,
      turn,
    };
    this.webrtc.sendMessage('sync', syncData);
  }

  /**
   * Handle incoming messages from peer
   */
  private handleIncomingMessage(message: GameMessage): void {
    console.log('Received message:', message);

    switch (message.type) {
      case 'move':
        this.remoteMove$.next(message.data as MoveData);
        break;

      case 'reset':
        this.remoteReset$.next();
        break;

      case 'undo':
        this.remoteUndo$.next();
        break;

      case 'sync':
        this.remoteSync$.next(message.data as GameStateSync);
        break;

      case 'chat':
        // Future: handle chat messages
        console.log('Chat message:', message.data);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }
}
