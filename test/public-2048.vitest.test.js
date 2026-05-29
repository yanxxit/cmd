import { describe, expect, it } from 'vitest';
import {
  addRandomTile,
  createInitialState,
  getMaxTile,
  hasAvailableMove,
  moveGrid,
} from '../public/2048/js/core/game-logic.js';
import { buildStatsViewModel } from '../public/2048/js/ui/stat-view-model.js';

describe('2048 game logic', () => {
  it('creates an initial state with two tiles and zero score', () => {
    const values = [0.0, 0.0, 0.0, 0.95];
    const state = createInitialState(() => values.shift() ?? 0);
    const nonZero = state.grid.flat().filter(Boolean);

    expect(nonZero.length).toBe(2);
    expect(nonZero).toContain(2);
    expect(nonZero).toContain(4);
    expect(state.score).toBe(0);
  });

  it('merges left correctly and reports score delta', () => {
    const grid = [
      [2, 2, 4, 0],
      [0, 4, 4, 0],
      [2, 0, 0, 2],
      [0, 0, 0, 0],
    ];

    const result = moveGrid(grid, 'left');

    expect(result.moved).toBe(true);
    expect(result.grid).toEqual([
      [4, 4, 0, 0],
      [8, 0, 0, 0],
      [4, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.scoreDelta).toBe(16);
    expect(result.mergedCount).toBe(3);
  });

  it('does not report movement for an unchanged grid', () => {
    const grid = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];

    const result = moveGrid(grid, 'left');

    expect(result.moved).toBe(false);
    expect(result.scoreDelta).toBe(0);
    expect(result.mergedCount).toBe(0);
  });

  it('adds a deterministic random tile into an empty slot', () => {
    const grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const values = [0.2, 0.95];

    const result = addRandomTile(grid, () => values.shift() ?? 0);

    expect(result.added).toEqual({ row: 1, col: 0, value: 4 });
    expect(result.grid[1][0]).toBe(4);
  });

  it('detects available moves and max tile', () => {
    const playable = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 2],
      [8, 16, 32, 64],
    ];
    const blocked = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];

    expect(hasAvailableMove(playable)).toBe(true);
    expect(hasAvailableMove(blocked)).toBe(false);
    expect(getMaxTile(playable)).toBe(1024);
  });

  it('builds separated session and lifetime stats for dual view display', () => {
    const viewModel = buildStatsViewModel({
      grid: [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2, 4],
        [8, 16, 32, 64],
      ],
      score: 888,
      bestScore: 4096,
      sessionStats: {
        moves: 42,
        merges: 18,
      },
      historyStats: {
        maxTile: 4096,
        gamesPlayed: 12,
        gamesWon: 3,
        totalMoves: 520,
        totalMerges: 211,
      },
    });

    expect(viewModel.session.score).toBe(888);
    expect(viewModel.session.maxTile).toBe(1024);
    expect(viewModel.session.moves).toBe(42);
    expect(viewModel.history.bestScore).toBe(4096);
    expect(viewModel.history.gamesPlayed).toBe(12);
    expect(viewModel.history.gamesWon).toBe(3);
    expect(viewModel.history.totalMoves).toBe(520);
    expect(viewModel.history.winRate).toBe('25%');
  });
});
