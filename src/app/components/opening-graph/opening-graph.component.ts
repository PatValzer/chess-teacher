import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Chess } from 'chess.js';
import {
  OpeningDataService,
  OpeningCategory,
  OpeningDetail,
} from '../../services/opening-data.service';

import { MiniBoardComponent } from '../mini-board/mini-board.component';

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
  imports: [CommonModule, TranslatePipe, MiniBoardComponent],
  templateUrl: './opening-graph.html',
  styleUrls: ['./opening-graph.css'],
})
export class OpeningGraphComponent {
  @Output() close = new EventEmitter<void>();

  private openingService = inject(OpeningDataService);

  categories: OpeningCategory[] = [];

  // Navigation State
  activePath: OpeningDetail[] = [];

  // Helpers for template
  get currentData(): OpeningDetail | null {
    return this.activePath.length > 0 ? this.activePath[this.activePath.length - 1] : null;
  }

  get currentFen(): string {
    return this.currentData ? this.getFenFromMoves(this.currentData.moves) : '';
  }

  // Modal
  selectedOpening: OpeningDetail | null = null;

  constructor() {
    this.categories = this.openingService.getOpenings();
  }

  exploreOpening(opening: OpeningDetail) {
    this.activePath.push(opening);
  }

  navigateTo(opening: OpeningDetail) {
    const index = this.activePath.indexOf(opening);
    if (index !== -1) {
      this.activePath = this.activePath.slice(0, index + 1);
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

  getFenFromMoves(movesStr: string): string {
    const chess = new Chess();
    try {
      const clean = movesStr.replace(/\d+\./g, '').replace(/\./g, '').trim();
      const moves = clean.split(/\s+/);
      for (const move of moves) {
        if (move && move.length > 1) chess.move(move);
      }
    } catch (e) {}
    return chess.fen();
  }
}
