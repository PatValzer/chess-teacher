import { Component, input } from '@angular/core';
import { ConnectionRole, ConnectionStatus } from '../../services/webrtc.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-multiplayer-status',
  templateUrl: './multiplayer-status.html',
  styleUrl: './multiplayer-status.css',
  standalone: true,
  imports: [TranslatePipe],
})
export class MultiplayerStatus {
  connectionStatus = input.required<ConnectionStatus>();
  multiplayerRole = input.required<ConnectionRole>();
  isMyTurn = input.required<boolean>();
}
