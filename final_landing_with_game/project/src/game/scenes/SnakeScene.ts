import { Scene } from 'phaser';
import { GRID_SIZE, GRID_WIDTH, GRID_HEIGHT, MOVE_DELAY } from '../config/GameConfig';

interface SnakeSegment {
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Sprite;
  direction?: string;
  isTurning?: boolean;
}

export class SnakeScene extends Scene {
  private snake: SnakeSegment[] = [];
  private food: Phaser.GameObjects.Sprite | null = null;
  private direction = 'right';
  private nextDirection = 'right';
  private moveTimer = 0;
  private lastMoveTime = 0;
  private isGameOver = false;
  private score = 0;
  private scoreText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'SnakeScene' });
  }

  preload() {
    // Load sprite assets
    this.load.image('snake-head', '/sprites/head.png');
    this.load.image('snake-body', '/sprites/body-straight.png');
    this.load.image('snake-turn', '/sprites/body-corner.png');
    this.load.image('snake-tail', '/sprites/tail.png');
    this.load.image('food', '/sprites/food.png');
  }

  create() {
    // Add score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      color: '#fff'
    });

    this.createSnake();
    this.createFood();
    this.setupInputs();
  }

  private createSnake() {
    const startX = 5;
    const startY = 5;

    // Create head
    this.snake.push({
      x: startX,
      y: startY,
      sprite: this.add.sprite(startX * GRID_SIZE, startY * GRID_SIZE, 'snake-head'),
      direction: 'right'
    });

    // Create initial body segments
    for (let i = 1; i < 3; i++) {
      this.snake.push({
        x: startX - i,
        y: startY,
        sprite: this.add.sprite((startX - i) * GRID_SIZE, startY * GRID_SIZE, 'snake-body'),
        direction: 'right'
      });
    }

    // Add tail
    this.snake.push({
      x: startX - 3,
      y: startY,
      sprite: this.add.sprite((startX - 3) * GRID_SIZE, startY * GRID_SIZE, 'snake-tail'),
      direction: 'right'
    });

    // Set initial rotations
    this.updateSegmentSprites();
  }

  private createFood() {
    let x, y;
    do {
      x = Phaser.Math.Between(0, GRID_WIDTH - 1);
      y = Phaser.Math.Between(0, GRID_HEIGHT - 1);
    } while (this.isPositionOccupied(x, y));

    if (this.food) {
      this.food.destroy();
    }
    this.food = this.add.sprite(x * GRID_SIZE + GRID_SIZE / 2, y * GRID_SIZE + GRID_SIZE / 2, 'food');
    this.food.setScale(0.8); // Make food slightly smaller than grid
  }

  private isPositionOccupied(x: number, y: number): boolean {
    return this.snake.some(segment => segment.x === x && segment.y === y);
  }

  private setupInputs() {
    this.input.keyboard.on('keydown-UP', () => {
      if (this.direction !== 'down') this.nextDirection = 'up';
    });
    this.input.keyboard.on('keydown-DOWN', () => {
      if (this.direction !== 'up') this.nextDirection = 'down';
    });
    this.input.keyboard.on('keydown-LEFT', () => {
      if (this.direction !== 'right') this.nextDirection = 'left';
    });
    this.input.keyboard.on('keydown-RIGHT', () => {
      if (this.direction !== 'left') this.nextDirection = 'right';
    });
  }

  update(time: number) {
    if (this.isGameOver) return;

    if (time > this.lastMoveTime + MOVE_DELAY) {
      this.moveSnake();
      this.lastMoveTime = time;
    }
  }

  private moveSnake() {
    const head = this.snake[0];
    const newHead = { ...head };
    
    // Update direction
    const oldDirection = this.direction;
    this.direction = this.nextDirection;

    // Calculate new head position
    switch (this.direction) {
      case 'up':
        newHead.y--;
        break;
      case 'down':
        newHead.y++;
        break;
      case 'left':
        newHead.x--;
        break;
      case 'right':
        newHead.x++;
        break;
    }

    // Check collision with walls
    if (
      newHead.x < 0 || 
      newHead.x >= GRID_WIDTH || 
      newHead.y < 0 || 
      newHead.y >= GRID_HEIGHT
    ) {
      this.gameOver();
      return;
    }

    // Check collision with self
    if (this.isPositionOccupied(newHead.x, newHead.y)) {
      this.gameOver();
      return;
    }

    // Create new head sprite
    newHead.sprite = this.add.sprite(
      newHead.x * GRID_SIZE + GRID_SIZE / 2,
      newHead.y * GRID_SIZE + GRID_SIZE / 2,
      'snake-head'
    );
    newHead.direction = this.direction;

    // Check if turning
    if (oldDirection !== this.direction) {
      const prevHead = this.snake[0];
      prevHead.sprite.setTexture('snake-turn');
      prevHead.isTurning = true;
    }

    // Add new head to snake array
    this.snake.unshift(newHead);

    // Check if food is eaten
    if (this.food && 
        newHead.x === Math.floor(this.food.x / GRID_SIZE) && 
        newHead.y === Math.floor(this.food.y / GRID_SIZE)) {
      this.score += 10;
      if (this.scoreText) {
        this.scoreText.setText(`Score: ${this.score}`);
      }
      this.createFood();
    } else {
      // Remove tail if no food eaten
      const tail = this.snake.pop();
      if (tail) {
        tail.sprite.destroy();
      }
    }

    // Update segment sprites
    this.updateSegmentSprites();
  }

  private updateSegmentSprites() {
    // Update head rotation
    const head = this.snake[0];
    switch (head.direction) {
      case 'up':
        head.sprite.setAngle(-90);
        break;
      case 'down':
        head.sprite.setAngle(90);
        break;
      case 'left':
        head.sprite.setAngle(180);
        break;
      case 'right':
        head.sprite.setAngle(0);
        break;
    }

    // Update body segments
    for (let i = 1; i < this.snake.length - 1; i++) {
      const segment = this.snake[i];
      const prevSegment = this.snake[i - 1];
      const nextSegment = this.snake[i + 1];

      if (segment.isTurning) {
        segment.sprite.setTexture('snake-turn');
        // Calculate turn sprite rotation
        if ((prevSegment.direction === 'right' && nextSegment.direction === 'up') ||
            (prevSegment.direction === 'down' && nextSegment.direction === 'left')) {
          segment.sprite.setAngle(0);
        } else if ((prevSegment.direction === 'right' && nextSegment.direction === 'down') ||
                   (prevSegment.direction === 'up' && nextSegment.direction === 'left')) {
          segment.sprite.setAngle(90);
        } else if ((prevSegment.direction === 'left' && nextSegment.direction === 'up') ||
                   (prevSegment.direction === 'down' && nextSegment.direction === 'right')) {
          segment.sprite.setAngle(-90);
        } else if ((prevSegment.direction === 'left' && nextSegment.direction === 'down') ||
                   (prevSegment.direction === 'up' && nextSegment.direction === 'right')) {
          segment.sprite.setAngle(180);
        }
      } else {
        segment.sprite.setTexture('snake-body');
        // Set body rotation
        if (segment.direction === 'up' || segment.direction === 'down') {
          segment.sprite.setAngle(90);
        } else {
          segment.sprite.setAngle(0);
        }
      }
    }

    // Update tail
    const tail = this.snake[this.snake.length - 1];
    const beforeTail = this.snake[this.snake.length - 2];
    tail.sprite.setTexture('snake-tail');
    
    // Set tail rotation based on direction to previous segment
    if (beforeTail.x < tail.x) tail.sprite.setAngle(0);
    else if (beforeTail.x > tail.x) tail.sprite.setAngle(180);
    else if (beforeTail.y < tail.y) tail.sprite.setAngle(90);
    else if (beforeTail.y > tail.y) tail.sprite.setAngle(-90);
  }

  private gameOver() {
    this.isGameOver = true;
    
    // Add semi-transparent black overlay
    const overlay = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7
    );

    // Add game over text
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      'Game Over!',
      {
        fontSize: '64px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    // Add final score
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 10,
      `Final Score: ${this.score}`,
      {
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    // Add restart instruction
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 60,
      'Press Space to Restart',
      {
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    // Listen for space key to restart
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.restart();
    });
  }
}