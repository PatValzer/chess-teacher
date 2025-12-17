import { Component, output, inject, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chess } from 'chess.js';
import {
  OpeningDataService,
  OpeningCategory,
  OpeningDetail,
} from '../../../services/opening-data.service';

import { MiniBoardComponent } from '../../board/mini-board/mini-board.component';
import { OpeningPopoverComponent } from '../opening-popover/opening-popover.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';

interface GraphNode {
  id: string;
  data: OpeningDetail;
  x: number;
  y: number;
  width: number;
  height: number;
  fen: string;
  children: GraphNode[];
}

@Component({
  selector: 'app-opening-graph',
  standalone: true,
  imports: [CommonModule, MiniBoardComponent, OpeningPopoverComponent, TranslatePipe],
  templateUrl: './opening-graph.html',
  styleUrls: ['./opening-graph.css'],
})
export class OpeningGraphComponent {
  close = output<void>();

  private openingService = inject(OpeningDataService);

  categories: OpeningCategory[] = [];

  // Navigation State
  activePath: OpeningDetail[] = [];
  currentMoveIndex = signal(0);
  totalMoves = signal(0);

  // Helpers for template
  get currentData(): OpeningDetail | null {
    return this.activePath.length > 0 ? this.activePath[this.activePath.length - 1] : null;
  }

  get currentFen(): string {
    return this.currentData
      ? this.getFenFromMoves(this.currentData.moves, this.currentMoveIndex())
      : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }

  // Modal
  selectedOpening: OpeningDetail | null = null;
  hoveredOpening: OpeningDetail | null = null;

  mouseX = signal(0);
  mouseY = signal(0);
  windowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1024);
  windowHeight = signal(typeof window !== 'undefined' ? window.innerHeight : 768);

  tooltipPosition = computed(() => {
    const x = this.mouseX();
    const y = this.mouseY();
    const w = this.windowWidth();
    const h = this.windowHeight();

    // Panel dimensions (approx)
    const panelW = 340;
    const panelH = 400;

    let posX = x + 20;
    let posY = y + 20;

    // Flip horizontally if too close to right edge
    if (x + panelW + 20 > w) {
      posX = x - panelW - 20;
    }

    // Flip vertically if too close to bottom edge
    if (y + panelH + 20 > h) {
      posY = y - panelH - 20;
    }

    // Ensure not off-screen top/left
    if (posX < 10) posX = 10;
    if (posY < 10) posY = 10;

    return `translate(${posX}px, ${posY}px)`;
  });

  constructor() {
    this.categories = this.openingService.getOpenings();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.windowWidth.set(window.innerWidth);
    this.windowHeight.set(window.innerHeight);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseX.set(event.clientX);
    this.mouseY.set(event.clientY);
  }

  exploreOpening(opening: OpeningDetail) {
    this.activePath.push(opening);
    this.updateMoveIndex();
    this.hoveredOpening = null;
  }

  navigateTo(opening: OpeningDetail) {
    const index = this.activePath.indexOf(opening);
    if (index !== -1) {
      this.activePath = this.activePath.slice(0, index + 1);
      this.updateMoveIndex();
    }
  }

  resetToRoot() {
    this.activePath = [];
  }

  viewDetails() {
    if (this.currentData) {
      this.selectedOpening = this.currentData;
    }
  }

  closeDetails() {
    this.selectedOpening = null;
  }

  onClose() {
    this.close.emit();
  }

  translateKey(prefix: string, id: string, suffix: string): string {
    return `${prefix}.${id.replace(/-/g, '_').toUpperCase()}.${suffix}`;
  }

  // Navigation controls for mini board
  prevMove() {
    if (this.currentMoveIndex() > 0) {
      this.currentMoveIndex.update((i) => i - 1);
    }
  }

  nextMove() {
    if (this.currentMoveIndex() < this.totalMoves()) {
      this.currentMoveIndex.update((i) => i + 1);
    }
  }

  private updateMoveIndex() {
    if (this.currentData) {
      const moves = this.parseMoves(this.currentData.moves);
      this.totalMoves.set(moves.length);
      this.currentMoveIndex.set(moves.length);
    }
  }

  private parseMoves(movesStr: string): string[] {
    const clean = movesStr.replace(/\d+\./g, '').replace(/\./g, '').trim();
    return clean.split(/\s+/).filter((m) => m && m.length > 1);
  }

  getFenFromMoves(movesStr: string, limit?: number): string {
    const chess = new Chess();
    try {
      const moves = this.parseMoves(movesStr);
      const end = limit !== undefined ? limit : moves.length;

      for (let i = 0; i < end; i++) {
        chess.move(moves[i]);
      }
    } catch (e) {}
    return chess.fen();
  }
}
