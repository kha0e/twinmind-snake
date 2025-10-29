import { GRID_WIDTH, GRID_HEIGHT, Direction, PlayerIntent, Point, inBounds } from './grid';
import { Snake } from './snake';

export interface Fruit {
  pos: Point;
  value: number;
}

export interface Snapshot {
  snakeCells: Point[];
  fruits: Fruit[];
  score: number;
  gameOver: boolean;
  tick: number;
}

/**
 * Le jeu gère l'état d'une partie pour deux joueurs. Le serveur est autoritatif
 * et se charge d'appliquer les décisions de consensus.
 */
export class Game {
  private snake: Snake;
  private fruits: Fruit[] = [];
  private score = 0;
  private tickCount = 0;
  private gameOver = false;

  private lastInputs: Record<string, { intent: PlayerIntent; timestamp: number }> = {};
  private players: string[] = [];
  private readonly consensusWindow: number;
  private readonly tickRate: number;

  constructor(consensusWindow: number, tickRate: number) {
    this.consensusWindow = consensusWindow;
    this.tickRate = tickRate;
    // Initialise le serpent au centre de la grille
    const initPos: Point = { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) };
    this.snake = new Snake(initPos, 'right', 4);
    // Place quelques fruits au départ
    for (let i = 0; i < 3; i++) {
      this.spawnFruit();
    }
  }

  /**
   * Ajoute un joueur à la partie et retourne son identifiant.
   */
  addPlayer(playerId: string): boolean {
    if (this.players.length >= 2) return false;
    if (!this.players.includes(playerId)) {
      this.players.push(playerId);
    }
    return true;
  }

  /**
   * Enregistre l'intention d'un joueur.
   */
  recordIntent(playerId: string, intent: PlayerIntent): void {
    const now = Date.now();
    this.lastInputs[playerId] = { intent, timestamp: now };
  }

  /**
   * Détermine la direction à appliquer en fonction des intentions reçues.
   */
  private decideDirection(): Direction {
    // Direction actuelle
    const currentDir = this.snake.dir;
    // Identifie la plage temporelle valide
    const now = Date.now();
    const recent: Record<string, PlayerIntent> = {};
    for (const p of this.players) {
      const rec = this.lastInputs[p];
      if (rec && now - rec.timestamp <= this.consensusWindow) {
        recent[p] = rec.intent;
      }
    }
    // Si les deux joueurs ont fourni une intention récente et identique
    const intents = Object.values(recent);
    if (intents.length === 2 && intents[0] === intents[1]) {
      const intent = intents[0];
      if (intent === 'straight') {
        return currentDir;
      }
      // Sinon, c'est une direction absolue. Vérifie qu'on ne fait pas demi-tour.
      // Cast as Direction
      const nextDir = intent as Direction;
      // Refuse si l'intention est opposée à la direction actuelle
      const opposite = this.getOppositeDir(currentDir);
      if (nextDir === opposite) {
        return currentDir;
      }
      return nextDir;
    }
    // Sinon, continue tout droit
    return currentDir;
  }

  private getOppositeDir(dir: Direction): Direction {
    switch (dir) {
      case 'up':
        return 'down';
      case 'down':
        return 'up';
      case 'left':
        return 'right';
      case 'right':
        return 'left';
    }
  }

  /**
   * Fait avancer le jeu d'un tick. Retourne un instantané pour envoi aux clients.
   */
  tick(): Snapshot {
    if (this.gameOver) {
      return this.makeSnapshot();
    }
    this.tickCount++;
    const newDir = this.decideDirection();
    // Calcule la position prévue de la tête (sans modifier le serpent)
    const prospective = this.snake.computeNextHead(newDir);
    // Récupère les cellules qu'il occupera
    const nextCells = [prospective.pos];
    if (prospective.dir === 'up' || prospective.dir === 'down') {
      nextCells.push({ x: prospective.pos.x + 1, y: prospective.pos.y });
    } else {
      nextCells.push({ x: prospective.pos.x, y: prospective.pos.y + 1 });
    }
    // Vérifie les collisions avec les bords
    for (const cell of nextCells) {
      if (!inBounds(cell)) {
        this.gameOver = true;
        return this.makeSnapshot();
      }
    }
    // Vérifie collision avec le corps (en excluant le dernier segment si non croissance)
    const bodyCells = this.snake.getOccupiedCells();
    // On retire les cellules de la queue qui seront supprimées si on ne grandit pas
    const willGrow = this.fruitAt(prospective.pos) !== undefined;
    const cellsToIgnore: Point[] = [];
    if (!willGrow) {
      // La queue (dernier segment) sera retirée; on retire ses cellules de la liste
      const tail = this.snake.segments[this.snake.segments.length - 1];
      const tailCells = [tail.pos];
      if (tail.dir === 'up' || tail.dir === 'down') {
        tailCells.push({ x: tail.pos.x + 1, y: tail.pos.y });
      } else {
        tailCells.push({ x: tail.pos.x, y: tail.pos.y + 1 });
      }
      cellsToIgnore.push(...tailCells);
    }
    for (const cell of nextCells) {
      const collision = bodyCells.some((b) => b.x === cell.x && b.y === cell.y && !cellsToIgnore.some((c) => c.x === b.x && c.y === b.y));
      if (collision) {
        this.gameOver = true;
        return this.makeSnapshot();
      }
    }
    // Collision avec un fruit ?
    const fruit = this.fruitAt(prospective.pos);
    const grow = fruit !== undefined;
    if (fruit) {
      this.score += fruit.value;
      // Retire le fruit et en fait apparaître un autre
      this.fruits = this.fruits.filter((f) => f !== fruit);
      this.spawnFruit();
    }
    // Avance le serpent
    this.snake.advance(newDir, grow);
    return this.makeSnapshot();
  }

  /**
   * Cherche un fruit à une position donnée (uniquement la position du coin supérieur gauche du segment).
   */
  private fruitAt(pos: Point): Fruit | undefined {
    return this.fruits.find((f) => f.pos.x === pos.x && f.pos.y === pos.y);
  }

  /**
   * Fait apparaître un fruit dans une cellule libre.
   */
  private spawnFruit() {
    const freeCells: Point[] = [];
    const occupied = this.snake.getOccupiedCells().map((c) => `${c.x},${c.y}`);
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const key = `${x},${y}`;
        if (!occupied.includes(key)) {
          freeCells.push({ x, y });
        }
      }
    }
    if (freeCells.length === 0) return;
    const idx = Math.floor(Math.random() * freeCells.length);
    const value = 1 + Math.floor(Math.random() * 5);
    this.fruits.push({ pos: freeCells[idx], value });
  }

  /**
   * Construit l'instantané actuel du jeu.
   */
  private makeSnapshot(): Snapshot {
    return {
      snakeCells: this.snake.getOccupiedCells(),
      fruits: this.fruits.map((f) => ({ ...f })),
      score: this.score,
      gameOver: this.gameOver,
      tick: this.tickCount,
    };
  }
}
