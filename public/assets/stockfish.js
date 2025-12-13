// Stockfish.js placeholder
// Note: For a production app, you would download the actual stockfish.js or stockfish.wasm file
// from https://github.com/nmrugg/stockfish.js/ or use stockfish.wasm
// For now, this is a placeholder that will show an error in the console

console.warn(
  'Stockfish engine not loaded. Please download stockfish.js from https://github.com/nmrugg/stockfish.js/'
);

// Mock implementation for development
self.onmessage = function (event) {
  const command = event.data;

  if (command === 'uci') {
    self.postMessage('uciok');
  } else if (command === 'isready') {
    self.postMessage('readyok');
  } else if (command.startsWith('position')) {
    // Mock response
  } else if (command.startsWith('go')) {
    // Mock analysis response
    setTimeout(() => {
      self.postMessage('info depth 10 score cp 25 pv e2e4 e7e5 g1f3');
      self.postMessage('bestmove e2e4');
    }, 500);
  }
};
