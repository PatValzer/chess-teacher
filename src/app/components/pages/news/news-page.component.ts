import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RssFeedService, NewsItem } from '../../../services/rss-feed.service';

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 bg-slate-900 min-h-screen text-slate-200">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1
              class="text-4xl font-bold mb-2 bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent"
            >
              World News
            </h1>
            <p class="text-slate-400">Latest news from major newspapers in multiple languages</p>
          </div>
          <button
            (click)="refresh()"
            class="px-4 py-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 transition-colors flex items-center gap-2"
          >
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
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Refresh
          </button>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-4 items-center">
          <!-- Language Filter -->
          <div class="flex gap-2">
            <button
              (click)="selectedLanguage.set('all')"
              [class.bg-teal-500]="selectedLanguage() === 'all'"
              [class.text-white]="selectedLanguage() === 'all'"
              [class.bg-slate-800]="selectedLanguage() !== 'all'"
              [class.text-slate-300]="selectedLanguage() !== 'all'"
              class="px-4 py-2 rounded-lg transition-colors font-medium"
            >
              All
            </button>
            <button
              (click)="selectedLanguage.set('it')"
              [class.bg-teal-500]="selectedLanguage() === 'it'"
              [class.text-white]="selectedLanguage() === 'it'"
              [class.bg-slate-800]="selectedLanguage() !== 'it'"
              [class.text-slate-300]="selectedLanguage() !== 'it'"
              class="px-4 py-2 rounded-lg transition-colors font-medium"
            >
              🇮🇹 Italian
            </button>
            <button
              (click)="selectedLanguage.set('en')"
              [class.bg-teal-500]="selectedLanguage() === 'en'"
              [class.text-white]="selectedLanguage() === 'en'"
              [class.bg-slate-800]="selectedLanguage() !== 'en'"
              [class.text-slate-300]="selectedLanguage() !== 'en'"
              class="px-4 py-2 rounded-lg transition-colors font-medium"
            >
              🇬🇧 English
            </button>
            <button
              (click)="selectedLanguage.set('es')"
              [class.bg-teal-500]="selectedLanguage() === 'es'"
              [class.text-white]="selectedLanguage() === 'es'"
              [class.bg-slate-800]="selectedLanguage() !== 'es'"
              [class.text-slate-300]="selectedLanguage() !== 'es'"
              class="px-4 py-2 rounded-lg transition-colors font-medium"
            >
              🇪🇸 Spanish
            </button>
            <button
              (click)="selectedLanguage.set('pt')"
              [class.bg-teal-500]="selectedLanguage() === 'pt'"
              [class.text-white]="selectedLanguage() === 'pt'"
              [class.bg-slate-800]="selectedLanguage() !== 'pt'"
              [class.text-slate-300]="selectedLanguage() !== 'pt'"
              class="px-4 py-2 rounded-lg transition-colors font-medium"
            >
              🇵🇹 Portuguese
            </button>
            <button
              (click)="selectedLanguage.set('fr')"
              [class.bg-teal-500]="selectedLanguage() === 'fr'"
              [class.text-white]="selectedLanguage() === 'fr'"
              [class.bg-slate-800]="selectedLanguage() !== 'fr'"
              [class.text-slate-300]="selectedLanguage() !== 'fr'"
              class="px-4 py-2 rounded-lg transition-colors font-medium"
            >
              🇫🇷 French
            </button>
          </div>

          <!-- Search -->
          <div class="flex-1 min-w-[300px]">
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search news..."
              class="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-teal-500 focus:outline-none text-slate-200 placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      <!-- News Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @if (filteredNews().length === 0) {
        <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-slate-600 mb-4"
          >
            <path
              d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"
            />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8z" />
          </svg>
          <p class="text-lg text-slate-400">
            @if (searchQuery()) { No news found matching your search } @else { Loading news... }
          </p>
        </div>
        } @else { @for (item of filteredNews(); track item.link) {
        <a
          [href]="item.link"
          target="_blank"
          class="block rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all border border-slate-700/50 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/10 overflow-hidden"
        >
          <!-- Image -->
          @if (item.imageUrl) {
          <div class="relative h-48 bg-slate-700/50">
            <img
              [src]="item.imageUrl"
              [alt]="item.title"
              class="w-full h-full object-cover"
              (error)="$any($event.target).style.display = 'none'"
            />
            <!-- Gradient overlay for better text readability -->
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
          </div>
          }

          <div class="p-6">
            <!-- Header -->
            <div class="flex items-start justify-between mb-3">
              <span class="text-2xl" [title]="getLanguageName(item.language)">
                {{ getLanguageFlag(item.language) }}
              </span>
              <span class="text-xs text-slate-500">
                {{ getRelativeTime(item.pubDate) }}
              </span>
            </div>

            <!-- Title -->
            <h3 class="text-lg font-semibold text-slate-200 mb-2 line-clamp-3">
              {{ item.title }}
            </h3>

            <!-- Description -->
            <p class="text-sm text-slate-400 mb-4 line-clamp-3">
              {{ item.description }}
            </p>

            <!-- Source -->
            <div class="flex items-center justify-between pt-4 border-t border-slate-700/50">
              <span class="text-sm font-medium text-teal-400">
                {{ item.source }}
              </span>
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
                class="text-slate-500"
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </div>
          </div>
        </a>

        } }
      </div>
    </div>
  `,
  styles: [
    `
      .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class NewsPageComponent {
  private rssFeedService = inject(RssFeedService);

  selectedLanguage = signal<string>('all');
  searchQuery = signal<string>('');

  filteredNews = computed(() => {
    let news: NewsItem[] = this.rssFeedService.getNewsItems()();

    // Filter by language
    if (this.selectedLanguage() !== 'all') {
      news = news.filter((item: NewsItem) => item.language === this.selectedLanguage());
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      news = news.filter(
        (item: NewsItem) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.source.toLowerCase().includes(query)
      );
    }

    return news;
  });

  getLanguageFlag(language: string): string {
    const flags: Record<string, string> = {
      it: '🇮🇹',
      en: '🇬🇧',
      es: '🇪🇸',
      pt: '🇵🇹',
      fr: '🇫🇷',
    };
    return flags[language] || '🌐';
  }

  getLanguageName(language: string): string {
    const names: Record<string, string> = {
      it: 'Italian',
      en: 'English',
      es: 'Spanish',
      pt: 'Portuguese',
      fr: 'French',
    };
    return names[language] || 'Unknown';
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  async refresh() {
    await this.rssFeedService.refreshFeeds();
  }
}
