import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-game-navigation',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './game-navigation.component.html',
  styleUrl: './game-navigation.component.css',
})
export class GameNavigationComponent {
  canUndo = input.required<boolean>();
  canRedo = input.required<boolean>();

  first = output<void>();
  previous = output<void>();
  next = output<void>();
  last = output<void>();
}
