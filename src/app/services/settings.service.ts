import { Injectable, signal, effect } from '@angular/core';

export interface AppSettings {
  boardTheme: string;
  pieceTheme: string;
  whitePlayerType: 'human' | 'computer';
  blackPlayerType: 'human' | 'computer';
  whiteComputerElo: number;
  blackComputerElo: number;
  language: 'en' | 'it' | 'es' | 'fr' | 'de';
  appTheme: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

const DEFAULT_SETTINGS: AppSettings = {
  boardTheme: 'default',
  pieceTheme: 'default',
  whitePlayerType: 'human',
  blackPlayerType: 'human',
  whiteComputerElo: 1350,
  blackComputerElo: 1350,
  language: 'en',
  appTheme: 'default',
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settings = signal<AppSettings>(this.loadSettings());

  constructor() {
    effect(() => {
      const currentSettings = this.settings();
      this.saveSettings(currentSettings);

      // Apply app theme
      const theme = currentSettings.appTheme || 'default';
      const themeClass = `theme-${theme}`;

      // Remove old theme classes
      document.body.classList.forEach((cls) => {
        if (cls.startsWith('theme-') && cls !== themeClass) {
          document.body.classList.remove(cls);
        }
      });

      if (!document.body.classList.contains(themeClass)) {
        document.body.classList.add(themeClass);
      }
    });
  }

  updateSettings(newSettings: Partial<AppSettings>) {
    this.settings.update((current) => ({ ...current, ...newSettings }));
  }

  private loadSettings(): AppSettings {
    const stored = localStorage.getItem('chess-teacher-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  }

  private saveSettings(settings: AppSettings) {
    localStorage.setItem('chess-teacher-settings', JSON.stringify(settings));
  }
}
