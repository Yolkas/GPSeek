import React, { useEffect } from 'react';
import { createGame } from './game/Game';

function App() {
  useEffect(() => {
    const game = createGame();
    
    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div id="game-container"></div>
    </div>
  );
}

export default App;