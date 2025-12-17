import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClasstabService, TabPiece } from '../../../../services/classtab.service';

@Component({
  selector: 'app-classtab-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col py-6 px-4">
      <div class="flex items-center gap-3 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-purple-400"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        <h3 class="text-lg font-semibold text-slate-200">Search Tablature</h3>
      </div>

      <div class="relative mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
          placeholder="Search by piece or composer..."
          class="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      </div>

      <!-- Autocomplete suggestions -->
      <div
        *ngIf="showSuggestions() && suggestions().length > 0"
        class="mb-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700"
      >
        <p class="text-xs text-slate-400 mb-2 px-2">Suggestions:</p>
        <div class="flex flex-wrap gap-1">
          <button
            *ngFor="let composer of suggestions()"
            (click)="selectComposer(composer)"
            class="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 transition-colors"
          >
            {{ composer }}
          </button>
        </div>
      </div>

      <!-- Search results -->
      <div *ngIf="searchQuery()" class="space-y-2 max-h-64 overflow-y-auto">
        <div
          *ngFor="let result of filteredResults()"
          (click)="openTab(result)"
          class="p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors group cursor-pointer"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-md bg-purple-500/20 flex items-center justify-center flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-purple-400"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h4
                class="text-sm font-semibold text-slate-200 group-hover:text-purple-300 transition-colors line-clamp-2"
              >
                {{ result.title }}
              </h4>
              <p class="text-xs text-slate-400 mt-1">{{ result.composer }}</p>
              <div class="flex gap-2 mt-2">
                <span class="text-xs text-purple-400">TAB</span>
                <span *ngIf="result.midiUrl" class="text-xs text-teal-400">MIDI</span>
              </div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-slate-500 group-hover:text-purple-400 transition-colors flex-shrink-0 mt-1"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>

        <div *ngIf="filteredResults().length === 0" class="text-center py-4">
          <p class="text-xs text-slate-500">No results found</p>
        </div>
      </div>

      <div *ngIf="!searchQuery()" class="text-center py-4">
        <p class="text-xs text-slate-500 mb-2">Search classical guitar tablature</p>
        <p class="text-xs text-slate-600">Try: "Asturias", "Bach", "Tárrega"</p>
      </div>
    </div>
  `,
  styles: [
    `
      /* Custom scrollbar for results */
      ::-webkit-scrollbar {
        width: 6px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, 0.3);
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(168, 85, 247, 0.5);
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(168, 85, 247, 0.8);
      }

      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class ClasstabWidgetComponent {
  searchQuery = signal('');
  filteredResults = signal<TabPiece[]>([]);

  // Computed property for composer suggestions
  suggestions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query || query.length < 2) return [];

    return this.classtabService
      .getComposers()
      .filter((composer) => composer.toLowerCase().includes(query))
      .slice(0, 5); // Limit to 5 suggestions
  });

  showSuggestions = computed(() => {
    const query = this.searchQuery().trim();
    return (
      query.length >= 2 && this.suggestions().length > 0 && this.filteredResults().length === 0
    );
  });

  constructor(private classtabService: ClasstabService, private router: Router) {}

  onSearch() {
    const results = this.classtabService.searchPieces(this.searchQuery());
    this.filteredResults.set(results);
  }

  selectComposer(composer: string) {
    this.searchQuery.set(composer);
    this.onSearch();
  }

  openTab(piece: TabPiece) {
    this.router.navigate(['/classtab'], {
      queryParams: {
        url: piece.url,
        title: piece.title,
        composer: piece.composer,
        midiUrl: piece.midiUrl || '',
      },
    });
  }
}
