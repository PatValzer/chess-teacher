import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  signal,
  OnDestroy,
  computed,
} from '@angular/core';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { Color, Key } from 'chessground/types';
import { AnalysisPanel } from '../analysis-panel/analysis-panel';
import { Stockfish } from '../../services/stockfish';
import { OptionsDialog } from '../options-dialog/options-dialog';
import { OpeningExplorer } from '../opening-explorer/opening-explorer';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-chess-board',
  imports: [AnalysisPanel, OptionsDialog, OpeningExplorer, NgClass],
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
  openingName = signal('');

  movePairs = computed(() => {
    const history = this.moveHistory();
    const pairs: { white: string; black?: string }[] = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        white: history[i],
        black: history[i + 1],
      });
    }
    return pairs;
  });

  // Options
  showOptions = signal(false);
  currentBoardTheme = signal('default');
  currentPieceTheme = signal('default');
  whitePlayerType = signal<'human' | 'computer'>('human');
  blackPlayerType = signal<'human' | 'computer'>('human');
  whiteComputerElo = signal(1350);
  blackComputerElo = signal(1350);

  constructor(private stockfish: Stockfish) {}

  ngAfterViewInit() {
    this.initializeBoard();
  }

  toggleOptions() {
    this.showOptions.update((v) => !v);
  }

  updateSettings(settings: {
    boardTheme: string;
    pieceTheme: string;
    whitePlayerType: 'human' | 'computer';
    blackPlayerType: 'human' | 'computer';
    whiteComputerElo: number;
    blackComputerElo: number;
  }) {
    this.currentBoardTheme.set(settings.boardTheme);
    this.currentPieceTheme.set(settings.pieceTheme);
    this.whitePlayerType.set(settings.whitePlayerType);
    this.blackPlayerType.set(settings.blackPlayerType);
    this.whiteComputerElo.set(settings.whiteComputerElo);
    this.blackComputerElo.set(settings.blackComputerElo);
    console.log('Settings updated:', settings);

    this.applyNewConfig();
    this.checkAiMove();
  }

  private applyNewConfig() {
    this.chessground.set({
      drawable: { visible: true },
    });
    // Forcing a redraw/reconfig for themes usually involves CSS class changes on the container
    // or specific config for pieces if using custom images.
    // We will handle the board class in the template/host binding or a specific method,
    // and pieces via updating the piece set configuration if we were using custom URLs.
    // However, chessground manages pieces via CSS classes or URLs.

    // Let's implement the piece theme logic by updating the global config if possible,
    // or by changing the container class that we will use in CSS to target pieces.
    // Actually, standard Chessground (and how Lichess does it) usually works by applying
    // a class to the board container for the piece set (e.g., 'merida', 'cburnett').

    // So we'll update the board element's class list for standard pieces.
    // For custom pieces we might need more, but let's stick to CSS classes for now.
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

  private async checkAiMove() {
    const isWhiteTurn = this.chess.turn() === 'w';
    const isComputerTurn =
      (isWhiteTurn && this.whitePlayerType() === 'computer') ||
      (!isWhiteTurn && this.blackPlayerType() === 'computer');

    console.log('Checking AI move:', {
      isWhiteTurn,
      isComputerTurn,
      whiteType: this.whitePlayerType(),
      blackType: this.blackPlayerType(),
    });

    if (isComputerTurn && !this.chess.isGameOver()) {
      // Set the correct ELO for the current turn
      const elo = isWhiteTurn ? this.whiteComputerElo() : this.blackComputerElo();
      let depth = this.calculateDepthFromElo(elo);

      // Speed up opening moves (first 10 plies / 5 full moves)
      // by capping depth and reducing delay
      const isOpening = this.chess.history().length < 10;
      let delay = 500;

      if (isOpening) {
        depth = Math.min(depth, 10); // Cap depth at 10 for opening
        delay = 200; // Reduce delay for opening
      }

      // Small delay for realism
      await new Promise((resolve) => setTimeout(resolve, delay));
      await this.makeComputerMove(depth);
    }
  }

  private calculateDepthFromElo(elo: number): number {
    // Map 1350 - 2850 to 1 - 20 (approx)
    // 1350 -> 1
    // 2850 -> 20
    // Linear interpolation:
    const minElo = 1350;
    const maxElo = 2850;
    const minDepth = 1;
    const maxDepth = 20;

    const fraction = (elo - minElo) / (maxElo - minElo);
    const depth = Math.round(minDepth + fraction * (maxDepth - minDepth));
    return Math.max(1, Math.min(20, depth));
  }

  private async makeComputerMove(depth: number) {
    const fen = this.chess.fen();
    console.log(`Making computer move for FEN: ${fen} at DEPTH: ${depth}`);
    try {
      const bestMove = await this.stockfish.getBestMove(fen, depth);
      console.log('Stockfish returned best move:', bestMove);
      if (bestMove) {
        const from = bestMove.substring(0, 2) as Key;
        const to = bestMove.substring(2, 4) as Key;
        this.onMove(from, to);
      } else {
        console.warn('Stockfish failed to return a move (timeout or error).');
      }
    } catch (err) {
      console.error('Error making computer move:', err);
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

    // Check for AI move
    this.checkAiMove();
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

  goToMove(index: number) {
    // index is the 0-based index in the move history array
    // We want the state AFTER this move.
    // So target history length is index + 1.
    const targetLength = index + 1;
    const currentLength = this.chess.history().length;

    if (targetLength >= currentLength) return;

    // Undo until we reach the target state
    // Note: this is destructive (standard undo behavior for this app)
    const undosNeeded = currentLength - targetLength;
    for (let i = 0; i < undosNeeded; i++) {
      this.chess.undo();
    }

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

  flipBoard() {
    this.chessground.toggleOrientation();
  }

  onOpeningMove(uci: string) {
    const from = uci.substring(0, 2) as Key;
    const to = uci.substring(2, 4) as Key;
    this.onMove(from, to);
  }

  onOpeningNameChange(name: string) {
    this.openingName.set(name);
  }

  ngOnDestroy() {
    this.stockfish.destroy();
  }
}
