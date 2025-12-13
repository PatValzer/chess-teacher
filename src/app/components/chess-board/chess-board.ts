import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  signal,
  OnDestroy,
} from '@angular/core';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { Color, Key } from 'chessground/types';
import { AnalysisPanel } from '../analysis-panel/analysis-panel';
import { Stockfish } from '../../services/stockfish';

@Component({
  selector: 'app-chess-board',
  imports: [AnalysisPanel],
  templateUrl: './chess-board.html',
  styleUrl: './chess-board.css',
})
export class ChessBoard implements AfterViewInit, OnDestroy {
  @ViewChild('board', { static: false }) boardElement!: ElementRef<HTMLDivElement>;

  private chessground!: Api;
  private chess = new Chess();

  // Signals for reactive state
  fen = signal(this.chess.fen());
  turn = signal<'white' | 'black'>('white');
  isCheck = signal(false);
  isCheckmate = signal(false);
  isStalemate = signal(false);
  moveHistory = signal<string[]>([]);

  constructor(private stockfish: Stockfish) {}

  ngAfterViewInit() {
    this.initializeBoard();
  }

  private initializeBoard() {
    this.chessground = Chessground(this.boardElement.nativeElement, {
      fen: this.chess.fen(),
      orientation: 'white',
      movable: {
        free: false,
        color: 'white',
        dests: this.getValidMoves(),
        events: {
          after: (orig, dest) => this.onMove(orig, dest),
        },
      },
      draggable: {
        showGhost: true,
      },
      highlight: {
        lastMove: true,
        check: true,
      },
    });
  }

  private getValidMoves(): Map<Key, Key[]> {
    const dests = new Map<Key, Key[]>();
    const moves = this.chess.moves({ verbose: true });

    moves.forEach((move) => {
      const from = move.from as Key;
      const to = move.to as Key;

      if (!dests.has(from)) {
        dests.set(from, []);
      }
      dests.get(from)!.push(to);
    });

    return dests;
  }

  private onMove(orig: Key, dest: Key) {
    try {
      const move = this.chess.move({
        from: orig,
        to: dest,
        promotion: 'q', // Always promote to queen for now
      });

      if (move) {
        this.updateGameState();
        this.chessground.set({
          fen: this.chess.fen(),
          turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
          movable: {
            color: this.chess.turn() === 'w' ? 'white' : 'black',
            dests: this.getValidMoves(),
          },
        });
      }
    } catch (e) {
      // Invalid move, reset the board
      this.chessground.set({
        fen: this.chess.fen(),
      });
    }
  }

  private updateGameState() {
    this.fen.set(this.chess.fen());
    this.turn.set(this.chess.turn() === 'w' ? 'white' : 'black');
    this.isCheck.set(this.chess.isCheck());
    this.isCheckmate.set(this.chess.isCheckmate());
    this.isStalemate.set(this.chess.isStalemate());
    this.moveHistory.set(this.chess.history());

    // Trigger Stockfish analysis
    this.stockfish.analyzePosition(this.chess.fen());
  }

  resetGame() {
    this.chess.reset();
    this.chessground.set({
      fen: this.chess.fen(),
      turnColor: 'white',
      movable: {
        color: 'white',
        dests: this.getValidMoves(),
      },
    });
    this.updateGameState();
  }

  undoMove() {
    const move = this.chess.undo();
    if (move) {
      this.chessground.set({
        fen: this.chess.fen(),
        turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
        movable: {
          color: this.chess.turn() === 'w' ? 'white' : 'black',
          dests: this.getValidMoves(),
        },
      });
      this.updateGameState();
    }
  }

  flipBoard() {
    this.chessground.toggleOrientation();
  }

  ngOnDestroy() {
    this.stockfish.destroy();
  }
}
