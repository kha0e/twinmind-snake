import { Game } from './game';
import { Direction } from './grid';

describe('Game consensus', () => {
  it('applies consensus when both players agree', () => {
    const game = new Game(200, 100);
    game.addPlayer('p1');
    game.addPlayer('p2');
    game.recordIntent('p1', 'up');
    game.recordIntent('p2', 'up');
    // tick should apply direction change to up
    const snapshot = game.tick();
    expect(game['snake'].dir).toBe('up');
    expect(snapshot.gameOver).toBe(false);
  });
  it('continues straight when players disagree', () => {
    const game = new Game(200, 100);
    game.addPlayer('p1');
    game.addPlayer('p2');
    const originalDir: Direction = game['snake'].dir;
    game.recordIntent('p1', 'up');
    game.recordIntent('p2', 'down');
    const snapshot = game.tick();
    expect(game['snake'].dir).toBe(originalDir);
  });
});
