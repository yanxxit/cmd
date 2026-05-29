/**
 * Web IDE Lite v2 - 操作函数（重构版）
 */
import { createFileActions } from './actions/file-actions.js';
import { createDirectoryActions } from './actions/directory-actions.js';
import { createEditorActions } from './actions/editor-actions.js';
import { createHarnessActions } from './actions/harness-actions.js';
import { createUIActions } from './actions/ui-actions.js';
import { fileTypes } from './config.js';

export function actions(state, composables = {}) {
  // UI 操作
  const uiActions = createUIActions(state);
  const { showToast } = uiActions;

  // Harness 开发模式
  const harnessActions = createHarnessActions(state, showToast);

  // 文件操作
  const fileActions = createFileActions(state, showToast, {
    onOpenFile: harnessActions.handleFileOpened
  });

  // 目录操作
  const dirActions = createDirectoryActions(state, showToast);

  // 编辑器操作（传入 composables 用于自动保存）
  const editorActions = createEditorActions(state, showToast, composables);

  // 添加 fileTypes 到 state
  state.fileTypes = { value: fileTypes };

  return {
    // UI
    ...uiActions,

    // Harness
    ...harnessActions,

    // 文件
    ...fileActions,

    // 目录
    ...dirActions,

    // 编辑器
    ...editorActions
  };
}
