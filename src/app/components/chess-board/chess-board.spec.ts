import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChessBoard } from './chess-board';
import { Stockfish } from '../../services/stockfish';

describe('ChessBoard', () => {
  let component: ChessBoard;
  let fixture: ComponentFixture<ChessBoard>;
  let mockStockfish: any;

  beforeEach(async () => {
    mockStockfish = {
      analysis$: { subscribe: () => {} },
      analyzePosition: () => {},
      getBestMove: () => Promise.resolve(''),
      destroy: () => {},
    };

    await TestBed.configureTestingModule({
      imports: [ChessBoard],
      providers: [{ provide: Stockfish, useValue: mockStockfish }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChessBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should group moves into pairs', () => {
    // Simulate some moves
    component.moveHistory.set(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']);

    const pairs = component.movePairs();

    expect(pairs.length).toBe(3);
    expect(pairs[0]).toEqual({ white: 'e4', black: 'e5' });
    expect(pairs[1]).toEqual({ white: 'Nf3', black: 'Nc6' });
    expect(pairs[2]).toEqual({ white: 'Bb5', black: undefined });
  });

  it('should handle empty history', () => {
    component.moveHistory.set([]);
    const pairs = component.movePairs();
    expect(pairs.length).toBe(0);
  });
});
