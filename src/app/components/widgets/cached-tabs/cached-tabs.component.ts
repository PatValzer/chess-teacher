import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClasstabStorageService, StoredTab } from '../../../services/classtab-storage.service';

@Component({
  selector: 'app-cached-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cached-tabs.component.html',
  styleUrl: './cached-tabs.component.css',
})
export class CachedTabsComponent implements OnInit {
  cachedTabs = signal<StoredTab[]>([]);
  isLoading = signal(true);
  storageStats = signal<{
    count: number;
    totalSize: number;
    oldestTab: StoredTab | null;
    newestTab: StoredTab | null;
  } | null>(null);

  constructor(private storageService: ClasstabStorageService, private router: Router) {}

  async ngOnInit() {
    await this.loadCachedTabs();
  }

  async loadCachedTabs() {
    this.isLoading.set(true);
    try {
      const tabs = await this.storageService.getAllTabs();
      // Sort by last accessed (most recent first)
      tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
      this.cachedTabs.set(tabs);

      const stats = await this.storageService.getStorageStats();
      this.storageStats.set(stats);
    } catch (error) {
      console.error('Failed to load cached tabs:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  openTab(tab: StoredTab) {
    this.router.navigate(['/classtab'], {
      queryParams: {
        url: tab.url,
        title: tab.title,
        composer: tab.composer,
        midiUrl: tab.midiUrl,
      },
    });
  }

  async deleteTab(tab: StoredTab, event: Event) {
    event.stopPropagation();

    if (confirm(`Delete "${tab.title}" from cache?`)) {
      try {
        await this.storageService.deleteTab(tab.url);
        await this.loadCachedTabs();
      } catch (error) {
        console.error('Failed to delete tab:', error);
        alert('Failed to delete tab from cache');
      }
    }
  }

  async clearAllTabs() {
    if (confirm('Clear all cached tabs? This cannot be undone.')) {
      try {
        await this.storageService.clearAllTabs();
        await this.loadCachedTabs();
      } catch (error) {
        console.error('Failed to clear tabs:', error);
        alert('Failed to clear cached tabs');
      }
    }
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getTotalSize(): string {
    const stats = this.storageStats();
    return stats ? this.formatSize(stats.totalSize) : '0 B';
  }
}
