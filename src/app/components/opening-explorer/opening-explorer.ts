import { Component, effect, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpeningService, OpeningResponse, OpeningMove } from '../../services/opening';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * OpeningExplorer
 *
 * Displays opening book moves and statistics for the current position.
 * Fetches data from the Lichess opening explorer API (via OpeningService).
 */
@Component({
  selector: 'app-opening-explorer',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './opening-explorer.html',
  styleUrl: './opening-explorer.css',
})
export class OpeningExplorer {
  fen = input<string>('');
  moveSelected = output<string>();
  openingName = output<string>();

  private openingService = inject(OpeningService);

  openingData: OpeningResponse | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    effect(() => {
      const fen = this.fen();
      if (fen) {
        this.fetchOpeningData();
      }
    });
  }

  private fetchOpeningData() {
    this.loading = true;
    this.error = null;

    this.openingService.getOpeningData(this.fen()).subscribe({
      next: (data) => {
        this.openingData = data;
        this.loading = false;
        if (data.opening) {
          this.openingName.emit(`${data.opening.eco} ${data.opening.name}`);
        } else {
          this.openingName.emit('');
        }
      },
      error: (err) => {
        console.error('Error fetching opening data', err);
        // Silently fail for explorer, likely end of book or network issue
        this.openingData = null;
        this.loading = false;
        this.openingName.emit('');
      },
    });
  }

  onMoveClick(move: OpeningMove) {
    this.moveSelected.emit(move.uci);
  }

  getTotal(move: OpeningMove): number {
    return move.white + move.black + move.draws;
  }

  getPercentage(current: number, total: number): number {
    if (total === 0) return 0;
    return (current / total) * 100;
  }
}
