/**
 * JSON 对比模块统一导出
 */

// 组件
export { HighlightEditor } from './HighlightEditor';
export type { HighlightEditorProps } from './HighlightEditor';

// Hooks
export { useJsonDiff } from './useJsonDiff';
export type { HistoryItem, UseJsonDiffOptions } from './useJsonDiff';

// 工具函数
export {
  processLines,
  formatJson,
  minifyJson,
  parseJsonFile,
  processLargeJson,
  isValidJson,
  smartFormat,
  copyToClipboard,
} from './utils';

// 核心逻辑
export {
  sortKeysByPinyin,
  calculateDiff,
  filterSameFields,
  collectDiffPaths,
} from './logic';

// 类型
export type { LineDiffInfo, DiffNode, DiffResult, FileUploadResult } from './types';

// 常量
export { HIGHLIGHT_STYLES, EXAMPLES } from './constants';

// 样式
export { default as createStyles } from './styles';
