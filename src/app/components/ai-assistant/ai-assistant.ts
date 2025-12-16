import { Component, OnInit, OnDestroy, signal, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Stockfish, EngineAnalysis } from '../../services/stockfish';
import { OpenRouterService, AiFeedback } from '../../services/open-router';
import { SettingsService } from '../../services/settings.service';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * AiAssistant
 *
 * Provides an AI-powered chat interface for move explanations and suggestions.
 * Integrates:
 * - Stockfish analysis for objective evaluation.
 * - OpenRouter (LLM) for natural language feedback.
 */
@Component({
  selector: 'app-ai-assistant',
  imports: [CommonModule, TranslatePipe],
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

  showLevelSelection = signal<boolean>(false);

  // Toolbar state
  isCollapsed = signal<boolean>(true);

  // Track previous evaluation to compare against
  // We store it as absolute perspective (positive = white advantage)
  private prevEval: number | null = null;
  private currentTurn: 'w' | 'b' = 'w';

  private analysisSubscription?: Subscription;

  constructor(
    private stockfish: Stockfish,
    private openRouter: OpenRouterService,
    private settingsService: SettingsService
  ) {
    // Effect to reset state when FEN changes (new move)
    effect(() => {
      const fen = this.currentFen(); // dependency tracking
      this.onFenChange(fen);
    });
  }

  // Toggle Collapse
  toggleCollapse() {
    this.isCollapsed.update((v) => !v);
  }

  ngOnInit() {
    this.analysisSubscription = this.stockfish.analysis$.subscribe((analysis) => {
      this.processAnalysis(analysis);
    });

    // Check if user level is set
    const settings = this.settingsService.settings();
    if (!settings.userLevel) {
      setTimeout(() => {
        this.askForLevel();
      }, 1000); // Small delay to appear after load
    }
  }

  private askForLevel() {
    this.isVisible.set(true);
    this.isCollapsed.set(false); // Ensure it's open to ask
    this.message.set('AI.ASK_LEVEL');
    this.showLevelSelection.set(true);
  }

  selectLevel(level: 'beginner' | 'intermediate' | 'advanced') {
    this.settingsService.updateSettings({ userLevel: level });
    this.showLevelSelection.set(false);
    this.message.set('AI.READY');

    // If we have a position, re-trigger analysis if needed or just wait for next move
    // For now, just setting ready state.
  }

  ngOnDestroy() {
    this.analysisSubscription?.unsubscribe();
  }

  private onFenChange(fen: string) {
    if (!fen) return;

    // If we are selecting level, don't interrupt
    if (this.showLevelSelection()) return;

    // Determine turn from FEN
    const parts = fen.split(' ');
    this.currentTurn = parts[1] as 'w' | 'b';

    // When FEN changes, we are waiting for new analysis
    this.isAnalyzing.set(true);
    this.message.set('AI.THINKING');
    this.suggestion.set(undefined);
    this.isVisible.set(true);
    // Note: We don't auto-expand here to avoid annoyance,
    // but we could if the user wants auto-pop.
    // Let's keep existing state.
  }

  private processAnalysis(analysis: EngineAnalysis | null) {
    if (!analysis) return;
    if (this.showLevelSelection()) return;

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
        const settings = this.settingsService.settings();
        const language = settings.language;
        const userLevel = settings.userLevel || 'beginner';

        this.openRouter
          .generateFeedback(
            this.currentFen(),
            scoreChange,
            this.currentTurn === 'w',
            analysis.bestMove,
            language,
            userLevel
          )
          .subscribe((response) => {
            this.message.set(response.feedback);
            this.suggestion.set(response.suggestedMove);
            this.isAnalyzing.set(false);
          });
      } else {
        // First move
        this.message.set('AI.READY');
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
