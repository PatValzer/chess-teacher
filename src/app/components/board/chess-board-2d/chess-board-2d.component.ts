import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  input,
  output,
  effect,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  computed,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chessground } from 'chessground';
import { Api as ChessgroundApi } from 'chessground/api';
import { Config } from 'chessground/config';
import { Key } from 'chessground/types';

@Component({
  selector: 'app-chess-board-2d',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chess-board-2d.component.html',
  styleUrl: './chess-board-2d.component.css',
})
export class ChessBoard2dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('boardContainer', { static: false }) boardContainer!: ElementRef<HTMLDivElement>;

  // Inputs
  fen = input.required<string>();
  orientation = input<'white' | 'black'>('white');
  turnColor = input<'white' | 'black'>('white');
  validMoves = input<Map<Key, Key[]>>(new Map());
  lastMove = input<Key[] | undefined>(undefined); // [from, to] or undefined
  isCheck = input<boolean>(false);

  // Theme inputs
  boardTheme = input<string>('default');
  pieceTheme = input<string>('cburnett');

  // Outputs
  move = output<{ from: Key; to: Key }>();

  private cg!: ChessgroundApi;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // React to FEN or Orientation changes
    effect(() => {
      const fen = this.fen();
      const orientation = this.orientation();
      const turn = this.turnColor();
      const dests = this.validMoves();
      const lastMove = this.lastMove();
      const isCheck = this.isCheck();

      if (this.cg) {
        this.cg.set({
          fen: fen,
          orientation: orientation,
          turnColor: turn,
          check: isCheck,
          movable: {
            color: turn,
            dests: dests,
            free: false,
          },
          lastMove: lastMove as [Key, Key] | undefined,
        });
      }
    });

    // React to theme changes to redraw/reconfigure if needed
    effect(() => {
      const bTheme = this.boardTheme();
      // Chessground theme is mainly CSS class on container, managed in template.
      // But if we needed to trigger redraw:
      if (this.cg) this.cg.redrawAll();
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initChessground();
    }
  }

  private initChessground() {
    const config: Config = {
      fen: this.fen(),
      orientation: this.orientation(),
      turnColor: this.turnColor(),
      movable: {
        color: this.turnColor(),
        free: false,
        dests: this.validMoves(),
        events: {
          after: (orig, dest) => {
            this.move.emit({ from: orig, to: dest });
          },
        },
      },
      draggable: {
        showGhost: true,
      },
      highlight: {
        lastMove: true,
        check: true,
      },
      premovable: {
        enabled: false, // Simplify for now
      },
    };

    this.cg = Chessground(this.boardContainer.nativeElement, config);
  }

  ngOnDestroy() {
    // Chessground cleanup if necessary?
    // usually strictly DOM-bound, automatic GC when element removed.
  }
}

class AppChessBoard2dUtils {
  // Helper if we want to detect check from FEN? No, parent should pass it.
  // We'll ignore the 'check' visual property for a split second or add an input for it.
  static isCheck(fen: string, turn: 'white' | 'black'): boolean | undefined {
    return undefined;
  }
}
