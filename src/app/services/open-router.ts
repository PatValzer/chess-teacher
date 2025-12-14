import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AiFeedback {
  feedback: string;
  suggestedMove?: string; // e.g., "e2e4" or "Nf3"
}

@Injectable({
  providedIn: 'root',
})
export class OpenRouterService {
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private apiKey = environment.openRouterApiKey;

  constructor(private http: HttpClient) {}

  generateFeedback(
    fen: string,
    scoreChange: number,
    isWhiteTurn: boolean,
    bestMove?: string,
    language: 'en' | 'it' = 'en',
    userLevel: string = 'beginner'
  ): Observable<AiFeedback> {
    const currentTurn = isWhiteTurn ? 'White' : 'Black';
    const previousMover = isWhiteTurn ? 'Black' : 'White';
    const langName = language === 'it' ? 'Italian' : 'English';

    const prompt = `
You are a friendly and instructive chess teacher guiding a ${userLevel} student.
Answer in ${langName}.

The current position FEN is: ${fen}.
It's ${currentTurn}'s turn to move.

${previousMover} just moved, and the evaluation changed by ${scoreChange.toFixed(
      2
    )} pawns from their perspective.
(Positive change = good move by ${previousMover}, Negative change = bad move by ${previousMover}).

The chess engine's best move for ${currentTurn} is: ${bestMove || 'analyzing...'}

Provide:
1. A brief, educational comment on ${previousMover}'s last move (max 15 words). 
   - Since the student is ${userLevel}, explain concepts appropriate for their level.
   - If user made a mistake, explain WHY gently.
   - Answer strictly in ${langName}.
2. Return the engine's best move EXACTLY as given: ${bestMove}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "feedback": "your educational comment here",
  "suggestedMove": "the exact move from above"
}
    `.trim();

    const body = {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful and witty chess coach. Output valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      // key for identifying app to OpenRouter
      'HTTP-Referer': 'http://localhost:4200',
      'X-Title': 'Chess Teacher',
    });

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map((response) => {
        const content = response.choices?.[0]?.message?.content;
        try {
          return JSON.parse(content);
        } catch (e) {
          console.error('Failed to parse AI response:', content);
          return { feedback: content || 'Interesting move...' };
        }
      }),
      catchError((error) => {
        console.error('OpenRouter API Error:', error);
        return of({ feedback: 'Thinking failed me...' });
      })
    );
  }
}
