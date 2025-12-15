import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-promotion-dialog',
  templateUrl: './promotion-dialog.html',
  styleUrl: './promotion-dialog.css',
  standalone: true,
  imports: [],
})
export class PromotionDialog {
  @Input() visible = false;
  @Input() color: 'white' | 'black' = 'white';
  @Input() pieceTheme = 'default';

  @Output() promotionSelected = new EventEmitter<'q' | 'r' | 'b' | 'n'>();
  @Output() cancelled = new EventEmitter<void>();

  // Helper to get piece URL (duplicated from ChessBoard for self-containment)
  getPieceUrl(piece: string): string {
    const themeMap: Record<string, string> = {
      default: 'cburnett',
      merida: 'merida',
      alpha: 'alpha',
      cheq: 'cheq',
      leipzig: 'leipzig',
    };

    const selectedTheme = themeMap[this.pieceTheme] || 'cburnett';
    const colorChar = this.color === 'white' ? 'w' : 'b';
    const pieceChar = piece.toUpperCase();

    return `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${selectedTheme}/${colorChar}${pieceChar}.svg`;
  }

  select(piece: 'q' | 'r' | 'b' | 'n') {
    this.promotionSelected.emit(piece);
  }

  cancel() {
    this.cancelled.emit();
  }
}
