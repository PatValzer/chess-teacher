import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpeningService, OpeningResponse, OpeningMove } from '../../services/opening';

@Component({
  selector: 'app-opening-explorer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opening-explorer.html',
  styleUrl: './opening-explorer.css',
})
export class OpeningExplorer implements OnChanges {
  @Input() fen: string = '';
  @Output() moveSelected = new EventEmitter<string>();
  @Output() openingName = new EventEmitter<string>();

  private openingService = inject(OpeningService);

  openingData: OpeningResponse | null = null;
  loading = false;
  error: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fen'] && this.fen) {
      this.fetchOpeningData();
    }
  }

  private fetchOpeningData() {
    this.loading = true;
    this.error = null;

    this.openingService.getOpeningData(this.fen).subscribe({
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
