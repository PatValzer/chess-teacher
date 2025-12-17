import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chess } from 'chess.js';

@Component({
  selector: 'app-mini-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mini-board-container">
      @for (rank of board(); track $index; let r = $index) { @for (square of rank; track $index; let
      f = $index) {
      <div class="square" [class.light]="(r + f) % 2 === 0" [class.dark]="(r + f) % 2 !== 0">
        @if (square) {
        <img [src]="getPieceUrl(square)" class="piece" alt="" />
        }
      </div>
      } }
    </div>
  `,
  styles: [
    `
      .mini-board-container {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        grid-template-rows: repeat(8, 1fr);
        width: 100%;
        height: 100%;
        border: 1px solid #475569;
      }
      .square {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .light {
        background-color: #f0d9b5;
      }
      .dark {
        background-color: #b58863;
      }
      .piece {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    `,
  ],
})
export class MiniBoardComponent {
  fen = input<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  // 8x8 array of Piece | null
  board = computed(() => {
    const chess = new Chess(this.fen());
    return chess.board();
  });

  getPieceUrl(piece: { type: string; color: string }): string {
    const colorChar = piece.color === 'w' ? 'w' : 'b';
    const pieceChar = piece.type.toUpperCase();
    return `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/${colorChar}${pieceChar}.svg`;
  }
}
