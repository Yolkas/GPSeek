import { Game as PhaserGame, AUTO } from 'phaser';
import { SnakeScene } from './scenes/SnakeScene';
import { GRID_SIZE, GRID_WIDTH, GRID_HEIGHT } from './config/GameConfig';

export const createGame = () => {
  return new PhaserGame({
    type: AUTO,
    width: GRID_SIZE * GRID_WIDTH,
    height: GRID_SIZE * GRID_HEIGHT,
    backgroundColor: '#1a1a1a',
    parent: 'game-container',
    scene: SnakeScene,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    }
  });
};