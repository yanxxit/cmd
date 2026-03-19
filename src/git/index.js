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
  getCommitsByDateRange
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
  getTags
} from './repo-info.js';

// 稀疏克隆
export { sparseClone } from './sparseClone.js';
