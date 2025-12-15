import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-action-buttons',
  templateUrl: './action-buttons.html',
  styleUrl: './action-buttons.css',
  standalone: true,
  imports: [TranslatePipe],
})
export class ActionButtons {
  isMultiplayerMode = input(false);

  resetGame = output<void>();
  undoMove = output<void>();
  flipBoard = output<void>();
  toggleOptions = output<void>();
  openConnectionDialog = output<void>();
  disconnectMultiplayer = output<void>();
  toggle3d = output<void>();
}
