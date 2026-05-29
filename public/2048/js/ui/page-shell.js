// Static shell for the 2048 page.
export function renderPageShell() {
  return `
    <main class="page-shell">
      <h1>2048</h1>
      <div class="game-wrapper">
        <section class="game-container" data-role="game-container">
          <div class="header">
            <div class="score-container current-score">
              <div class="score-kicker">CURRENT RUN</div>
              <div class="score-label">当前局</div>
              <div class="score-value" data-role="score">0</div>
              <div class="score-helper">本局实时更新，跟随每一步合并即时变化</div>
            </div>
            <div class="score-container best-score">
              <div class="score-kicker">HISTORY ARCHIVE</div>
              <div class="score-label">历史档案</div>
              <div class="score-value" data-role="best-score">0</div>
              <div class="score-helper">跨局持久保存，保留你的长期最好成绩</div>
            </div>
          </div>

          <div class="controls">
            <button class="game-button" data-action="restart">🔄 新游戏</button>
            <button class="game-button" data-action="undo" disabled>↩️ 撤销</button>
          </div>

          <div class="grid-container" data-role="grid"></div>

          <div class="game-over" data-role="game-over">
            <h2>游戏结束!</h2>
            <p>最终分数：<span data-role="final-score">0</span></p>
            <button class="game-button" data-action="restart">🔄 再玩一次</button>
          </div>

          <div class="mobile-controls">
            <div class="mobile-controls-row">
              <button class="game-button mobile-btn" data-direction="up">↑</button>
            </div>
            <div class="mobile-controls-row">
              <button class="game-button mobile-btn" data-direction="left">←</button>
              <button class="game-button mobile-btn" data-direction="down">↓</button>
              <button class="game-button mobile-btn" data-direction="right">→</button>
            </div>
          </div>
        </section>

        <aside class="side-panel">
          <div class="stats-section">
            <h3>📍 本局统计</h3>
            <ul class="stats-list">
              <li><span class="stats-label">移动次数</span><span class="stats-value" data-role="session-moves">0</span></li>
              <li><span class="stats-label">合并次数</span><span class="stats-value" data-role="session-merges">0</span></li>
              <li><span class="stats-label">最高方块</span><span class="stats-value" data-role="session-max-tile">0</span></li>
            </ul>
          </div>

          <div class="stats-section">
            <div class="archive-card-header">
              <div class="archive-card-kicker">PLAYER ARCHIVE</div>
              <h3>🗂️ 历史累计</h3>
              <p class="archive-card-subtitle">记录你的长期表现与通关进度，适合快速查看这位玩家的整体档案。</p>
            </div>
            <ul class="stats-list">
              <li><span class="stats-label">历史最佳</span><span class="stats-value" data-role="history-best-score">0</span></li>
              <li><span class="stats-label">历史最高方块</span><span class="stats-value" data-role="history-max-tile">0</span></li>
              <li><span class="stats-label">总游戏次数</span><span class="stats-value" data-role="history-games-played">0</span></li>
              <li><span class="stats-label">累计胜场</span><span class="stats-value" data-role="history-games-won">0</span></li>
              <li><span class="stats-label">总移动次数</span><span class="stats-value" data-role="history-total-moves">0</span></li>
              <li><span class="stats-label">总合并次数</span><span class="stats-value" data-role="history-total-merges">0</span></li>
              <li><span class="stats-label">累计胜率</span><span class="stats-value" data-role="history-win-rate">0%</span></li>
            </ul>
          </div>

          <div class="instructions">
            <h3>🎮 游戏说明</h3>
            <p><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> 移动方块</p>
            <p><kbd>Z</kbd> 或 <span class="inline-hint">撤销</span></p>
            <p>相同数字碰撞即可合并</p>
            <p>目标：合成 <strong>2048</strong>!</p>
          </div>
        </aside>
      </div>
      <div class="undo-hint" data-role="undo-hint">已撤销上一步</div>
    </main>
  `;
}
