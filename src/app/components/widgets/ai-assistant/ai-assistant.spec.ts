import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiAssistant } from './ai-assistant';
import { Stockfish, EngineAnalysis } from '../../services/stockfish';
import { BehaviorSubject, of } from 'rxjs';
import { OpenRouterService } from '../../services/open-router';

describe('AiAssistant', () => {
  let component: AiAssistant;
  let fixture: ComponentFixture<AiAssistant>;
  let mockStockfish: any;
  let mockOpenRouter: any;
  let analysisSubject: BehaviorSubject<EngineAnalysis | null>;

  beforeEach(async () => {
    analysisSubject = new BehaviorSubject<EngineAnalysis | null>(null);
    mockStockfish = {
      analysis$: analysisSubject.asObservable(),
    };
    mockOpenRouter = {
      generateFeedback: vi.fn().mockReturnValue(
        of({
          feedback: 'Mock AI feedback',
          suggestedMove: 'e2e4',
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [AiAssistant],
      providers: [
        { provide: Stockfish, useValue: mockStockfish },
        { provide: OpenRouterService, useValue: mockOpenRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAssistant);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show "Thinking..." when FEN changes', () => {
    // Set initial FEN
    fixture.componentRef.setInput(
      'currentFen',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );
    fixture.detectChanges(); // Trigger inputs and effects

    expect(component.message()).toBe('Thinking...');
    expect(component.isVisible()).toBe(true);
    expect(component.isAnalyzing()).toBe(true);
  });

  it('should provide feedback when analysis arrives', () => {
    // 1. Initial State (White to move)
    fixture.componentRef.setInput(
      'currentFen',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );
    fixture.detectChanges();

    // 2. Provide analysis for initial position (Let's say +0.3 for white)
    analysisSubject.next({
      evaluation: 30, // +0.3
      depth: 10,
      bestMove: 'e2e4',
      pv: [],
    });
    fixture.detectChanges();

    // Should be "Let's play!" because it's the first move/reset
    expect(component.message()).toBe("Let's play!");
    expect(component.isAnalyzing()).toBe(false);

    // 3. Make a move (Black's turn now).
    // Say we moved e4. New FEN (simplified for test)
    fixture.componentRef.setInput(
      'currentFen',
      '... rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    );
    fixture.detectChanges();

    expect(component.message()).toBe('Thinking...');
    expect(component.isAnalyzing()).toBe(true);

    // 4. Provide analysis for new position.
    // If e4 was good, eval should stay around +0.3 or slightly better.
    // Stockfish eval is usually typically relative to side to move.
    // Wait, my logic in component:
    // const modifier = this.currentTurn === 'w' ? 1 : -1;
    // const whiteEval = score * modifier;

    // New FEN is Black to move ('b').
    // If position is +0.3 for White.
    // Stockfish (relative to Black) would say -30.

    analysisSubject.next({
      evaluation: -30, // -0.3 from Black's perspective
      depth: 10,
      bestMove: 'e7e5',
      pv: [],
    });
    fixture.detectChanges();

    // Logic:
    // currentTurn = 'b'.
    // modifier = -1.
    // whiteEval = -30 * -1 = +30.
    // prevEval from step 2 was +30.
    // diff = 30 - 30 = 0.

    // Mover was 'white' (since now it's black's turn).
    // feedback logic for 'white' mover:
    // 0 is > -50. "Solid move."

    expect(component.message()).toBe('Mock AI feedback');
    expect(component.suggestion()).toBe('e2e4');
  });
});
