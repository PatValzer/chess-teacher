import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface EngineAnalysis {
  evaluation: number; // Centipawn score
  mate?: number; // Mate in X moves
  bestMove: string;
  pv: string[]; // Principal variation
  depth: number;
}

@Injectable({
  providedIn: 'root',
})
export class Stockfish {
  private engine: Worker | null = null;
  private analysisSubject = new BehaviorSubject<EngineAnalysis | null>(null);
  public analysis$: Observable<EngineAnalysis | null> = this.analysisSubject.asObservable();

  constructor() {
    this.initEngine();
  }

  private initEngine() {
    try {
      console.log('Initializing Stockfish worker...');
      // Initialize Stockfish Web Worker
      this.engine = new Worker('/assets/stockfish.js');

      this.engine.onerror = (error) => {
        console.error('Stockfish Worker Error:', error);
      };

      this.engine.onmessage = (event) => {
        // console.log('Stockfish Engine Message:', event.data); // Uncomment for verbose debugging
        const message = event.data;
        this.handleEngineMessage(message);
      };

      // Initialize UCI
      this.sendCommand('uci');
      // Default to a reasonable ELO, or let the app set it explicitly on start.
      // We'll set a default "Standard" limit to ensure it's not full strength by default if used elsewhere.
      this.sendCommand('setoption name UCI_LimitStrength value true');
      this.sendCommand('setoption name UCI_Elo value 1350');
      this.sendCommand('isready');
      console.log('Stockfish initialized, sent UCI commands');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
    }
  }

  private handleEngineMessage(message: string) {
    if (message.includes('info') && message.includes('score')) {
      const analysis = this.parseAnalysis(message);
      if (analysis) {
        this.analysisSubject.next(analysis);
      }
    }
  }

  private parseAnalysis(message: string): EngineAnalysis | null {
    const depthMatch = message.match(/depth (\d+)/);
    const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
    const pvMatch = message.match(/pv (.+)$/);

    if (!depthMatch || !scoreMatch) return null;

    const depth = parseInt(depthMatch[1]);
    const scoreType = scoreMatch[1];
    const scoreValue = parseInt(scoreMatch[2]);
    const pv = pvMatch ? pvMatch[1].split(' ') : [];

    const analysis: EngineAnalysis = {
      evaluation: scoreType === 'cp' ? scoreValue : 0,
      depth,
      bestMove: pv[0] || '',
      pv,
    };

    if (scoreType === 'mate') {
      analysis.mate = scoreValue;
    }

    return analysis;
  }

  analyzePosition(fen: string, depth: number = 15) {
    if (!this.engine) return;

    this.sendCommand('stop');
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth}`);
  }

  getBestMove(fen: string, depth: number = 15): Promise<string> {
    return new Promise((resolve) => {
      if (!this.engine) {
        resolve('');
        return;
      }

      const timeoutId = setTimeout(() => {
        this.engine?.removeEventListener('message', messageHandler);
        resolve('');
      }, 5000);

      const messageHandler = (event: MessageEvent) => {
        const message = event.data;
        if (message.includes('bestmove')) {
          const match = message.match(/bestmove (\S+)/);
          if (match) {
            clearTimeout(timeoutId);
            this.engine?.removeEventListener('message', messageHandler);
            resolve(match[1]);
          }
        }
      };

      this.engine.addEventListener('message', messageHandler);
      this.sendCommand('stop');
      // Reset limit strength to ensure depth is the only factor if possible,
      // or we just rely on depth being the stronger constraint for time/calculation.
      // However, if UCI_LimitStrength was set to True previously, it might interfere.
      // Let's ensure we disable it if we want pure depth based, OR we just ignore it.
      // Safest is to disable limitstrength to let depth control it.
      this.sendCommand('setoption name UCI_LimitStrength value false');
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);
    });
  }

  private sendCommand(command: string) {
    if (this.engine) {
      this.engine.postMessage(command);
    }
  }

  stop() {
    this.sendCommand('stop');
  }

  destroy() {
    if (this.engine) {
      this.engine.terminate();
      this.engine = null;
    }
  }
}
