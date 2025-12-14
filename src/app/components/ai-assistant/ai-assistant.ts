import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Stockfish, EngineAnalysis } from '../../services/stockfish';
import { OpenRouterService, AiFeedback } from '../../services/open-router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ai-assistant',
  imports: [CommonModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css',
})
export class AiAssistant implements OnInit, OnDestroy {
  currentFen = input<string>('');

  // Event to emit when suggestion is clicked
  suggestionClicked = output<string>();

  message = signal<string>('');
  suggestion = signal<string | undefined>(undefined);
  isVisible = signal<boolean>(false);
  isAnalyzing = signal<boolean>(false);

  // Track previous evaluation to compare against
  // We store it as absolute perspective (positive = white advantage)
  private prevEval: number | null = null;
  private currentTurn: 'w' | 'b' = 'w';

  private analysisSubscription?: Subscription;

  constructor(private stockfish: Stockfish, private openRouter: OpenRouterService) {
    // Effect to reset state when FEN changes (new move)
    effect(() => {
      const fen = this.currentFen(); // dependency tracking
      this.onFenChange(fen);
    });
  }

  ngOnInit() {
    this.analysisSubscription = this.stockfish.analysis$.subscribe((analysis) => {
      this.processAnalysis(analysis);
    });
  }

  ngOnDestroy() {
    this.analysisSubscription?.unsubscribe();
  }

  private onFenChange(fen: string) {
    if (!fen) return;

    // Determine turn from FEN
    const parts = fen.split(' ');
    this.currentTurn = parts[1] as 'w' | 'b';

    // When FEN changes, we are waiting for new analysis
    this.isAnalyzing.set(true);
    this.message.set('Thinking...');
    this.suggestion.set(undefined);
    this.isVisible.set(true);
  }

  private processAnalysis(analysis: EngineAnalysis | null) {
    if (!analysis) return;

    if (this.isAnalyzing()) {
      // Only process once per move (when we are in "thinking" state)

      const score = analysis.evaluation;
      const modifier = this.currentTurn === 'w' ? 1 : -1;
      const whiteEval = score * modifier;

      if (this.prevEval !== null) {
        const diff = whiteEval - this.prevEval;
        // The move that just happened was by the opposite side of currentTurn
        const moverIsWhite = this.currentTurn === 'b';

        // Calculate score change from perspective of mover
        // If mover was white, they want whiteEval to go up (diff > 0)
        // If mover was black, they want whiteEval to go down (diff < 0) -> so -diff should be positive

        const scoreChange = moverIsWhite ? diff : -diff;

        // Call OpenRouter with Stockfish's best move
        this.openRouter
          .generateFeedback(this.currentFen(), scoreChange, moverIsWhite, analysis.bestMove)
          .subscribe((response) => {
            this.message.set(response.feedback);
            this.suggestion.set(response.suggestedMove);
            this.isAnalyzing.set(false);
          });
      } else {
        // First move
        this.message.set('Ready to analyze!');
        this.suggestion.set(undefined);
        this.isAnalyzing.set(false);
      }

      this.prevEval = whiteEval;
    }
  }

  onSuggestionClick() {
    const move = this.suggestion();
    if (move) {
      this.suggestionClicked.emit(move);
    }
  }

  close() {
    this.isVisible.set(false);
  }
}
