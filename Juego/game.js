const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#bfcc00',
    parent: 'game',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let snake;
let food;
let cursors;
let scene;
let score = 0;
let highScore = 0;
let gameStarted = false;

// Elementos del DOM
const menuElement = document.getElementById('menu');
const gameOverElement = document.getElementById('gameOver');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const currentScoreElement = document.getElementById('currentScore');

// Event Listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Dirección actual
let direction = 'right';
// Tiempo para el siguiente movimiento
let moveTime = 0;
// Velocidad del movimiento (ms)
const MOVE_DELAY = 100;
// Tamaño de cada segmento
const SEGMENT_SIZE = 16;
// Factor de escala para los sprites
const SNAKE_SCALE = 0.02;
const FOOD_SCALE = 0.03;

function preload() {
    // Cargar los sprites
    this.load.image('head', 'Juego/assets/head.png');
    this.load.image('body', 'Juego/assets/body.png');
    this.load.image('tail', 'Juego/assets/tail.png');
    this.load.image('food1', 'Juego/assets/food1.png');
    this.load.image('food2', 'Juego/assets/food2.png');
    
    // Cargar sprites de giro
    this.load.image('turn-left-down', 'Juego/assets/turn-left-to-down.png');
    this.load.image('turn-left-up', 'Juego/assets/turn-left-to-up.png');
    this.load.image('turn-right-down', 'Juego/assets/turn-right-to-down.png');
    this.load.image('turn-right-up', 'Juego/assets/turn-right-to-up.png');
    this.load.image('turn-up-left', 'Juego/assets/turn-up-to-left.png');
    this.load.image('turn-up-right', 'Juego/assets/turn-up-to-rigth.png');
}

function create() {
    scene = this;
    cursors = this.input.keyboard.createCursorKeys();
    
    // Inicializar la serpiente
    snake = {
        body: [],
        direction: 'right',
        x: 400,
        y: 300,
        rotations: {}
    };

    // Crear la comida como un grupo de sprites
    food = this.add.sprite(0, 0, 'food1');
    food.setScale(FOOD_SCALE);

    // Mostrar menú inicial
    menuElement.classList.remove('hidden');
    gameOverElement.classList.add('hidden');
}

function startGame() {
    // Ocultar menús
    menuElement.classList.add('hidden');
    gameOverElement.classList.add('hidden');

    // Resetear puntuación
    score = 0;
    updateScore();

    // Resetear serpiente
    if (snake.body.length > 0) {
        snake.body.forEach(segment => segment.destroy());
    }
    snake.body = [];
    snake.rotations = {};
    
    // Crear el cuerpo inicial de la serpiente
    // Crear la cabeza
    snake.body.push(scene.add.sprite(snake.x, snake.y, 'head'));
    snake.body[0].setScale(SNAKE_SCALE);
    
    // Crear el cuerpo inicial
    for (let i = 1; i < 3; i++) {
        const segment = scene.add.sprite(snake.x - (i * SEGMENT_SIZE), snake.y, 'body');
        segment.setScale(SNAKE_SCALE);
        snake.body.push(segment);
    }

    // Añadir la cola
    const tail = scene.add.sprite(snake.x - (3 * SEGMENT_SIZE), snake.y, 'tail');
    tail.setScale(SNAKE_SCALE);
    snake.body.push(tail);

    // Ajustar rotaciones iniciales
    updateSegmentRotations();

    // Reposicionar la comida
    repositionFood();

    // Iniciar el juego
    gameStarted = true;
    direction = 'right';
}

function updateSegmentRotations() {
    // Rotar la cabeza según la dirección
    switch (direction) {
        case 'left':
            snake.body[0].angle = 180;
            break;
        case 'right':
            snake.body[0].angle = 0;
            break;
        case 'up':
            snake.body[0].angle = 270;
            break;
        case 'down':
            snake.body[0].angle = 90;
            break;
    }

    // Actualizar rotación de los segmentos del cuerpo
    for (let i = 1; i < snake.body.length - 1; i++) {
        const prev = snake.body[i - 1];
        const current = snake.body[i];
        const next = snake.body[i + 1];

        // Calcular las diferencias de posición
        const dx1 = current.x - prev.x;
        const dy1 = current.y - prev.y;
        const dx2 = next.x - current.x;
        const dy2 = next.y - current.y;

        // Detectar si hay un giro
        if ((dx1 !== 0 && dy2 !== 0) || (dy1 !== 0 && dx2 !== 0)) {
            // Seleccionar el sprite correcto según el tipo de giro
            if (dy1 < 0 && dx2 > 0) { // De arriba hacia derecha
                current.setTexture('turn-up-right');
                current.angle = 90;
            } else if (dy1 < 0 && dx2 < 0) { // De arriba hacia izquierda
                current.setTexture('turn-up-left');
                current.angle = 90;
            } else if (dx1 > 0 && dy2 > 0) { // De derecha hacia abajo
                current.setTexture('turn-right-down');
                current.angle = 0;
            } else if (dx1 > 0 && dy2 < 0) { // De derecha hacia arriba
                current.setTexture('turn-right-up');
                current.angle = 90;
            } else if (dx1 < 0 && dy2 > 0) { // De izquierda hacia abajo
                current.setTexture('turn-left-down');
                current.angle = 0;
            } else if (dx1 < 0 && dy2 < 0) { // De izquierda hacia arriba
                current.setTexture('turn-left-up');
                current.angle = 90;
            } else if (dy1 > 0 && dx2 > 0) { // De abajo hacia derecha
                current.setTexture('turn-up-right');
                current.angle = 270;
            } else if (dy1 > 0 && dx2 < 0) { // De abajo hacia izquierda
                current.setTexture('turn-up-left');
                current.angle = 270;
            }
        } else {
            current.setTexture('body');
            current.angle = dx1 !== 0 ? 0 : 90;
        }
    }

    // Rotar la cola
    const lastSegment = snake.body[snake.body.length - 1];
    const beforeLast = snake.body[snake.body.length - 2];
    const dx = lastSegment.x - beforeLast.x;
    const dy = lastSegment.y - beforeLast.y;
    
    if (dx > 0) lastSegment.angle = 180;
    else if (dx < 0) lastSegment.angle = 0;
    else if (dy > 0) lastSegment.angle = 270;
    else lastSegment.angle = 90;
}

function update(time) {
    if (!gameStarted) return;

    if (time >= moveTime) {
        moveSnake();
        moveTime = time + MOVE_DELAY;
    }

    // Control de dirección
    if (cursors.left.isDown && direction !== 'right') {
        direction = 'left';
    }
    else if (cursors.right.isDown && direction !== 'left') {
        direction = 'right';
    }
    else if (cursors.up.isDown && direction !== 'down') {
        direction = 'up';
    }
    else if (cursors.down.isDown && direction !== 'up') {
        direction = 'down';
    }
}

function moveSnake() {
    let x = snake.body[0].x;
    let y = snake.body[0].y;

    switch (direction) {
        case 'left':
            x -= SEGMENT_SIZE;
            break;
        case 'right':
            x += SEGMENT_SIZE;
            break;
        case 'up':
            y -= SEGMENT_SIZE;
            break;
        case 'down':
            y += SEGMENT_SIZE;
            break;
    }

    // Verificar colisión con los bordes
    if (x < 0 || x >= config.width || y < 0 || y >= config.height) {
        gameOver();
        return;
    }

    // Mover el cuerpo
    for (let i = snake.body.length - 1; i > 0; i--) {
        snake.body[i].x = snake.body[i - 1].x;
        snake.body[i].y = snake.body[i - 1].y;
    }

    // Mover la cabeza
    snake.body[0].x = x;
    snake.body[0].y = y;

    // Actualizar rotaciones
    updateSegmentRotations();

    // Verificar colisión con la comida
    if (Math.abs(x - food.x) < SEGMENT_SIZE/2 && Math.abs(y - food.y) < SEGMENT_SIZE/2) {
        eatFood();
    }

    // Verificar colisión con el cuerpo
    for (let i = 1; i < snake.body.length; i++) {
        if (Math.abs(x - snake.body[i].x) < SEGMENT_SIZE/2 && 
            Math.abs(y - snake.body[i].y) < SEGMENT_SIZE/2) {
            gameOver();
            break;
        }
    }
}

function eatFood() {
    // Incrementar puntuación
    score += 10;
    updateScore();
    
    // Hacer crecer la serpiente
    growSnake();
    
    // Reposicionar la comida
    repositionFood();
}

function growSnake() {
    const lastSegment = snake.body[snake.body.length - 1];
    const newSegment = scene.add.sprite(lastSegment.x, lastSegment.y, 'body');
    newSegment.setScale(SNAKE_SCALE);
    
    // El último segmento se convierte en cuerpo
    lastSegment.setTexture('body');
    
    // Insertar el nuevo segmento antes de la cola
    snake.body.splice(snake.body.length - 1, 0, newSegment);
    
    // Añadir la nueva cola al final
    const tail = scene.add.sprite(lastSegment.x, lastSegment.y, 'tail');
    tail.setScale(SNAKE_SCALE);
    snake.body.push(tail);
}

function repositionFood() {
    const gridSize = SEGMENT_SIZE;
    const x = Math.floor(Math.random() * (config.width / gridSize)) * gridSize;
    const y = Math.floor(Math.random() * (config.height / gridSize)) * gridSize;
    food.x = x;
    food.y = y;
    
    // Cambiar aleatoriamente entre food1 y food2
    const foodType = Math.random() < 0.5 ? 'food1' : 'food2';
    food.setTexture(foodType);
}

function updateScore() {
    // Actualizar score actual
    document.getElementById('currentScore').textContent = 'Score: ' + score;
    
    // Actualizar high score si es necesario
    if (score > highScore) {
        highScore = score;
        document.getElementById('highScore').textContent = 'High Score: ' + highScore;
    }
}

function gameOver() {
    // Detener el juego
    gameStarted = false;
    
    // Actualizar puntuación final
    finalScoreElement.textContent = 'Score: ' + score;
    
    // Mostrar menú de game over
    gameOverElement.classList.remove('hidden');
}
