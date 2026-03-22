/**
 * 行差异信息
 */
export interface LineDiffInfo {
  content: string;
  type: 'added' | 'modified' | 'deleted' | 'same';
}

/**
 * 差异节点
 */
export interface DiffNode {
  path: string;
  key: string;
  type: 'same' | 'modified' | 'added';
  leftValue?: any;
  rightValue?: any;
  children?: any;
}

/**
 * 差异结果
 */
export interface DiffResult {
  stats: {
    total: number;
    same: number;
    modified: number;
    added: number;
  };
  diff: DiffNode[];
}

/**
 * 文件上传结果
 */
export interface FileUploadResult {
  fileName: string;
  content: string;
  target: 'left' | 'right';
}
