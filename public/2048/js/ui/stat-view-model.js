// Build the dual-view stats model for current game and lifetime history.
import { getMaxTile } from '../core/game-logic.js';

export function buildStatsViewModel(state) {
  const sessionMaxTile = getMaxTile(state.grid);
  const historyGamesPlayed = state.historyStats.gamesPlayed;
  const winRate = historyGamesPlayed > 0
    ? `${Math.round((state.historyStats.gamesWon / historyGamesPlayed) * 100)}%`
    : '0%';

  return {
    session: {
      score: state.score,
      moves: state.sessionStats.moves,
      merges: state.sessionStats.merges,
      maxTile: sessionMaxTile,
    },
    history: {
      bestScore: state.bestScore,
      maxTile: state.historyStats.maxTile,
      gamesPlayed: state.historyStats.gamesPlayed,
      gamesWon: state.historyStats.gamesWon,
      totalMoves: state.historyStats.totalMoves,
      totalMerges: state.historyStats.totalMerges,
      winRate,
    },
  };
}
