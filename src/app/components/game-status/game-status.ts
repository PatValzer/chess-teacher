import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-game-status',
  templateUrl: './game-status.html',
  styleUrl: './game-status.css',
  standalone: true,
  imports: [TranslatePipe],
})
export class GameStatus {
  @Input({ required: true }) isCheck = false;
  @Input({ required: true }) isCheckmate = false;
  @Input({ required: true }) isStalemate = false;
}
