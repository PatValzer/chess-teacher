import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-action-buttons',
  templateUrl: './action-buttons.html',
  styleUrl: './action-buttons.css',
  standalone: true,
  imports: [TranslatePipe],
})
export class ActionButtons {
  @Input() isMultiplayerMode = false;

  @Output() resetGame = new EventEmitter<void>();
  @Output() undoMove = new EventEmitter<void>();
  @Output() flipBoard = new EventEmitter<void>();
  @Output() toggleOptions = new EventEmitter<void>();
  @Output() openConnectionDialog = new EventEmitter<void>();
  @Output() disconnectMultiplayer = new EventEmitter<void>();
  @Output() toggle3d = new EventEmitter<void>();
}
