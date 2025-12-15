import { Component, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-game-status',
  templateUrl: './game-status.html',
  styleUrl: './game-status.css',
  standalone: true,
  imports: [TranslatePipe],
})
export class GameStatus {
  isCheck = input.required<boolean>();
  isCheckmate = input.required<boolean>();
  isStalemate = input.required<boolean>();
}
