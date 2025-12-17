import { Component, input } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { CapturedPieces } from '../../board/captured-pieces/captured-pieces';

@Component({
  selector: 'app-player-info',
  standalone: true,
  imports: [CommonModule, NgClass, CapturedPieces],
  templateUrl: './player-info.component.html',
  styleUrl: './player-info.component.css',
})
export class PlayerInfoComponent {
  // The color of the player this component represents (e.g. 'white' or 'black')
  color = input.required<'white' | 'black'>();

  // Whether this player is currently the active turn
  isActive = input.required<boolean>();

  // The pieces captured by this player (or captured *from* the opponent?
  // In chess-board.html it passes capturedByBlack() to the top component when orientation is white.
  // When orientation is white, top component is Black player. capturedByBlack means pieces Black has captured.
  // So this is correct: pieces *this* player has captured.)
  capturedPieces = input.required<string[]>();

  pieceTheme = input.required<string>();
  isSmallScreen = input<boolean>(false);
}
