import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface OpeningMove {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number;
  game: any; // Simplified for now
}

export interface OpeningInfo {
  eco: string;
  name: string;
}

export interface OpeningResponse {
  white: number;
  draws: number;
  black: number;
  moves: OpeningMove[];
  opening?: OpeningInfo;
}

@Injectable({
  providedIn: 'root',
})
export class OpeningService {
  private readonly INFO_URL = 'https://explorer.lichess.ovh/masters';

  constructor(private http: HttpClient) {}

  getOpeningData(fen: string): Observable<OpeningResponse> {
    // Lichess API expects 'fen' param. 'masters' db is good for openings.
    let params = new HttpParams().set('fen', fen).set('moves', '12'); // Number of candidate moves to return

    return this.http.get<OpeningResponse>(this.INFO_URL, { params });
  }
}
