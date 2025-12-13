import { Component, signal } from '@angular/core';
import { ChessBoard } from './components/chess-board/chess-board';

@Component({
  selector: 'app-root',
  imports: [ChessBoard],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('chess-teacher-app');
}
