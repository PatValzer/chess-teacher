import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpeningDetail } from '../../../services/opening-data.service';
import { MiniBoardComponent } from '../../board/mini-board/mini-board.component';
import { Chess } from 'chess.js';

@Component({
  selector: 'app-opening-popover',
  standalone: true,
  imports: [CommonModule, MiniBoardComponent],
  template: `
    <div
      class="w-80 bg-slate-900/95 border border-slate-600/50 p-5 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in-up pointer-events-none"
    >
      <!-- Mini Board of hovered opening -->
      <div
        class="aspect-square w-full mb-4 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 shadow-inner"
      >
        <app-mini-board [fen]="openingFen()"></app-mini-board>
      </div>

      <h3 class="text-lg font-bold text-white mb-1 leading-tight">{{ opening()?.name }}</h3>
      <code class="text-xs text-teal-400 mb-2 block font-mono bg-slate-950/30 p-1 rounded w-fit">{{
        opening()?.moves
      }}</code>
      <p class="text-xs text-slate-300 mb-3 leading-relaxed">{{ opening()?.description }}</p>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 gap-2 text-[10px]">
        @if (opening()?.goodFor?.length) {
        <div class="text-emerald-400">
          <span class="font-bold block uppercase tracking-wider text-emerald-500/70 mb-0.5"
            >Good For</span
          >
          {{ opening()?.goodFor?.[0] }}
        </div>
        } @if (opening()?.badFor?.length) {
        <div class="text-rose-400">
          <span class="font-bold block uppercase tracking-wider text-rose-500/70 mb-0.5"
            >Bad For</span
          >
          {{ opening()?.badFor?.[0] }}
        </div>
        }
      </div>
    </div>
  `,
})
export class OpeningPopoverComponent {
  opening = input<OpeningDetail | null>(null);

  openingFen() {
    const op = this.opening();
    if (!op) return '';
    const chess = new Chess();
    try {
      const moves = op.moves.replace(/\d+\./g, '').replace(/\./g, '').trim().split(/\s+/);
      for (const move of moves) {
        if (move && move.length > 1) chess.move(move);
      }
    } catch (e) {}
    return chess.fen();
  }
}
