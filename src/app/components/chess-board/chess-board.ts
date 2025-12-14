import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  signal,
  OnDestroy,
  computed,
  effect,
  inject,
} from '@angular/core';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import { Api as ChessgroundApi } from 'chessground/api';
import { Color, Key } from 'chessground/types';
import { AnalysisPanel } from '../analysis-panel/analysis-panel';
import { Stockfish } from '../../services/stockfish';
import { OptionsDialog } from '../options-dialog/options-dialog';
import { OpeningExplorer } from '../opening-explorer/opening-explorer';
import { NgClass, TitleCasePipe } from '@angular/common';
import { AiAssistant } from '../ai-assistant/ai-assistant';
import { ConnectionDialog } from '../connection-dialog/connection-dialog';
import { WebRTCService, ConnectionRole, ConnectionStatus } from '../../services/webrtc.service';
import { GameSyncService, MoveData } from '../../services/game-sync.service';
import { SettingsService, AppSettings } from '../../services/settings.service';
import { TranslationService } from '../../services/translation.service';

import { ActionButtons } from '../action-buttons/action-buttons';
import { MoveHistory } from '../move-history/move-history';
import { MultiplayerStatus } from '../multiplayer-status/multiplayer-status';
import { CapturedPieces } from '../captured-pieces/captured-pieces';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { GameStatus } from '../game-status/game-status';
import { OpeningGraphComponent } from '../opening-graph/opening-graph.component';
import { ChessBoard3dComponent } from '../chess-board-3d/chess-board-3d.component';

@Component({
  selector: 'app-chess-board',
  imports: [
    AnalysisPanel,
    OptionsDialog,
    OpeningExplorer,
    NgClass,
    AiAssistant,
    TitleCasePipe,
    ConnectionDialog,
    ActionButtons,
    MoveHistory,
    MultiplayerStatus,
    CapturedPieces,
    TranslatePipe,
    GameStatus,
    OpeningGraphComponent,
    ChessBoard3dComponent,
  ],
  templateUrl: './chess-board.html',
  styleUrl: './chess-board.css',
})
export class ChessBoard implements AfterViewInit, OnDestroy {
  @ViewChild('board', { static: false }) boardElement!: ElementRef<HTMLDivElement>;

  private chessgroundApi!: ChessgroundApi;
  private chess = new Chess();
  protected Math = Math;

  // Signals for reactive state
  fen = signal(this.chess.fen());
  turn = signal<'white' | 'black'>('white');
  isCheck = signal(false);
  isCheckmate = signal(false);
  isStalemate = signal(false);
  moveHistory = signal<string[]>([]);
  openingName = signal('');

  // Navigation state
  private redoStack: any[] = [];

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
  // Options - Derived from SettingsService
  private settingsService = inject(SettingsService);
  private translationService = inject(TranslationService);

  showOpeningGraph = signal(false);

  settings = this.settingsService.settings;
  showOptions = signal(false);

  currentBoardTheme = computed(() => this.settings().boardTheme);
  currentPieceTheme = computed(() => this.settings().pieceTheme);

  // Player types are human in multiplayer, otherwise from settings
  whitePlayerType = computed(() =>
    this.isMultiplayerMode() ? 'human' : this.settings().whitePlayerType
  );
  blackPlayerType = computed(() =>
    this.isMultiplayerMode() ? 'human' : this.settings().blackPlayerType
  );

  whiteComputerElo = computed(() => this.settings().whiteComputerElo);
  blackComputerElo = computed(() => this.settings().blackComputerElo);

  language = computed(() => this.settings().language);

  currentBoardThemeChanged = effect(() => {
    const newTheme = this.currentBoardTheme();
    if (this.chessgroundApi) {
      this.chessgroundApi.setShapes;
      this.chessgroundApi.redrawAll();
    }
  });

  getPieceUrl(piece: string, color: 'white' | 'black'): string {
    const themeMap: Record<string, string> = {
      default: 'cburnett',
      merida: 'merida',
      alpha: 'alpha',
      cheq: 'cheq',
      leipzig: 'leipzig',
      // Add others if they exist in options
    };

    // Fallback to cburnett if unknown
    const selectedTheme = themeMap[this.currentPieceTheme()] || 'cburnett';
    const colorChar = color === 'white' ? 'w' : 'b';
    // Piece char should be uppercase for the URL (wP, bN etc are standard in lila repo)
    const pieceChar = piece.toUpperCase();

    return `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${selectedTheme}/${colorChar}${pieceChar}.svg`;
  }

  // Captured pieces
  capturedByWhite = signal<string[]>([]);
  capturedByBlack = signal<string[]>([]);

  // WebRTC Multiplayer
  showConnectionDialog = signal(false);
  isMultiplayerMode = signal(false);
  multiplayerRole = signal<ConnectionRole>(null);
  connectionStatus = signal<ConnectionStatus>('disconnected');
  isMyTurn = signal(true); // In multiplayer, tracks if it's this player's turn

  is3dMode = signal(false);

  toggle3dMode() {
    this.is3dMode.update((v) => !v);

    // If switching back to 2D, we might need to ensure board is redrawn or state is correct
    if (!this.is3dMode()) {
      setTimeout(() => {
        if (this.boardElement) {
          this.initializeBoard();
        }
      }, 50);
    }
  }

  on3dMove(move: { from: string; to: string }) {
    // Convert string to Key
    this.onMove(move.from as Key, move.to as Key);
  }

  constructor(
    private stockfish: Stockfish,
    private webrtc: WebRTCService,
    private gameSync: GameSyncService
  ) {
    // Subscribe to remote moves from peer
    this.gameSync.remoteMoves.subscribe((moveData: MoveData) => {
      this.handleRemoteMove(moveData);
    });

    this.gameSync.remoteResets.subscribe(() => {
      this.resetGame();
    });

    this.gameSync.remoteUndos.subscribe(() => {
      this.undoMove();
    });

    // Subscribe to connection status
    this.webrtc.connectionStatus.subscribe((status) => {
      this.connectionStatus.set(status);
    });

    this.webrtc.role.subscribe((role) => {
      this.multiplayerRole.set(role);
      // Host plays white, guest plays black
      if (role === 'host') {
        this.isMyTurn.set(true); // White starts
      } else if (role === 'guest') {
        this.isMyTurn.set(false); // Black waits
      }
    });

    // Sync language from settings
    effect(() => {
      this.translationService.setLanguage(this.language());
    });
  }

  ngAfterViewInit() {
    this.initializeBoard();
  }

  toggleOptions() {
    this.showOptions.update((v) => !v);
  }

  toggleOpeningGraph() {
    this.showOpeningGraph.update((v) => !v);
  }

  updateSettings(newSettings: Partial<AppSettings>) {
    this.settingsService.updateSettings(newSettings);
    // console.log('Settings updated:', newSettings); // Optional logging

    this.applyNewConfig();
    this.checkAiMove();
  }

  private applyNewConfig() {
    this.chessgroundApi.set({
      drawable: { visible: true },
    });
    // Forcing a redraw/reconfig for themes usually involves CSS class changes on the container
    // or specific config for pieces if using custom images.
    // We will handle the board class in the template/host binding or a specific method,
    // and pieces via updating the piece set configuration if we were using custom URLs.
    // Actually, chessground manages pieces via CSS classes or URLs.

    // Let's implement the piece theme logic by updating the global config if possible,
    // or by changing the container class that we will use in CSS to target pieces.
    // Actually, standard Chessground (and how Lichess does it) usually works by applying
    // a class to the board container for the piece set (e.g., 'merida', 'cburnett').

    // So we'll update the board element's class list for standard pieces.
    // For custom pieces we might need more, but let's stick to CSS classes for now.
  }

  private initializeBoard() {
    this.chessgroundApi = Chessground(this.boardElement.nativeElement, {
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
    // In multiplayer mode, check if it's this player's turn
    if (this.isMultiplayerMode() && !this.isMyTurn()) {
      console.warn('Not your turn!');
      this.chessgroundApi.set({
        fen: this.chess.fen(),
      });
      return;
    }

    try {
      const move = this.chess.move({
        from: orig,
        to: dest,
        promotion: 'q', // Always promote to queen for now
      });

      if (move) {
        this.updateGameState();
        this.chessgroundApi.set({
          fen: this.chess.fen(),
          turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
          movable: {
            color: this.chess.turn() === 'w' ? 'white' : 'black',
            dests: this.getValidMoves(),
          },
        });

        // Send move to peer if in multiplayer mode
        if (this.isMultiplayerMode() && this.connectionStatus() === 'connected') {
          this.gameSync.sendMove(orig, dest, move.promotion, this.chess.fen());
          this.isMyTurn.set(false); // Now it's opponent's turn
        }

        // Clear redo stack on new move
        this.redoStack = [];
        this.updateGameState();
      }
    } catch (e) {
      // Invalid move, reset the board
      this.chessgroundApi.set({
        fen: this.chess.fen(),
      });
    }
  }

  private async checkAiMove() {
    // If we are reviewing history (redoStack not empty), don't make AI moves
    if (this.redoStack.length > 0) return;

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

    // Combine history: current history + reversed redo stack
    const futureMoves = [...this.redoStack].reverse().map((m) => m.san);
    this.moveHistory.set([...this.chess.history(), ...futureMoves]);

    // Calculate captured pieces
    const history = this.chess.history({ verbose: true });
    const whiteCaptures: string[] = [];
    const blackCaptures: string[] = [];

    for (const move of history) {
      if (move.captured) {
        if (move.color === 'w') {
          whiteCaptures.push(move.captured);
        } else {
          blackCaptures.push(move.captured);
        }
      }
    }

    const sortOrder: Record<string, number> = { q: 1, r: 2, b: 3, n: 4, p: 5 };
    const sorter = (a: string, b: string) => sortOrder[a] - sortOrder[b];

    whiteCaptures.sort(sorter);
    blackCaptures.sort(sorter);

    this.capturedByWhite.set(whiteCaptures);
    this.capturedByBlack.set(blackCaptures);

    // Trigger Stockfish analysis
    this.stockfish.analyzePosition(this.chess.fen());

    // Check for AI move
    this.checkAiMove();
  }

  resetGame() {
    this.chess.reset();
    this.redoStack = [];
    this.chessgroundApi.set({
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
    this.stepBack();
  }

  stepBack() {
    const move = this.chess.undo();
    if (move) {
      this.redoStack.push(move);
      this.updateBoardState();
      this.updateGameState();
    }
  }

  stepForward() {
    const move = this.redoStack.pop();
    if (move) {
      this.chess.move(move);
      this.updateBoardState();
      this.updateGameState();
    }
  }

  goToStart() {
    while (this.chess.history().length > 0) {
      const move = this.chess.undo();
      if (move) this.redoStack.push(move);
    }
    this.updateBoardState();
    this.updateGameState();
  }

  goToEnd() {
    while (this.redoStack.length > 0) {
      const move = this.redoStack.pop();
      if (move) this.chess.move(move);
    }
    this.updateBoardState();
    this.updateGameState();
  }

  goToMove(index: number) {
    // Target move number (1-based because index maps to the move at that index, so we want the state after move index+1)
    // Actually, index 0 is 1. View. target length = 1.
    const targetLength = index + 1;
    const currentLength = this.chess.history().length;

    if (targetLength === currentLength) return;

    if (targetLength < currentLength) {
      // Go back
      while (this.chess.history().length > targetLength) {
        const move = this.chess.undo();
        if (move) this.redoStack.push(move);
      }
    } else {
      // Go forward
      while (this.chess.history().length < targetLength && this.redoStack.length > 0) {
        const move = this.redoStack.pop();
        if (move) this.chess.move(move);
      }
    }

    this.updateBoardState();
    this.updateGameState();
  }

  private updateBoardState() {
    this.chessgroundApi.set({
      fen: this.chess.fen(),
      turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
      movable: {
        color: this.chess.turn() === 'w' ? 'white' : 'black',
        dests: this.getValidMoves(),
      },
      lastMove:
        this.chess.history({ verbose: true }).length > 0
          ? [
              this.chess.history({ verbose: true }).pop()!.from,
              this.chess.history({ verbose: true }).pop()!.to,
            ]
          : undefined,
    });
  }

  orientation = signal<'white' | 'black'>('white');

  flipBoard() {
    this.chessgroundApi.toggleOrientation();
    this.orientation.update((o) => (o === 'white' ? 'black' : 'white'));
  }

  onOpeningMove(uci: string) {
    const from = uci.substring(0, 2) as Key;
    const to = uci.substring(2, 4) as Key;
    this.onMove(from, to);
  }

  onOpeningNameChange(name: string) {
    this.openingName.set(name);
  }

  makeSuggestedMove(move: string) {
    if (!move) return;

    // Try to parse move (it might be UCI "e2e4" or SAN "Nf3")
    // Chess.js move() handles both if we pass the string as 'move' or 'san'
    try {
      let result = this.chess.move(move);
      if (!result) {
        // If failed, maybe it's UCI? chess.js .move({from, to}) needs specific object for UCI-like inputs usually,
        // but .move('e2e4') works in some versions, or we need to parse it.
        // Stockfish returns UCI usually (long algebraic).
        // Let's check length of move.
        if (move.length === 4 || move.length === 5) {
          const from = move.substring(0, 2) as Key;
          const to = move.substring(2, 4) as Key;
          const promotion = move.length === 5 ? move[4] : undefined;
          result = this.chess.move({ from, to, promotion: promotion as any });
        }
      }

      if (result) {
        this.chessgroundApi.move(result.from, result.to);
        this.updateGameState();
      } else {
        console.warn('Could not make suggested move:', move);
      }
    } catch (e) {
      console.error('Error making suggested move:', e);
    }
  }

  // Multiplayer Methods
  openConnectionDialog(): void {
    this.showConnectionDialog.set(true);
  }

  closeConnectionDialog(): void {
    this.showConnectionDialog.set(false);
  }

  onConnectionEstablished(role: ConnectionRole): void {
    this.isMultiplayerMode.set(true);
    this.multiplayerRole.set(role);
    this.showConnectionDialog.set(false);

    // Reset game for new multiplayer session
    this.resetGame();

    // Disable AI when in multiplayer mode is handled by computed signals using isMultiplayerMode()
  }

  disconnectMultiplayer(): void {
    this.webrtc.disconnect();
    this.isMultiplayerMode.set(false);
    this.multiplayerRole.set(null);
    this.isMyTurn.set(true);
  }

  /**
   * Handle a move received from the remote peer
   */
  private handleRemoteMove(moveData: MoveData): void {
    console.log('Received remote move:', moveData);

    try {
      // Make the move on our board
      const move = this.chess.move({
        from: moveData.from,
        to: moveData.to,
        promotion: moveData.promotion as any,
      });

      if (move) {
        // Update the visual board
        this.chessgroundApi.set({
          fen: this.chess.fen(),
          turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
          movable: {
            color: this.chess.turn() === 'w' ? 'white' : 'black',
            dests: this.getValidMoves(),
          },
        });

        this.updateGameState();
        this.isMyTurn.set(true); // Now it's our turn
      } else {
        console.error('Failed to apply remote move');
        // Sync game state
        this.chess.load(moveData.fen);
        this.chessgroundApi.set({
          fen: moveData.fen,
        });
        this.updateGameState();
      }
    } catch (error) {
      console.error('Error handling remote move:', error);
    }
  }

  ngOnDestroy() {
    this.stockfish.destroy();
    this.webrtc.disconnect();
  }
}
