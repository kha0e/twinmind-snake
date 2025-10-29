import * as PIXI from 'pixi.js';

// Chargement des variables d'environnement Vite
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

// Dimensions de la grille
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const CELL_SIZE = 32;

// Couleurs
const BACKGROUND_COLOR = 0x202020;
const SNAKE_COLOR = 0x4caf50;
const FRUIT_COLOR = 0xffc107;

// État local
let playerId: string | null = null;
let socket: WebSocket;
let snakeCells: { x: number; y: number }[] = [];
let fruits: { pos: { x: number; y: number }; value: number }[] = [];
let score = 0;
let gameOver = false;

// Création du canvas Pixi
const app = new PIXI.Application({
  width: GRID_WIDTH * CELL_SIZE,
  height: GRID_HEIGHT * CELL_SIZE,
  backgroundColor: BACKGROUND_COLOR,
});
const containerDiv = document.getElementById('game-container')!;
containerDiv.appendChild(app.view as HTMLCanvasElement);

// Calques
const snakeLayer = new PIXI.Graphics();
const fruitLayer = new PIXI.Graphics();
app.stage.addChild(snakeLayer);
app.stage.addChild(fruitLayer);

function connect() {
  socket = new WebSocket(WS_URL);
  socket.onopen = () => {
    console.log('Connected to server');
  };
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'welcome') {
      playerId = msg.data.playerId;
      console.log('Player ID', playerId);
    } else if (msg.type === 'snapshot') {
      const snap = msg.data as {
        snakeCells: { x: number; y: number }[];
        fruits: { pos: { x: number; y: number }; value: number }[];
        score: number;
        gameOver: boolean;
        tick: number;
      };
      snakeCells = snap.snakeCells;
      fruits = snap.fruits;
      score = snap.score;
      gameOver = snap.gameOver;
      updateHud();
      draw();
    }
  };
  socket.onclose = () => {
    console.log('Disconnected');
    setTimeout(connect, 2000);
  };
}

connect();

function sendIntent(intent: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'intent', data: { intent } }));
}

// Gestion des entrées clavier
window.addEventListener('keydown', (e) => {
  if (gameOver) return;
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      sendIntent('up');
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      sendIntent('down');
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      sendIntent('left');
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      sendIntent('right');
      break;
    case ' ': // Espace = tout droit
      sendIntent('straight');
      break;
  }
});

// Mise à jour du HUD
function updateHud() {
  const scoreEl = document.getElementById('score');
  if (scoreEl) {
    scoreEl.textContent = score.toString();
  }
}

// Dessine l'état actuel
function draw() {
  snakeLayer.clear();
  fruitLayer.clear();
  // Dessin du serpent
  snakeLayer.beginFill(SNAKE_COLOR);
  for (const cell of snakeCells) {
    snakeLayer.drawRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }
  snakeLayer.endFill();
  // Dessin des fruits
  fruitLayer.beginFill(FRUIT_COLOR);
  for (const fruit of fruits) {
    fruitLayer.drawCircle(
      fruit.pos.x * CELL_SIZE + CELL_SIZE / 2,
      fruit.pos.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3
    );
  }
  fruitLayer.endFill();
  if (gameOver) {
    // Overlay
    const style = new PIXI.TextStyle({ fill: 'white', fontSize: 24, align: 'center' });
    const msg = new PIXI.Text('Partie terminée', style);
    msg.anchor.set(0.5);
    msg.x = (GRID_WIDTH * CELL_SIZE) / 2;
    msg.y = (GRID_HEIGHT * CELL_SIZE) / 2;
    snakeLayer.addChild(msg);
  }
}
