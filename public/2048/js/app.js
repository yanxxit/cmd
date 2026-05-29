// Compose the 2048 app from shell, logic, storage, rendering and input.
const v = window.G_VER || Date.now();
const [
  { renderPageShell },
  { createRefs, renderGrid, renderHud, showUndoHint },
  { buildStatsViewModel },
  { bindGameInput },
  { createInitialState, addRandomTile, getMaxTile, hasAvailableMove, moveGrid },
  { loadBestScore, loadStats, saveBestScore, saveStats },
  { qs },
] = await Promise.all([
  import(`./ui/page-shell.js?v=${v}`),
  import(`./ui/render.js?v=${v}`),
  import(`./ui/stat-view-model.js?v=${v}`),
  import(`./input.js?v=${v}`),
  import(`./core/game-logic.js?v=${v}`),
  import(`./services/storage.js?v=${v}`),
  import(`./utils/dom.js?v=${v}`),
]);

function cloneSnapshot(snapshot) {
  return {
    grid: snapshot.grid.map((row) => [...row]),
    score: snapshot.score,
    bestScore: snapshot.bestScore,
    sessionStats: { ...snapshot.sessionStats },
    historyStats: { ...snapshot.historyStats },
    currentGameWon: snapshot.currentGameWon,
  };
}

export async function createGame2048App({ mount = '#app' } = {}) {
  const root = qs(mount);
  if (!root) {
    throw new Error(`Mount node not found: ${mount}`);
  }

  root.innerHTML = renderPageShell();
  const refs = createRefs(root);

  const state = {
    grid: [],
    score: 0,
    bestScore: loadBestScore(),
    sessionStats: {
      moves: 0,
      merges: 0,
    },
    historyStats: loadStats(),
    history: [],
    maxUndo: 10,
    currentGameWon: false,
    isGameOver: false,
  };

  function persist() {
    saveBestScore(state.bestScore);
    saveStats(state.historyStats);
  }

  function render(animate = false) {
    renderGrid(state.grid, refs.grid, animate);
    renderHud(buildStatsViewModel(state), refs, state);
  }

  function saveStateSnapshot() {
    state.history.push(cloneSnapshot(state));
    if (state.history.length > state.maxUndo) {
      state.history.shift();
    }
  }

  function restart() {
    const initial = createInitialState();
    state.grid = initial.grid;
    state.score = 0;
    state.history = [];
    state.currentGameWon = false;
    state.isGameOver = false;
    state.sessionStats = {
      moves: 0,
      merges: 0,
    };
    state.historyStats = {
      ...state.historyStats,
      gamesPlayed: state.historyStats.gamesPlayed + 1,
    };
    persist();
    render();
  }

  function undo() {
    if (!state.history.length) {
      showUndoHint(refs, '无法撤销', true);
      return;
    }

    const previous = state.history.pop();
    state.grid = previous.grid;
    state.score = previous.score;
    state.bestScore = previous.bestScore;
    state.sessionStats = previous.sessionStats;
    state.historyStats = previous.historyStats;
    state.currentGameWon = previous.currentGameWon;
    state.isGameOver = !hasAvailableMove(state.grid);
    persist();
    render();
    showUndoHint(refs);
  }

  function move(direction) {
    saveStateSnapshot();
    const result = moveGrid(state.grid, direction);

    if (!result.moved) {
      state.history.pop();
      render();
      return;
    }

    state.grid = result.grid;
    state.score += result.scoreDelta;
    state.sessionStats.moves += 1;
    state.sessionStats.merges += result.mergedCount;
    state.historyStats.totalMoves += 1;
    state.historyStats.totalMerges += result.mergedCount;

    const spawnResult = addRandomTile(state.grid);
    state.grid = spawnResult.grid;

    const currentMax = getMaxTile(state.grid);
    if (currentMax > state.historyStats.maxTile) {
      state.historyStats.maxTile = currentMax;
    }
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
    }
    if (currentMax >= 2048 && !state.currentGameWon) {
      state.currentGameWon = true;
      state.historyStats.gamesWon += 1;
    }

    state.isGameOver = !hasAvailableMove(state.grid);
    persist();
    render(true);
  }

  bindGameInput({
    refs,
    onMove: move,
    onRestart: restart,
    onUndo: undo,
  });

  restart();
}
