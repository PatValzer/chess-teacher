import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ChessBoard } from './components/chess-board/chess-board';
import { NewsPageComponent } from './components/pages/news/news-page.component';
import { GmailPageComponent } from './components/pages/gmail/gmail-page.component';
import { ClasstabPageComponent } from './components/pages/classtab/classtab-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'chess', component: ChessBoard },
  { path: 'news', component: NewsPageComponent },
  { path: 'gmail', component: GmailPageComponent },
  { path: 'classtab', component: ClasstabPageComponent },
  { path: '**', redirectTo: 'dashboard' },
];
