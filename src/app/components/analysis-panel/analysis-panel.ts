import { Component, OnInit, OnDestroy, signal, computed, input } from '@angular/core';
import { Stockfish, EngineAnalysis } from '../../services/stockfish';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-analysis-panel',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './analysis-panel.html',
  styleUrl: './analysis-panel.css',
})
export class AnalysisPanel implements OnInit, OnDestroy {
  fen = input<string>('');

  analysis = signal<EngineAnalysis | null>(null);
  private subscription?: Subscription;

  // Computed values for display
  evaluationText = computed(() => {
    const a = this.analysis();
    if (!a) return '+0.0';

    const turn = this.fen().split(' ')[1] || 'w';
    const modifier = turn === 'b' ? -1 : 1;

    if (a.mate !== undefined) {
      const mateValue = a.mate * modifier;
      return `M${mateValue}`;
    }

    const eval_points = ((a.evaluation * modifier) / 100).toFixed(1);
    const abs_eval = a.evaluation * modifier;
    return abs_eval >= 0 ? `+${eval_points}` : eval_points;
  });

  evaluationBar = computed(() => {
    const a = this.analysis();
    if (!a) return 50;

    const turn = this.fen().split(' ')[1] || 'w';
    const modifier = turn === 'b' ? -1 : 1;

    if (a.mate !== undefined) {
      const mateValue = a.mate * modifier;
      return mateValue > 0 ? 100 : 0;
    }

    // Convert centipawns to percentage (clamped between 0-100)
    // 50% is 0.0 eval. +1000cp (10 pawns) = 100%, -1000cp = 0%
    const score = a.evaluation * modifier;
    const normalized = 50 + score / 10; // Adjusted scale for better visual resolution
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
    if (!this.fen()) return;
    const bestMove = await this.stockfish.getBestMove(this.fen());
    alert(`Best move: ${bestMove}`);
  }
}
