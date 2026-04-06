/**
 * Git 工具模块统一出口
 * 提供 Git 仓库操作、提交日志、报告生成等功能
 */

// 提交日志相关
export {
  getCommitsByDate,
  getCommitStats,
  getCommitDiff,
  getFullCommitLog,
  getCommitsByDateRange,
  getDiffBetweenCommits,
  parseDiffLines,
  getFileChangeHeatmap,
  getCommitsByFilePath,
  searchCommitsByMessage
} from './commit-log.js';

// 报告生成相关
export {
  generateHTMLReport,
  generateJSONReport,
  generateMarkdownReport
} from './report-generator.js';

// 仓库信息相关
export {
  getRemoteRepoInfo,
  getRepoStats,
  getCurrentGitUser,
  getBranches,
  getTags,
  getRecentGitUsers
} from './repo-info.js';

// 稀疏克隆
export { sparseClone } from './sparseClone.js';

// Git 克隆（支持镜像加速）
export {
  parseGitUrl,
  validateRepo,
  checkNetwork,
  getAvailableRepoUrl,
  cloneRepo
} from './clone.js';

// Git 提交生成
export {
  checkApiKey,
  getStagedFiles,
  getUnstagedFiles,
  getAllChangedFiles,
  getStagedDiff,
  getUnstagedDiff,
  getAllDiff,
  getDiffStats,
  extractChangeSummary,
  generateChangeSummaryText,
  inferScope,
  inferType,
  getRecentCommits,
  getLastCommitMessage,
  simplifyDiff,
  createOptimizedPrompt,
  generateCommitMessage,
  interactiveSelectType,
  interactiveConfirm,
  interactiveEdit,
  COMMIT_TYPES
} from './commit.js';

// Git 日志服务器
export {
  getFileContent,
  createGitLogServer
} from './log-server.js';

// Git 日志报告生成
export {
  formatDateDisplay,
  generateLogReport
} from './log.js';
