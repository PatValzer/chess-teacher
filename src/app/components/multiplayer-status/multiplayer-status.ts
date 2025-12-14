import { Component, Input } from '@angular/core';
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
  @Input({ required: true }) connectionStatus: ConnectionStatus = 'disconnected';
  @Input({ required: true }) multiplayerRole: ConnectionRole = null;
  @Input({ required: true }) isMyTurn = false;
}
