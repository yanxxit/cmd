// Rendering helpers for the 2048 UI.
import { qs, qsa } from '../utils/dom.js';

export function createRefs(root) {
  return {
    grid: qs('[data-role="grid"]', root),
    score: qs('[data-role="score"]', root),
    bestScore: qs('[data-role="best-score"]', root),
    sessionMoves: qs('[data-role="session-moves"]', root),
    sessionMerges: qs('[data-role="session-merges"]', root),
    sessionMaxTile: qs('[data-role="session-max-tile"]', root),
    historyBestScore: qs('[data-role="history-best-score"]', root),
    historyMaxTile: qs('[data-role="history-max-tile"]', root),
    historyGamesPlayed: qs('[data-role="history-games-played"]', root),
    historyGamesWon: qs('[data-role="history-games-won"]', root),
    historyTotalMoves: qs('[data-role="history-total-moves"]', root),
    historyTotalMerges: qs('[data-role="history-total-merges"]', root),
    historyWinRate: qs('[data-role="history-win-rate"]', root),
    finalScore: qs('[data-role="final-score"]', root),
    gameOver: qs('[data-role="game-over"]', root),
    undoHint: qs('[data-role="undo-hint"]', root),
    undoButtons: qsa('[data-action="undo"]', root),
    restartButtons: qsa('[data-action="restart"]', root),
    moveButtons: qsa('[data-direction]', root),
    gameContainer: qs('[data-role="game-container"]', root),
  };
}

function tileClassName(value) {
  if (!value) {
    return 'grid-cell';
  }
  if (value <= 2048) {
    return `grid-cell tile-${value}`;
  }
  return 'grid-cell tile-super';
}

export function renderGrid(grid, gridEl, animate = false) {
  gridEl.innerHTML = '';
  grid.forEach((row) => {
    row.forEach((value) => {
      const cell = document.createElement('div');
      cell.className = tileClassName(value);
      if (value) {
        cell.textContent = value;
        if (animate) {
          cell.classList.add('tile-new');
        }
      }
      gridEl.appendChild(cell);
    });
  });
}

export function renderHud(viewModel, refs, state) {
  refs.score.textContent = viewModel.session.score;
  refs.score.parentElement.classList.remove('pop');
  void refs.score.parentElement.offsetWidth;
  refs.score.parentElement.classList.add('pop');

  refs.bestScore.textContent = viewModel.history.bestScore;
  refs.sessionMoves.textContent = viewModel.session.moves;
  refs.sessionMerges.textContent = viewModel.session.merges;
  refs.sessionMaxTile.textContent = viewModel.session.maxTile;
  refs.historyBestScore.textContent = viewModel.history.bestScore;
  refs.historyMaxTile.textContent = viewModel.history.maxTile;
  refs.historyGamesPlayed.textContent = viewModel.history.gamesPlayed;
  refs.historyGamesWon.textContent = viewModel.history.gamesWon;
  refs.historyTotalMoves.textContent = viewModel.history.totalMoves;
  refs.historyTotalMerges.textContent = viewModel.history.totalMerges;
  refs.historyWinRate.textContent = viewModel.history.winRate;
  refs.finalScore.textContent = state.score;
  refs.gameOver.classList.toggle('show', state.isGameOver);
  refs.undoButtons.forEach((button) => {
    button.disabled = state.history.length === 0;
  });
}

export function showUndoHint(refs, text = '已撤销上一步', isError = false) {
  refs.undoHint.textContent = text;
  refs.undoHint.style.background = isError ? 'rgba(200, 50, 50, 0.9)' : 'rgba(0, 0, 0, 0.8)';
  refs.undoHint.classList.add('show');
  window.clearTimeout(showUndoHint.timer);
  showUndoHint.timer = window.setTimeout(() => {
    refs.undoHint.classList.remove('show');
  }, 1500);
}
