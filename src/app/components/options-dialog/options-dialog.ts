// Forced update for HMR
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-options-dialog',
  templateUrl: './options-dialog.html',
  styleUrl: './options-dialog.css',
  standalone: true,
  imports: [FormsModule],
})
export class OptionsDialog {
  @Input() visible = false;
  @Input() currentBoardTheme = 'default';
  @Input() currentPieceTheme = 'default';
  @Input() whitePlayerType: 'human' | 'computer' = 'human';
  @Input() blackPlayerType: 'human' | 'computer' = 'human';
  @Input() whiteComputerElo: number = 1350;
  @Input() blackComputerElo: number = 1350;
  @Output() close = new EventEmitter<void>();
  @Output() settingsChange = new EventEmitter<{
    boardTheme: string;
    pieceTheme: string;
    whitePlayerType: 'human' | 'computer';
    blackPlayerType: 'human' | 'computer';
    whiteComputerElo: number;
    blackComputerElo: number;
  }>();

  boardThemes = [
    { id: 'default', name: 'Standard (Brown)' },
    { id: 'green', name: 'Forest (Green)' },
    { id: 'blue', name: 'Ocean (Blue)' },
    { id: 'purple', name: 'Royal (Purple)' },
  ];

  pieceThemes = [
    { id: 'default', name: 'Cburnett (Standard)' },
    { id: 'merida', name: 'Merida' },
    { id: 'alpha', name: 'Alpha' },
    { id: 'cheq', name: 'Cheq' },
    { id: 'leipzig', name: 'Leipzig' },
  ];

  selectedBoardTheme = 'default';
  selectedPieceTheme = 'default';
  selectedWhitePlayerType: 'human' | 'computer' = 'human';
  selectedBlackPlayerType: 'human' | 'computer' = 'human';
  selectedWhiteComputerElo: number = 1350;
  selectedBlackComputerElo: number = 1350;

  ngOnChanges() {
    this.selectedBoardTheme = this.currentBoardTheme;
    this.selectedPieceTheme = this.currentPieceTheme;
    this.selectedWhitePlayerType = this.whitePlayerType;
    this.selectedBlackPlayerType = this.blackPlayerType;
    this.selectedWhiteComputerElo = this.whiteComputerElo;
    this.selectedBlackComputerElo = this.blackComputerElo;
  }

  save() {
    this.settingsChange.emit({
      boardTheme: this.selectedBoardTheme,
      pieceTheme: this.selectedPieceTheme,
      whitePlayerType: this.selectedWhitePlayerType,
      blackPlayerType: this.selectedBlackPlayerType,
      whiteComputerElo: this.selectedWhiteComputerElo,
      blackComputerElo: this.selectedBlackComputerElo,
    });
    this.close.emit();
  }

  cancel() {
    this.selectedBoardTheme = this.currentBoardTheme;
    this.selectedPieceTheme = this.currentPieceTheme;
    this.close.emit();
  }
}
