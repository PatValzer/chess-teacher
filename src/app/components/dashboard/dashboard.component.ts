import { Component, signal, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { ChessWrapperComponent } from './widgets/chess-wrapper/chess-wrapper.component';
import { NewsWidgetComponent } from './widgets/news/news.component';
import { GmailWidgetComponent } from './widgets/gmail/gmail.component';
import { ClasstabWidgetComponent } from './widgets/classtab/classtab.component';
import { SpotifyWidgetComponent } from './widgets/spotify/spotify.component';
import { CachedTabsComponent } from '../widgets/cached-tabs/cached-tabs.component';

export interface Widget {
  id: string;
  title: string;
  type: 'chess' | 'news' | 'gmail' | 'classtab' | 'spotify' | 'cached-tabs';
  isOpen: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    ChessWrapperComponent,
    NewsWidgetComponent,
    GmailWidgetComponent,
    ClasstabWidgetComponent,
    SpotifyWidgetComponent,
    CachedTabsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  @ViewChildren('spotifyWidget') spotifyWidgets!: QueryList<SpotifyWidgetComponent>;
  // Initialize with 3 columns
  columns = signal<Widget[][]>([
    [{ id: '1', title: 'Chess Teacher', type: 'chess', isOpen: true }], // Column 1
    [
      { id: '2', title: 'Latest News', type: 'news', isOpen: true },
      { id: '5', title: 'Spotify', type: 'spotify', isOpen: true },
    ], // Column 2
    [
      { id: '3', title: 'My Gmail', type: 'gmail', isOpen: true },
      { id: '4', title: 'ClassTab', type: 'classtab', isOpen: true },
      { id: '6', title: 'Cached Tabs', type: 'cached-tabs', isOpen: true },
    ], // Column 3
  ]);

  drop(event: CdkDragDrop<Widget[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    // Trigger signal update to ensure change detection runs (cdk mutates arrays in place)
    this.columns.update((cols) => [...cols]);
  }

  toggleWidget(id: string) {
    this.columns.update((cols) =>
      cols.map((col) => col.map((w) => (w.id === id ? { ...w, isOpen: !w.isOpen } : w)))
    );
  }

  loadSpotifyPreset(presetIndex: number) {
    const spotifyWidget = this.spotifyWidgets.first;
    if (spotifyWidget) {
      spotifyWidget.loadPreset(spotifyWidget.presets[presetIndex]);
    }
  }

  getSpotifyCurrentPreset(): string | null {
    const spotifyWidget = this.spotifyWidgets?.first;
    return spotifyWidget?.currentPreset()?.name || null;
  }
}
