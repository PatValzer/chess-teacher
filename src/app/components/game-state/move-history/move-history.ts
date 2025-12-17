import { Component, input, output } from '@angular/core';

export interface MovePair {
  white: string;
  black?: string;
}

/**
 * MoveHistory
 *
 * Displays the list of moves in the game.
 * Allows navigation to previous states (logic handled by parent ChessBoard).
 */
@Component({
  selector: 'app-move-history',
  templateUrl: './move-history.html',
  styleUrl: './move-history.css',
  standalone: true,
})
export class MoveHistory {
  movePairs = input.required<MovePair[]>();

  goToMove = output<number>();
}
