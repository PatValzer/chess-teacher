import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Stockfish, EngineAnalysis } from '../../services/stockfish';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis-panel',
  imports: [CommonModule],
  templateUrl: './analysis-panel.html',
  styleUrl: './analysis-panel.css',
})
export class AnalysisPanel implements OnInit, OnDestroy {
  @Input() fen: string = '';

  analysis = signal<EngineAnalysis | null>(null);
  private subscription?: Subscription;

  // Computed values for display
  evaluationText = computed(() => {
    const a = this.analysis();
    if (!a) return '+0.0';

    if (a.mate !== undefined) {
      return `M${a.mate}`;
    }

    const eval_pawns = (a.evaluation / 100).toFixed(1);
    return a.evaluation >= 0 ? `+${eval_pawns}` : eval_pawns;
  });

  evaluationBar = computed(() => {
    const a = this.analysis();
    if (!a) return 50;

    if (a.mate !== undefined) {
      return a.mate > 0 ? 100 : 0;
    }

    // Convert centipawns to percentage (clamped between 0-100)
    const normalized = 50 + a.evaluation / 10;
    return Math.max(0, Math.min(100, normalized));
  });

  constructor(private stockfish: Stockfish) {}

  ngOnInit() {
    this.subscription = this.stockfish.analysis$.subscribe((analysis) => {
      if (analysis) {
        this.analysis.set(analysis);
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  async showBestMove() {
    if (!this.fen) return;
    const bestMove = await this.stockfish.getBestMove(this.fen);
    alert(`Best move: ${bestMove}`);
  }
}
