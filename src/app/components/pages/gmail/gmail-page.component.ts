import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gmail-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 bg-slate-900 min-h-screen text-slate-200">
      <h1 class="text-3xl font-bold mb-4">My Gmail</h1>
      <p>This is the full Gmail page content.</p>
    </div>
  `,
})
export class GmailPageComponent {}
