// Pure 2048 game logic.
export const GRID_SIZE = 4;

export function createEmptyGrid(size = GRID_SIZE) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

export function getMaxTile(grid) {
  return grid.flat().reduce((max, value) => Math.max(max, value), 0);
}

export function addRandomTile(grid, randomFn = Math.random) {
  const nextGrid = cloneGrid(grid);
  const emptyCells = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (nextGrid[row][col] === 0) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (!emptyCells.length) {
    return { grid: nextGrid, added: null };
  }

  const index = Math.floor(randomFn() * emptyCells.length);
  const selected = emptyCells[index];
  const value = randomFn() < 0.9 ? 2 : 4;
  nextGrid[selected.row][selected.col] = value;

  return {
    grid: nextGrid,
    added: { ...selected, value }
  };
}

export function createInitialState(randomFn = Math.random) {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid, randomFn).grid;
  grid = addRandomTile(grid, randomFn).grid;
  return {
    grid,
    score: 0,
  };
}

function rotateClockwise(grid) {
  const rotated = createEmptyGrid(grid.length);
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid.length; col += 1) {
      rotated[col][grid.length - 1 - row] = grid[row][col];
    }
  }
  return rotated;
}

function moveRowLeft(row) {
  const compact = row.filter(Boolean);
  const next = [];
  let scoreDelta = 0;
  let mergedCount = 0;

  for (let index = 0; index < compact.length; index += 1) {
    const current = compact[index];
    const following = compact[index + 1];
    if (current !== 0 && current === following) {
      const merged = current * 2;
      next.push(merged);
      scoreDelta += merged;
      mergedCount += 1;
      index += 1;
    } else {
      next.push(current);
    }
  }

  while (next.length < row.length) {
    next.push(0);
  }

  return { row: next, scoreDelta, mergedCount };
}

export function moveGrid(grid, direction) {
  const rotations = {
    left: 0,
    down: 1,
    right: 2,
    up: 3,
  };

  if (!(direction in rotations)) {
    throw new Error(`Unsupported direction: ${direction}`);
  }

  let workingGrid = cloneGrid(grid);
  for (let turn = 0; turn < rotations[direction]; turn += 1) {
    workingGrid = rotateClockwise(workingGrid);
  }

  let scoreDelta = 0;
  let mergedCount = 0;
  workingGrid = workingGrid.map((row) => {
    const result = moveRowLeft(row);
    scoreDelta += result.scoreDelta;
    mergedCount += result.mergedCount;
    return result.row;
  });

  for (let turn = 0; turn < (4 - rotations[direction]) % 4; turn += 1) {
    workingGrid = rotateClockwise(workingGrid);
  }

  const moved = JSON.stringify(workingGrid) !== JSON.stringify(grid);
  return {
    grid: workingGrid,
    moved,
    scoreDelta,
    mergedCount,
  };
}

export function hasAvailableMove(grid) {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const current = grid[row][col];
      if (current === 0) {
        return true;
      }
      if (row < GRID_SIZE - 1 && current === grid[row + 1][col]) {
        return true;
      }
      if (col < GRID_SIZE - 1 && current === grid[row][col + 1]) {
        return true;
      }
    }
  }
  return false;
}
