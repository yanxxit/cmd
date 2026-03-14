/**
 * Web IDE Lite v2 - 计算属性
 */
import { computed } from 'vue';
import { languageMap } from './config.js';

export function createComputed(state) {
  return {
    highlightedCode: computed(() => {
      const code = state.editorContent.value || '';
      const lang = state.currentLanguage.value || 'plaintext';
      
      // 纯文本不需要高亮
      if (lang === 'plaintext' || !code) {
        return escapeHtml(code);
      }
      
      // 检查 Prism 是否可用
      if (!window.Prism || !window.Prism.languages[lang]) {
        // 尝试使用 PrismLoader 加载
        if (window.PrismLoader) {
          window.PrismLoader.loadLanguage(lang).then(() => {
            // 加载完成后触发重新渲染（通过更新一个响应式变量）
            state.currentLanguage.value = state.currentLanguage.value;
          }).catch(() => {});
        }
        return escapeHtml(code);
      }
      
      // 使用 Prism 高亮
      try {
        return window.Prism.highlight(code, window.Prism.languages[lang], lang);
      } catch (e) {
        console.warn('Prism 高亮失败:', e);
        return escapeHtml(code);
      }
    }),

    languageName: computed(() => {
      if (!state.currentFile.value) return '';
      const ext = getExtension(state.currentFile.value.name);
      return languageMap[ext] || 'plaintext';
    }),

    rootFiles: computed(() => state.files.value.filter(f => !f.folderId))
  };
}

function getExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
