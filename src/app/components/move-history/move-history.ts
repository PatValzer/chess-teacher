import { Component, EventEmitter, Input, Output } from '@angular/core';

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
  @Input({ required: true }) movePairs: MovePair[] = [];

  @Output() goToMove = new EventEmitter<number>();
}
