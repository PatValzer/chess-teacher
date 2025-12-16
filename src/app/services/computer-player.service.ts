/**
 * ComputerPlayerService
 *
 * Manages the logic for the computer opponent.
 * - Determines if it is the computer's turn.
 * - Calculates appropriate difficulty parameters (depth/elo).
 * - Interacts with Stockfish to retrieve the best move.
 */

import { Injectable } from '@angular/core';
import { Stockfish } from './stockfish';
import { Chess, Move } from 'chess.js';

@Injectable({
  providedIn: 'root',
})
export class ComputerPlayerService {
  constructor(private stockfish: Stockfish) {}

  /**
   * Calculates the appropriate search depth based on ELO.
   * Maps 1350 - 2850 to 1 - 20 (approx).
   */
  calculateDepthFromElo(elo: number): number {
    const minElo = 1350;
    const maxElo = 2850;
    const minDepth = 1;
    const maxDepth = 20;

    const fraction = (elo - minElo) / (maxElo - minElo);
    const depth = Math.round(minDepth + fraction * (maxDepth - minDepth));
    return Math.max(1, Math.min(20, depth));
  }

  /**
   * Requests a move from Stockfish based on the current position and ELO.
   * Handles opening speedups (lower depth/delay for first few moves).
   */
  async getBestMove(
    fen: string,
    elo: number,
    moveCount: number,
    isOpening: boolean = false
  ): Promise<string> {
    let depth = this.calculateDepthFromElo(elo);
    let delay = 500;

    // Speed up openening moves
    if (moveCount < 10) {
      depth = Math.min(depth, 10);
      delay = 200;
    }

    // Artificial delay for realism (optional, but requested by original logic)
    await new Promise((resolve) => setTimeout(resolve, delay));

    console.log(`Making computer move for FEN: ${fen} at DEPTH: ${depth}`);
    try {
      const bestMove = await this.stockfish.getBestMove(fen, depth);
      console.log('Stockfish returned best move:', bestMove);
      return bestMove;
    } catch (err) {
      console.error('Error making computer move:', err);
      return '';
    }
  }
}
