import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TabPiece } from '../../../services/classtab.service';
import { SanitizeUrlPipe } from '../../../pipes/sanitize-url.pipe';
import { ClasstabStorageService, StoredTab } from '../../../services/classtab-storage.service';
import MidiPlayer from 'midi-player-js';
import Soundfont from 'soundfont-player';

@Component({
  selector: 'app-classtab-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SanitizeUrlPipe],
  templateUrl: './classtab-page.component.html',
  styleUrl: './classtab-page.component.css',
})
export class ClasstabPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('iframeContainer', { static: false }) iframeContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('tabIframe', { static: false }) tabIframe?: ElementRef<HTMLIFrameElement>;

  currentPiece = signal<TabPiece | null>(null);
  isScrolling = signal(false);
  scrollSpeed = signal(1);
  isPlayingMidi = signal(false);
  isOffline = signal(false);
  isFromCache = signal(false);
  isSaving = signal(false);

  private scrollInterval?: number;
  private midiPlayer?: MidiPlayer.Player;
  private instrument?: any;
  private audioContext?: AudioContext;

  constructor(private route: ActivatedRoute, private storageService: ClasstabStorageService) {
    // Monitor online/offline status
    window.addEventListener('online', () => this.isOffline.set(false));
    window.addEventListener('offline', () => this.isOffline.set(true));
    this.isOffline.set(!navigator.onLine);
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const url = params['url'];
      const title = params['title'];
      const composer = params['composer'];
      const midiUrl = params['midiUrl'];

      if (url && title && composer) {
        this.currentPiece.set({ url, title, composer, midiUrl });
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.resizeIframe(), 1000);
  }

  ngOnDestroy() {
    this.stopScroll();
    this.stopMidi();
  }

  onIframeLoad() {
    this.resizeIframe();
    this.saveCurrentTabToCache();
  }

  private resizeIframe() {
    if (this.tabIframe?.nativeElement) {
      try {
        const iframe = this.tabIframe.nativeElement;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const height = iframeDoc.documentElement.scrollHeight;
          iframe.style.height = height + 'px';
        }
      } catch (e) {
        console.log('Cannot access iframe content (CORS), using fallback height');
        if (this.tabIframe?.nativeElement) {
          this.tabIframe.nativeElement.style.height = '10000px';
        }
      }
    }
  }

  private async saveCurrentTabToCache() {
    const piece = this.currentPiece();
    if (!piece || this.isSaving()) return;

    this.isSaving.set(true);

    try {
      // Try to get content from iframe
      let content = '';

      if (this.tabIframe?.nativeElement) {
        try {
          const iframe = this.tabIframe.nativeElement;
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            content = iframeDoc.body.innerText || iframeDoc.body.textContent || '';
          }
        } catch (e) {
          console.log('Cannot access iframe content (CORS), fetching directly');
        }
      }

      // If we couldn't get content from iframe, fetch it directly
      if (!content) {
        const response = await fetch(piece.url);
        if (response.ok) {
          content = await response.text();
        }
      }

      if (content) {
        const storedTab: StoredTab = {
          url: piece.url,
          title: piece.title,
          composer: piece.composer,
          midiUrl: piece.midiUrl,
          content: content,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
        };

        await this.storageService.saveTab(storedTab);
        console.log('✅ Tab saved to cache:', piece.title);
      }
    } catch (error) {
      console.error('Failed to save tab to cache:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async loadFromCache(url: string): Promise<string | null> {
    try {
      const cachedTab = await this.storageService.getTab(url);
      if (cachedTab) {
        this.isFromCache.set(true);
        return cachedTab.content;
      }
    } catch (error) {
      console.error('Failed to load from cache:', error);
    }
    return null;
  }

  // MIDI Player Methods
  async toggleMidi() {
    if (this.isPlayingMidi()) {
      this.stopMidi();
    } else {
      await this.playMidi();
    }
  }

  async playMidi() {
    const midiUrl = this.currentPiece()?.midiUrl;
    if (!midiUrl) return;

    try {
      // Initialize audio context
      this.audioContext = new AudioContext();

      // Load soundfont
      this.instrument = await Soundfont.instrument(this.audioContext, 'acoustic_grand_piano');

      // Create MIDI player
      this.midiPlayer = new MidiPlayer.Player((event: any) => {
        if (event.name === 'Note on' && event.velocity > 0) {
          this.instrument?.play(event.noteName, this.audioContext!.currentTime, {
            gain: event.velocity / 100,
          });
        }
      });

      // Fetch and load MIDI file
      const response = await fetch(midiUrl);
      const arrayBuffer = await response.arrayBuffer();

      this.midiPlayer.loadArrayBuffer(arrayBuffer);
      this.midiPlayer.play();

      this.isPlayingMidi.set(true);

      // Listen for end of playback
      this.midiPlayer.on('endOfFile', () => {
        this.isPlayingMidi.set(false);
      });
    } catch (error) {
      console.error('Error playing MIDI:', error);
      alert('Could not play MIDI file. Error: ' + (error as Error).message);
    }
  }

  stopMidi() {
    if (this.midiPlayer) {
      this.midiPlayer.stop();
      this.midiPlayer = undefined;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = undefined;
    }
    this.instrument = undefined;
    this.isPlayingMidi.set(false);
  }

  // Scroll Methods
  toggleScroll() {
    if (this.isScrolling()) {
      this.stopScroll();
    } else {
      this.startScroll();
    }
  }

  startScroll() {
    if (this.scrollInterval) return;

    this.isScrolling.set(true);
    this.scrollInterval = window.setInterval(() => {
      if (this.iframeContainer) {
        this.iframeContainer.nativeElement.scrollBy(0, this.scrollSpeed());
      }
    }, 16);
  }

  stopScroll() {
    if (this.scrollInterval) {
      window.clearInterval(this.scrollInterval);
      this.scrollInterval = undefined;
    }
    this.isScrolling.set(false);
  }

  increaseSpeed() {
    this.scrollSpeed.update((speed) => Math.min(speed + 0.5, 10));
  }

  decreaseSpeed() {
    this.scrollSpeed.update((speed) => Math.max(speed - 0.5, 0.5));
  }

  resetSpeed() {
    this.scrollSpeed.set(1);
  }
}
