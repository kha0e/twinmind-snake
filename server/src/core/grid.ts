/**
 * Représentation d'une grille de jeu.
 * La grille est un tableau carré de taille (width x height).
 */

export interface Point {
  x: number;
  y: number;
}

export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 20;

/**
 * Directions cardinales autorisées.
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Type d'intention envoyée par un joueur. « straight » signifie maintenir la direction actuelle.
 */
export type PlayerIntent = Direction | 'straight';

/**
 * Retourne la somme d'un point et d'un vecteur directionnel.
 */
export function movePoint(p: Point, dir: Direction): Point {
  switch (dir) {
    case 'up':
      return { x: p.x, y: p.y - 1 };
    case 'down':
      return { x: p.x, y: p.y + 1 };
    case 'left':
      return { x: p.x - 1, y: p.y };
    case 'right':
      return { x: p.x + 1, y: p.y };
  }
}

/**
 * Vérifie si un point est à l'intérieur des limites de la grille.
 */
export function inBounds(p: Point): boolean {
  return p.x >= 0 && p.x < GRID_WIDTH && p.y >= 0 && p.y < GRID_HEIGHT;
}
