import { Component, input, output } from '@angular/core';

export interface MovePair {
  white: string;
  black?: string;
}

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
