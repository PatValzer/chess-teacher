import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-opening-map-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button (click)="clicked.emit()" class="btn btn-multiplayer w-full mb-4 justify-center">
      <span class="material-icons">map</span>
      Opening Map
    </button>
  `,
  styles: [
    `
      /* Using global styles for btn and btn-multiplayer */
    `,
  ],
})
export class OpeningMapButtonComponent {
  clicked = output<void>();
}
