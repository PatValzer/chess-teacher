import { Injectable } from '@angular/core';

export interface StoredTab {
  url: string;
  title: string;
  composer: string;
  midiUrl?: string;
  content: string;
  timestamp: number;
  lastAccessed: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClasstabStorageService {
  private dbName = 'ClassTabDB';
  private storeName = 'tabs';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: 'url',
          });

          // Create indexes for efficient querying
          objectStore.createIndex('composer', 'composer', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('lastAccessed', 'lastAccessed', {
            unique: false,
          });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async saveTab(tab: StoredTab): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.put(tab);

      request.onsuccess = () => {
        console.log('Tab saved to IndexedDB:', tab.title);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save tab:', request.error);
        reject(request.error);
      };
    });
  }

  async getTab(url: string): Promise<StoredTab | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.get(url);

      request.onsuccess = () => {
        const tab = request.result as StoredTab | undefined;
        if (tab) {
          // Update last accessed time
          this.updateLastAccessed(url);
        }
        resolve(tab || null);
      };

      request.onerror = () => {
        console.error('Failed to get tab:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllTabs(): Promise<StoredTab[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as StoredTab[]);
      };

      request.onerror = () => {
        console.error('Failed to get all tabs:', request.error);
        reject(request.error);
      };
    });
  }

  async getTabsByComposer(composer: string): Promise<StoredTab[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('composer');

      const request = index.getAll(composer);

      request.onsuccess = () => {
        resolve(request.result as StoredTab[]);
      };

      request.onerror = () => {
        console.error('Failed to get tabs by composer:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteTab(url: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.delete(url);

      request.onsuccess = () => {
        console.log('Tab deleted from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete tab:', request.error);
        reject(request.error);
      };
    });
  }

  async clearAllTabs(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.clear();

      request.onsuccess = () => {
        console.log('All tabs cleared from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear tabs:', request.error);
        reject(request.error);
      };
    });
  }

  private async updateLastAccessed(url: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const getRequest = store.get(url);

      getRequest.onsuccess = () => {
        const tab = getRequest.result as StoredTab;
        if (tab) {
          tab.lastAccessed = Date.now();
          const putRequest = store.put(tab);

          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getStorageStats(): Promise<{
    count: number;
    totalSize: number;
    oldestTab: StoredTab | null;
    newestTab: StoredTab | null;
  }> {
    const tabs = await this.getAllTabs();

    if (tabs.length === 0) {
      return { count: 0, totalSize: 0, oldestTab: null, newestTab: null };
    }

    const totalSize = tabs.reduce((sum, tab) => sum + tab.content.length, 0);

    const sortedByTime = [...tabs].sort((a, b) => a.timestamp - b.timestamp);

    return {
      count: tabs.length,
      totalSize,
      oldestTab: sortedByTime[0],
      newestTab: sortedByTime[sortedByTime.length - 1],
    };
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
}
