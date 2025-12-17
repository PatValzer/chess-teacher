import { Component, input, output, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService, Language } from '../../../services/translation.service';

/**
 * OptionsDialog
 *
 * Configures application-wide settings:
 * - Board and Piece themes.
 * - Player types (Human vs Computer).
 * - Computer ELO levels.
 * - Language selection.
 */
@Component({
  selector: 'app-options-dialog',
  templateUrl: './options-dialog.html',
  styleUrl: './options-dialog.css',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
})
export class OptionsDialog {
  visible = input(false);
  currentBoardTheme = input('default');
  currentPieceTheme = input('default');
  currentAppTheme = input('default');
  whitePlayerType = input<'human' | 'computer'>('human');
  blackPlayerType = input<'human' | 'computer'>('human');
  whiteComputerElo = input<number>(1350);
  blackComputerElo = input<number>(1350);
  currentLanguage = input<Language>('en');

  close = output<void>();
  settingsChange = output<{
    boardTheme: string;
    pieceTheme: string;
    appTheme: string;
    whitePlayerType: 'human' | 'computer';
    blackPlayerType: 'human' | 'computer';
    whiteComputerElo: number;
    blackComputerElo: number;
    language: Language;
  }>();

  appThemes = [
    { id: 'default', name: 'THEME.DEFAULT' },
    { id: 'dark', name: 'THEME.DARK' },
    { id: 'wood', name: 'THEME.WOOD' },
    { id: 'ocean', name: 'THEME.OCEAN' },
    { id: 'forest', name: 'THEME.FOREST' },
  ];

  pieceThemes = [
    { id: 'default', name: 'Standard' }, // Not translating piece names for now as they are proper names mainly
    { id: 'merida', name: 'Merida' },
    { id: 'alpha', name: 'Alpha' },
    { id: 'maestro', name: 'Maestro' },
    { id: 'leipzig', name: 'Leipzig' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'spatial', name: 'Spatial' },
    { id: 'celtic', name: 'Celtic' },
  ];

  languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: 'assets/flags/us.svg' },
    { code: 'it', name: 'Italiano', flag: 'assets/flags/it.svg' },
    { code: 'es', name: 'Español', flag: 'assets/flags/es.svg' },
    { code: 'fr', name: 'Français', flag: 'assets/flags/fr.svg' },
    { code: 'de', name: 'Deutsch', flag: 'assets/flags/de.svg' },
  ];

  selectedBoardTheme = 'default';
  selectedPieceTheme = 'default';
  selectedAppTheme = 'default';
  selectedWhitePlayerType: 'human' | 'computer' = 'human';
  selectedBlackPlayerType: 'human' | 'computer' = 'human';
  selectedWhiteComputerElo: number = 1350;
  selectedBlackComputerElo: number = 1350;
  selectedLanguage: Language = 'en';

  constructor(private translationService: TranslationService) {
    effect(() => {
      this.selectedBoardTheme = this.currentBoardTheme();
      this.selectedPieceTheme = this.currentPieceTheme();
      this.selectedAppTheme = this.currentAppTheme();
      this.selectedWhitePlayerType = this.whitePlayerType();
      this.selectedBlackPlayerType = this.blackPlayerType();
      this.selectedWhiteComputerElo = this.whiteComputerElo();
      this.selectedBlackComputerElo = this.blackComputerElo();
      this.selectedLanguage = this.currentLanguage();
    });
  }

  changeLanguage(lang: Language) {
    this.selectedLanguage = lang;
    // Live preview
    this.translationService.setLanguage(lang);
  }

  selectAppTheme(themeId: string) {
    this.selectedAppTheme = themeId;

    // Automatically select board theme based on app theme
    switch (themeId) {
      case 'ocean':
        this.selectedBoardTheme = 'blue';
        break;
      case 'forest':
        this.selectedBoardTheme = 'green';
        break;
      case 'dark':
        this.selectedBoardTheme = 'marble'; // Dark Mode now maps to Marble for better contrast
        break;
      case 'wood':
        this.selectedBoardTheme = 'wood';
        break;
      default:
        this.selectedBoardTheme = 'default';
        break;
    }
  }

  save() {
    this.settingsChange.emit({
      boardTheme: this.selectedBoardTheme,
      pieceTheme: this.selectedPieceTheme,
      appTheme: this.selectedAppTheme,
      whitePlayerType: this.selectedWhitePlayerType,
      blackPlayerType: this.selectedBlackPlayerType,
      whiteComputerElo: this.selectedWhiteComputerElo,
      blackComputerElo: this.selectedBlackComputerElo,
      language: this.selectedLanguage,
    });
    this.close.emit();
  }

  cancel() {
    this.selectedBoardTheme = this.currentBoardTheme();
    this.selectedPieceTheme = this.currentPieceTheme();
    this.selectedAppTheme = this.currentAppTheme();
    // Revert language if changed
    if (this.selectedLanguage !== this.currentLanguage()) {
      this.translationService.setLanguage(this.currentLanguage());
    }
    this.close.emit();
  }
  getPiecePreviewUrl(themeId: string): string {
    const themeMap: Record<string, string> = {
      default: 'cburnett',
      merida: 'merida',
      alpha: 'alpha',
      maestro: 'maestro',
      leipzig: 'leipzig',
      fantasy: 'fantasy',
      spatial: 'spatial',
      celtic: 'celtic',
    };
    const theme = themeMap[themeId] || 'cburnett';
    return `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${theme}/wN.svg`;
  }
}
