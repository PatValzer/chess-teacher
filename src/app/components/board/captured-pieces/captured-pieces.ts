import { Component, input } from '@angular/core';

@Component({
  selector: 'app-captured-pieces',
  templateUrl: './captured-pieces.html',
  styleUrl: './captured-pieces.css',
  standalone: true,
})
export class CapturedPieces {
  pieces = input.required<string[]>();
  color = input.required<'white' | 'black'>(); // Color of the captured pieces (so their image color)
  pieceTheme = input('default');
  orientation = input<'horizontal' | 'vertical'>('horizontal');

  getPieceUrl(piece: string): string {
    const themeMap: Record<string, string> = {
      default: 'cburnett',
      merida: 'merida',
      alpha: 'alpha',
      cheq: 'cheq',
      leipzig: 'leipzig',
    };

    const selectedTheme = themeMap[this.pieceTheme()] || 'cburnett';
    const colorChar = this.color() === 'white' ? 'w' : 'b';
    const pieceChar = piece.toUpperCase();

    return `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${selectedTheme}/${colorChar}${pieceChar}.svg`;
  }
}
