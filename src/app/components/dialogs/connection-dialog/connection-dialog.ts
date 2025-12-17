import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebRTCService, ConnectionStatus, ConnectionRole } from '../../../services/webrtc.service';
import QRCode from 'qrcode';
import { TranslatePipe } from '../../../pipes/translate.pipe';

type ConnectionStep =
  | 'choose-role'
  | 'host-waiting'
  | 'guest-scanning'
  | 'guest-showing-answer'
  | 'connected';

/**
 * ConnectionDialog
 *
 * Handles the UI for establishing WebRTC connections.
 * - Generates and displays QR codes for Offers/Answers.
 * - Scans/Inputs codes from peers.
 * - Manages the multi-step connection wizard state.
 */
@Component({
  selector: 'app-connection-dialog',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './connection-dialog.html',
  styleUrl: './connection-dialog.css',
})
export class ConnectionDialog {
  close = output<void>();
  connected = output<ConnectionRole>();

  currentStep = signal<ConnectionStep>('choose-role');
  connectionStatus = signal<ConnectionStatus>('disconnected');
  errorMessage = signal<string>('');

  // QR code data URLs
  offerQRCode = signal<string>('');
  answerQRCode = signal<string>('');

  // Raw signaling data
  offerData = signal<string>('');
  answerData = signal<string>('');

  // For guest: input for scanned offer
  scannedOfferInput = signal<string>('');

  // For host: input for scanned answer
  scannedAnswerInput = signal<string>('');

  // Loading states
  isGeneratingOffer = signal<boolean>(false);
  isGeneratingAnswer = signal<boolean>(false);
  isProcessingAnswer = signal<boolean>(false);

  constructor(private webrtc: WebRTCService) {
    // Subscribe to connection status changes
    this.webrtc.connectionStatus.subscribe((status) => {
      this.connectionStatus.set(status);

      if (status === 'connected') {
        this.currentStep.set('connected');
        // Notify parent after a short delay
        setTimeout(() => {
          this.connected.emit(this.webrtc.getCurrentRole());
        }, 1500);
      } else if (status === 'error') {
        this.errorMessage.set('Connection failed. Please try again.');
      }
    });
  }

  /**
   * User chooses to host a game
   */
  async chooseHost(): Promise<void> {
    this.currentStep.set('host-waiting');
    this.isGeneratingOffer.set(true);
    this.errorMessage.set('');

    try {
      // Create WebRTC offer
      const offerJson = await this.webrtc.createOffer();
      this.offerData.set(offerJson);

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(offerJson, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      this.offerQRCode.set(qrCodeDataUrl);
    } catch (error) {
      console.error('Error creating offer:', error);
      this.errorMessage.set('Failed to create game. Please try again.');
      this.currentStep.set('choose-role');
    } finally {
      this.isGeneratingOffer.set(false);
    }
  }

  /**
   * User chooses to join a game
   */
  chooseGuest(): void {
    this.currentStep.set('guest-scanning');
    this.errorMessage.set('');
  }

  /**
   * Guest submits the scanned offer and generates answer
   */
  async submitScannedOffer(): Promise<void> {
    const offerJson = this.scannedOfferInput().trim();

    if (!offerJson) {
      this.errorMessage.set('Please paste the connection code');
      return;
    }

    this.isGeneratingAnswer.set(true);
    this.errorMessage.set('');

    try {
      // Create answer from offer
      const answerJson = await this.webrtc.createAnswer(offerJson);
      this.answerData.set(answerJson);

      // Generate QR code for answer
      const qrCodeDataUrl = await QRCode.toDataURL(answerJson, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      this.answerQRCode.set(qrCodeDataUrl);
      this.currentStep.set('guest-showing-answer');
    } catch (error) {
      console.error('Error creating answer:', error);
      this.errorMessage.set('Invalid connection code. Please try again.');
    } finally {
      this.isGeneratingAnswer.set(false);
    }
  }

  /**
   * Host submits the scanned answer
   */
  async submitScannedAnswer(): Promise<void> {
    const answerJson = this.scannedAnswerInput().trim();

    if (!answerJson) {
      this.errorMessage.set('Please paste the response code');
      return;
    }

    this.isProcessingAnswer.set(true);
    this.errorMessage.set('');

    try {
      await this.webrtc.receiveAnswer(answerJson);
      // Connection will be established, status will update automatically
    } catch (error) {
      console.error('Error processing answer:', error);
      this.errorMessage.set('Invalid response code. Please try again.');
    } finally {
      this.isProcessingAnswer.set(false);
    }
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string, type: 'offer' | 'answer'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
      console.log(`${type} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  /**
   * Go back to role selection
   */
  goBack(): void {
    this.webrtc.disconnect();
    this.currentStep.set('choose-role');
    this.errorMessage.set('');
    this.offerQRCode.set('');
    this.answerQRCode.set('');
    this.scannedOfferInput.set('');
    this.scannedAnswerInput.set('');
  }

  /**
   * Close the dialog
   */
  closeDialog(): void {
    this.close.emit();
  }

  /**
   * Update scanned offer input
   */
  updateScannedOffer(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.scannedOfferInput.set(input.value);
  }

  /**
   * Update scanned answer input
   */
  updateScannedAnswer(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.scannedAnswerInput.set(input.value);
  }
}
