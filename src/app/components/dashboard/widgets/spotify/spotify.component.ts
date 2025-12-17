import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface SpotifyPreset {
  name: string;
  type: 'playlist' | 'album' | 'track' | 'artist';
  id: string;
  description: string;
}

@Component({
  selector: 'app-spotify-widget',
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
          fill="currentColor"
          class="text-green-500"
        >
          <path
            d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
          />
        </svg>
        <h3 class="text-lg font-semibold text-slate-200">Spotify Player</h3>
      </div>

      <!-- Preset Buttons -->
      <div class="mb-4">
        <p class="text-xs text-slate-400 mb-2">Quick Select:</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            *ngFor="let preset of presets"
            (click)="loadPreset(preset)"
            class="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg hover:border-green-500 hover:bg-slate-700 transition-all text-left group"
          >
            <div class="font-semibold text-slate-200 group-hover:text-green-400 transition-colors">
              {{ preset.name }}
            </div>
            <div class="text-slate-500 text-[10px] mt-0.5">{{ preset.description }}</div>
          </button>
        </div>
      </div>

      <!-- Custom URL Input -->
      <div class="mb-4">
        <label class="text-xs text-slate-400 mb-2 block">Or paste Spotify URL:</label>
        <div class="flex gap-2">
          <input
            type="text"
            [(ngModel)]="customUrl"
            placeholder="https://open.spotify.com/..."
            class="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
          <button
            (click)="loadCustomUrl()"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Load
          </button>
        </div>
        <p class="text-[10px] text-slate-500 mt-1">
          Supports: playlists, albums, tracks, artists, podcasts
        </p>
      </div>

      <!-- Spotify Player -->
      <div *ngIf="embedUrl()" class="rounded-lg overflow-hidden border border-slate-700">
        <iframe
          [src]="embedUrl()"
          width="100%"
          height="352"
          frameBorder="0"
          allowfullscreen=""
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          class="bg-slate-900"
        ></iframe>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="!embedUrl()"
        class="text-center py-8 border border-dashed border-slate-700 rounded-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="mx-auto text-slate-700 mb-3"
        >
          <path
            d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
          />
        </svg>
        <p class="text-sm text-slate-500 mb-1">No music selected</p>
        <p class="text-xs text-slate-600">Choose a preset or paste a Spotify URL</p>
      </div>
    </div>
  `,
  styles: [
    `
      /* Smooth transitions */
      button {
        transition: all 0.2s ease;
      }
    `,
  ],
})
export class SpotifyWidgetComponent {
  customUrl = '';
  embedUrl = signal<SafeResourceUrl | null>(null);
  currentPreset = signal<SpotifyPreset | null>(null);

  // Curated presets for chess/study/focus music
  presets: SpotifyPreset[] = [
    {
      name: 'Classical Focus',
      type: 'playlist',
      id: '37i9dQZF1DWWEJlAGA9gs0',
      description: 'Classical music for focus',
    },
    {
      name: 'Deep Focus',
      type: 'playlist',
      id: '37i9dQZF1DWZeKCadgRdKQ',
      description: 'Ambient & post-rock',
    },
    {
      name: 'Peaceful Piano',
      type: 'playlist',
      id: '37i9dQZF1DX4sWSpwq3LiO',
      description: 'Relax with beautiful piano',
    },
    {
      name: 'Instrumental Study',
      type: 'playlist',
      id: '37i9dQZF1DX3PFzdbtx1Us',
      description: 'Focus with soft study music',
    },
    {
      name: 'Jazz Vibes',
      type: 'playlist',
      id: '37i9dQZF1DX0SM0LYsmbMT',
      description: 'Chill jazz instrumental',
    },
    {
      name: 'Lo-Fi Beats',
      type: 'playlist',
      id: '37i9dQZF1DWWQRwui0ExPn',
      description: 'Lo-fi hip hop beats',
    },
  ];

  constructor(private sanitizer: DomSanitizer) {}

  loadPreset(preset: SpotifyPreset) {
    const url = this.createEmbedUrl(preset.type, preset.id);
    this.embedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    this.currentPreset.set(preset);
  }

  loadCustomUrl() {
    const url = this.parseSpotifyUrl(this.customUrl);
    if (url) {
      this.embedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } else {
      alert('Invalid Spotify URL. Please paste a valid Spotify link.');
    }
  }

  private createEmbedUrl(type: string, id: string): string {
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
  }

  private parseSpotifyUrl(url: string): string | null {
    // Match Spotify URLs like:
    // https://open.spotify.com/playlist/37i9dQZF1DWWEJlAGA9gs0
    // https://open.spotify.com/album/...
    // https://open.spotify.com/track/...
    const regex = /spotify\.com\/(playlist|album|track|artist|show|episode)\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);

    if (match) {
      const [, type, id] = match;
      return this.createEmbedUrl(type, id);
    }

    return null;
  }
}
