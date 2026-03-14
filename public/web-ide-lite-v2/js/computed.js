/**
 * Web IDE Lite v2 - 计算属性
 */
import { computed as vueComputed } from 'vue';
import { languageMap } from './config.js';

export function createComputed(state) {
  return {
    highlightedCode: vueComputed(() => {
      if (!state.editorContent.value || !state.currentLanguage.value) {
        return state.editorContent.value || '';
      }
      const lang = state.currentLanguage.value;
      if (window.Prism?.languages[lang]) {
        try {
          return window.Prism.highlight(state.editorContent.value, window.Prism.languages[lang], lang);
        } catch (e) { console.warn('Prism 高亮失败:', e); }
      }
      return state.editorContent.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }),
    
    languageName: vueComputed(() => {
      if (!state.currentFile.value) return '';
      const ext = getExtension(state.currentFile.value.name);
      return languageMap[ext] || 'plaintext';
    }),
    
    rootFiles: vueComputed(() => state.files.value.filter(f => !f.folderId))
  };
}

function getExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}
