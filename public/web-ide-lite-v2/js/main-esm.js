/**
 * Web IDE Lite v2 - 主入口（ES Modules 版本）
 * 
 * 使用 ES Modules 方式导入所有依赖
 */

// 导入 Vue
import { createApp } from 'vue';

// 导入本地模块
import { state } from './state.js';
import { createComputed } from './computed.js';
import { actions } from './actions.js';
import { useComposables } from './composables.js';
import { createErrorHandler, withError } from './error-handler.js';

// 导入 CSS（动态加载）
import { loadCSS } from './resource-loader.js';

// 加载 Prism CSS
loadCSS('/libs/prismjs/themes/prism-tomorrow.min.css');

/**
 * 创建 Web IDE 应用
 */
export function createWebIDE() {
  const app = createApp({
    setup() {
      const stateObj = state();

      // 先创建 composables（不含自动保存初始化）
      const composables = useComposables(stateObj, {});

      // 创建 actions 并传入 composables
      const actionsObj = actions(stateObj, composables);

      const computedObj = createComputed(stateObj);

      // 错误处理
      const errorHandler = createErrorHandler(actionsObj.showToast, (err) => {
        console.error('[App Error]', err);
      });

      // 包装错误处理
      actionsObj.saveCurrentFile = withError(
        actionsObj.saveCurrentFile,
        errorHandler,
        '保存文件'
      );

      actionsObj.openDirectory = withError(
        actionsObj.openDirectory,
        errorHandler,
        '打开目录'
      );

      // 挂载后初始化功能
      setTimeout(() => {
        composables.initSettingsFeature();
        composables.initThemeFeature();
        composables.initAutoSaveFeature();
        composables.initEditorSettingsFeature();
        composables.initShortcutsFeature();
        composables.initRecentFilesFeature();

        // 添加全局键盘事件监听
        addGlobalKeydownListener(actionsObj);
      }, 100);

      return {
        ...stateObj,
        ...computedObj,
        ...actionsObj,
        ...composables,
        errorHandler
      };
    }
  });

  return app;
}

// 添加全局键盘事件监听
function addGlobalKeydownListener(actionsObj) {
  document.addEventListener('keydown', (e) => {
    // Esc 键关闭菜单和弹框
    if (e.key === 'Escape') {
      actionsObj.handleEscapeKey();
    }

    // Ctrl+S 保存
    if (actionsObj.handleKeyDown) {
      actionsObj.handleKeyDown(actionsObj.saveCurrentFile)(e);
    }
  });
}

// 挂载应用
const app = createWebIDE();
app.mount('#app');

// 导出供外部使用
export { app };
