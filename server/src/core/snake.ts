import { Point, Direction, movePoint } from './grid';

/**
 * Un segment du serpent. Chaque segment a une position de tête (coin supérieur gauche)
 * et une direction indiquant son mouvement lors de sa création. La largeur du segment
 * est toujours de deux cases perpendiculaires à la direction.
 */
export interface Segment {
  pos: Point;
  dir: Direction;
}

/**
 * Retourne les cellules occupées par un segment. Un segment occupe deux cases
 * adjacentes perpendiculairement à sa direction.
 */
export function getCells(seg: Segment): Point[] {
  const { pos, dir } = seg;
  // Direction du mouvement : la largeur est perpendiculaire
  if (dir === 'up' || dir === 'down') {
    // Mouvement vertical → largeur horizontale
    return [pos, { x: pos.x + 1, y: pos.y }];
  } else {
    // Mouvement horizontal → largeur verticale
    return [pos, { x: pos.x, y: pos.y + 1 }];
  }
}

/**
 * Représentation du serpent. Le tableau des segments est ordonné du plus récent
 * (tête) au plus ancien (queue).
 */
export class Snake {
  segments: Segment[];
  dir: Direction;

  constructor(initPos: Point, initDir: Direction, length: number = 3) {
    this.dir = initDir;
    this.segments = [];
    // Initialise le serpent en créant plusieurs segments dans la direction opposée afin
    // de démarrer avec une longueur de plusieurs segments.
    let current: Segment = { pos: { ...initPos }, dir: initDir };
    this.segments.push(current);
    for (let i = 1; i < length; i++) {
      // Recule d'une unité dans la direction opposée à initDir
      const opposite: Direction = this.getOppositeDir(initDir);
      const prevPos = movePoint(current.pos, opposite);
      const newSeg: Segment = { pos: prevPos, dir: initDir };
      this.segments.push(newSeg);
      current = newSeg;
    }
  }

  /**
   * Retourne l'opposé d'une direction.
   */
  getOppositeDir(dir: Direction): Direction {
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
   * Calcule la prochaine position de la tête si le serpent change de direction.
   */
  computeNextHead(newDir: Direction): Segment {
    const head = this.segments[0];
    // Si la direction demandée est opposée, ignore et continue
    const opposite = this.getOppositeDir(this.dir);
    const finalDir = newDir === opposite ? this.dir : newDir;
    const newPos = movePoint(head.pos, finalDir);
    return { pos: newPos, dir: finalDir };
  }

  /**
   * Avance le serpent d'un tick. Si `grow` est vrai, n'enlève pas le dernier segment.
   */
  advance(newDir: Direction, grow: boolean = false): void {
    const nextHead = this.computeNextHead(newDir);
    this.segments.unshift(nextHead);
    this.dir = nextHead.dir;
    if (!grow) {
      this.segments.pop();
    }
  }

  /**
   * Retourne toutes les cellules occupées par le serpent.
   */
  getOccupiedCells(): Point[] {
    const cells: Point[] = [];
    for (const seg of this.segments) {
      const segCells = getCells(seg);
      cells.push(...segCells);
    }
    return cells;
  }

  /**
   * Vérifie si un point est contenu dans le serpent.
   */
  contains(point: Point): boolean {
    return this.getOccupiedCells().some((c) => c.x === point.x && c.y === point.y);
  }
}
