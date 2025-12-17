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
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, NgClass } from '@angular/common';
import { Chess } from 'chess.js';
import { Key } from 'chessground/types';
import { AnalysisPanel } from '../widgets/analysis-panel/analysis-panel';
import { Stockfish } from '../../services/stockfish';
import { OptionsDialog } from '../dialogs/options-dialog/options-dialog';
import { OpeningExplorer } from '../opening/opening-explorer/opening-explorer';
import { AiAssistant } from '../widgets/ai-assistant/ai-assistant';
import { ConnectionDialog } from '../dialogs/connection-dialog/connection-dialog';
import { WebRTCService, ConnectionRole, ConnectionStatus } from '../../services/webrtc.service';
import { GameSyncService, MoveData } from '../../services/game-sync.service';
import { SettingsService, AppSettings } from '../../services/settings.service';
import { TranslationService } from '../../services/translation.service';
import { ComputerPlayerService } from '../../services/computer-player.service';

import { ActionButtons } from '../widgets/action-buttons/action-buttons';
import { GameNavigationComponent } from '../game-state/game-navigation/game-navigation.component';
import { MoveHistory } from '../game-state/move-history/move-history';
import { MultiplayerStatus } from '../game-state/multiplayer-status/multiplayer-status';
import { PlayerInfoComponent } from '../game-state/player-info/player-info.component';
import { GameStatus } from '../game-state/game-status/game-status';
import { OpeningGraphComponent } from '../opening/opening-graph/opening-graph.component';
import { OpeningMapButtonComponent } from '../opening/opening-map-button/opening-map-button.component';
import { ChessBoard3dComponent } from '../board/chess-board-3d/chess-board-3d.component';
import { ChessBoard2dComponent } from '../board/chess-board-2d/chess-board-2d.component';
import { PromotionDialog } from '../dialogs/promotion-dialog/promotion-dialog';

/**
 * ChessBoard
 *
 * The main component responsible for the game interface (Game Page).
 * It orchestrates:
 * - Chess.js for game logic and move validation.
 * - 2D and 3D board components for visualization.
 * - Stockfish for AI analysis and opponent moves.
 * - WebRTC for multiplayer connectivity.
 * - Various sub-components for history, capture, and analysis.
 */
@Component({
  selector: 'app-chess-board',
  imports: [
    CommonModule,
    AnalysisPanel,
    OpeningExplorer,
    AiAssistant,
    ChessBoard3dComponent,
    ChessBoard2dComponent,
    ActionButtons,
    GameNavigationComponent,
    MoveHistory,
    MultiplayerStatus,
    PlayerInfoComponent,
    GameStatus,
    OpeningGraphComponent,
    OpeningMapButtonComponent,
    PromotionDialog,
    OptionsDialog,
    ConnectionDialog,
  ],
  templateUrl: './chess-board.html',
  styleUrl: './chess-board.css',
})
export class ChessBoard implements AfterViewInit, OnDestroy {
  // @ViewChild('board', { static: false }) boardElement!: ElementRef<HTMLDivElement>; // Removed

  // Responsive state
  isSmallScreen = signal(false);
  private mediaQueryList: MediaQueryList | null = null;
  private mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

  // private chessgroundApi!: ChessgroundApi; // Removed
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
  canUndo = signal(false);
  canRedo = signal(false);

  // State for child components
  validMoves = signal<Map<Key, Key[]>>(new Map());
  lastMove = signal<Key[] | undefined>(undefined);

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
  currentAppTheme = computed(() => this.settings().appTheme || 'default');

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

  // Note: currentBoardThemeChanged effect removed as child handles it via input

  getPieceUrl(piece: string, color: 'white' | 'black'): string {
    const themeMap: Record<string, string> = {
      default: 'cburnett',
      merida: 'merida',
      alpha: 'alpha',
      maestro: 'maestro',
      leipzig: 'leipzig',
      fantasy: 'fantasy',
      spatial: 'spatial',
      celtic: 'celtic',
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

  // Promotion
  showPromotionDialog = signal(false);
  pendingPromotionMove: { from: Key; to: Key } | null = null;
  promotionColor: 'white' | 'black' = 'white';

  onPromotionSelected(promotion: 'q' | 'r' | 'b' | 'n') {
    if (this.pendingPromotionMove) {
      const { from, to } = this.pendingPromotionMove;
      this.executeMove(from, to, promotion);
      this.showPromotionDialog.set(false);
      this.pendingPromotionMove = null;
    }
  }

  onPromotionCancelled() {
    this.showPromotionDialog.set(false);
    this.pendingPromotionMove = null;
    // Revert board state on child by forcing signal update
    this.fen.set(this.chess.fen());
  }

  is3dMode = signal(false);

  toggle3dMode() {
    this.is3dMode.update((v) => !v);
  }

  on3dMove(move: { from: string; to: string }) {
    // Convert string to Key
    this.onMove(move.from as Key, move.to as Key);
  }

  constructor(
    private stockfish: Stockfish,
    private webrtc: WebRTCService,
    private gameSync: GameSyncService,
    private computerPlayer: ComputerPlayerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.mediaQueryList = window.matchMedia('(max-width: 900px)');
      this.isSmallScreen.set(this.mediaQueryList.matches);

      this.mediaQueryListener = (e: MediaQueryListEvent) => {
        this.isSmallScreen.set(e.matches);
      };

      this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
    }
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
    // Initialization handled by child component via signals
    // Need to set initial valid moves
    this.updateGameState();
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

    // this.applyNewConfig(); // Handled by child
    this.checkAiMove();
  }

  // private applyNewConfig() { ... } // Removed

  // private initializeBoard() { ... } // Removed

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

  onMove(orig: Key, dest: Key) {
    // In multiplayer mode, check if it's this player's turn
    if (this.isMultiplayerMode() && !this.isMyTurn()) {
      console.warn('Not your turn!');
      // Force update to reset child board
      this.fen.set(this.chess.fen());
      return;
    }

    // Check for promotion
    const moves = this.chess.moves({ verbose: true });
    const isPromotion = moves.some((m) => m.from === orig && m.to === dest && m.promotion);

    if (isPromotion) {
      this.pendingPromotionMove = { from: orig, to: dest };
      this.promotionColor = this.chess.turn() === 'w' ? 'white' : 'black';
      this.showPromotionDialog.set(true);
      return;
    }

    this.executeMove(orig, dest, 'q');
  }

  private executeMove(orig: Key, dest: Key, promotion: string = 'q') {
    try {
      const move = this.chess.move({
        from: orig,
        to: dest,
        promotion: promotion as string,
      });

      if (move) {
        this.updateGameState();

        // Child component reacts to fen change.

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
      this.fen.set(this.chess.fen());
    }
  }

  private async checkAiMove() {
    // If we are reviewing history (redoStack not empty), don't make AI moves
    if (this.redoStack.length > 0) return;

    const isWhiteTurn = this.chess.turn() === 'w';
    const isComputerTurn =
      (isWhiteTurn && this.whitePlayerType() === 'computer') ||
      (!isWhiteTurn && this.blackPlayerType() === 'computer');

    if (isComputerTurn && !this.chess.isGameOver()) {
      const elo = isWhiteTurn ? this.whiteComputerElo() : this.blackComputerElo();
      const moveCount = this.chess.history().length;
      const isOpening = moveCount < 10;

      const bestMove = await this.computerPlayer.getBestMove(
        this.chess.fen(),
        elo,
        moveCount,
        isOpening
      );

      if (bestMove) {
        const from = bestMove.substring(0, 2) as Key;
        const to = bestMove.substring(2, 4) as Key;
        const promotion = bestMove.length === 5 ? bestMove[4] : undefined;
        this.executeMove(from, to, promotion);
      }
    }
  }

  private updateGameState() {
    this.fen.set(this.chess.fen());
    this.turn.set(this.chess.turn() === 'w' ? 'white' : 'black');
    this.isCheck.set(this.chess.isCheck());
    this.isCheckmate.set(this.chess.isCheckmate());
    this.isStalemate.set(this.chess.isStalemate());

    // Update valid moves for the child
    this.validMoves.set(this.getValidMoves());

    // Update last move
    const verboseHistory = this.chess.history({ verbose: true });
    if (verboseHistory.length > 0) {
      const last = verboseHistory[verboseHistory.length - 1];
      this.lastMove.set([last.from as Key, last.to as Key]);
    } else {
      this.lastMove.set(undefined);
    }

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

    this.canUndo.set(this.chess.history().length > 0);
    this.canRedo.set(this.redoStack.length > 0);

    // Trigger Stockfish analysis
    this.stockfish.analyzePosition(this.chess.fen());

    // Check for AI move
    this.checkAiMove();
  }

  resetGame() {
    this.chess.reset();
    this.redoStack = [];
    this.updateGameState();
  }

  undoMove() {
    this.stepBack();
  }

  stepBack() {
    const move = this.chess.undo();
    if (move) {
      this.redoStack.push(move);
      this.updateGameState();
    }
  }

  stepForward() {
    const move = this.redoStack.pop();
    if (move) {
      this.chess.move(move);
      this.updateGameState();
    }
  }

  goToStart() {
    while (this.chess.history().length > 0) {
      const move = this.chess.undo();
      if (move) this.redoStack.push(move);
    }
    this.updateGameState();
  }

  goToEnd() {
    while (this.redoStack.length > 0) {
      const move = this.redoStack.pop();
      if (move) this.chess.move(move);
    }
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

    this.updateGameState();
  }

  // private updateBoardState() { ... } // Removed or integrated into updateGameState

  orientation = signal<'white' | 'black'>('white');

  flipBoard() {
    // this.chessgroundApi.toggleOrientation(); // Removed
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
          const promotion = move.length === 5 ? move[4] : 'q';
          this.executeMove(from, to, promotion);
          // result = undefined; // handled by executeMove, but we need return value to know if success?
          // executeMove doesn't return value.
          // Let's rely on executeMove. But the original code relied on 'result' to move chessground logic which duplicate executeMove logic.
          return;
        }
      }

      if (result) {
        // this.chessgroundApi.move(result.from, result.to); // Removed
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
        // Visual board update handled by reactive state (fen, etc)
        this.updateGameState();
        this.isMyTurn.set(true); // Now it's our turn
      } else {
        console.error('Failed to apply remote move');
        // Sync game state
        this.chess.load(moveData.fen);
        // this.chessgroundApi.set({ ... }); // Removed
        this.updateGameState();
      }
    } catch (error) {
      console.error('Error handling remote move:', error);
    }
  }

  ngOnDestroy() {
    this.stockfish.destroy();
    this.webrtc.disconnect();

    if (this.mediaQueryList && this.mediaQueryListener) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
    }
  }
}
