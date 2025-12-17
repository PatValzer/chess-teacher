import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RssFeedService, NewsItem } from '../../../../services/rss-feed.service';

@Component({
  selector: 'app-news-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div class="flex items-center gap-2">
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
            class="text-teal-400"
          >
            <path
              d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"
            />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8z" />
          </svg>
          <h3 class="text-lg font-semibold text-slate-200">World News</h3>
        </div>
        <button
          (click)="refresh()"
          class="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          title="Refresh news"
        >
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
            class="text-slate-400"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>
      </div>

      <!-- News List -->
      <div class="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        @if (latestNews().length === 0) {
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <p class="text-sm text-slate-400">Loading news...</p>
        </div>
        } @else { @for (item of latestNews(); track item.link) {
        <a
          [href]="item.link"
          target="_blank"
          class="block rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50 hover:border-teal-500/30 overflow-hidden"
        >
          @if (item.imageUrl) {
          <div class="relative h-32 bg-slate-700/50">
            <img
              [src]="item.imageUrl"
              [alt]="item.title"
              class="w-full h-full object-cover"
              (error)="$any($event.target).style.display = 'none'"
            />
          </div>
          }
          <div class="p-3">
            <div class="flex items-start gap-2 mb-1">
              <span class="text-lg" [title]="getLanguageName(item.language)">
                {{ getLanguageFlag(item.language) }}
              </span>
              <h4 class="text-sm font-medium text-slate-200 line-clamp-2 flex-1">
                {{ item.title }}
              </h4>
            </div>
            <p class="text-xs text-slate-400 line-clamp-2 mb-2 ml-7">
              {{ item.description }}
            </p>
            <div class="flex items-center justify-between text-xs text-slate-500 ml-7">
              <span class="font-medium">{{ item.source }}</span>
              <span>{{ getRelativeTime(item.pubDate) }}</span>
            </div>
          </div>
        </a>
        } }
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 border-t border-slate-700">
        <a
          routerLink="/news"
          class="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 transition-colors text-sm font-medium"
        >
          <span>View All News</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class NewsWidgetComponent {
  private rssFeedService = inject(RssFeedService);

  latestNews = computed(() => this.rssFeedService.getLatestNews(8));

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
