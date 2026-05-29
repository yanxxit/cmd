// Persistence helpers for 2048.
const BEST_SCORE_KEY = 'bestScore2048';
const STATS_KEY = 'stats2048';

const defaultHistoryStats = () => ({
  maxTile: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  totalMoves: 0,
  totalMerges: 0,
});

export function loadBestScore() {
  const raw = localStorage.getItem(BEST_SCORE_KEY);
  return Number.parseInt(raw ?? '0', 10) || 0;
}

export function saveBestScore(value) {
  localStorage.setItem(BEST_SCORE_KEY, String(value));
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return defaultHistoryStats();
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultHistoryStats(),
      ...parsed,
      // Compatible with the previous mixed stats format.
      totalMoves: parsed.totalMoves ?? parsed.moves ?? 0,
      totalMerges: parsed.totalMerges ?? parsed.merges ?? 0,
    };
  } catch (error) {
    return defaultHistoryStats();
  }
}

export function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify({ ...defaultHistoryStats(), ...stats }));
}
