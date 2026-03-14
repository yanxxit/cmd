/**
 * Web IDE Lite v2 - 编辑器操作
 */
import { nextTick } from 'vue';

export function createEditorActions(state, showToast, composables) {
  const onInput = () => {
    if (state.currentFile.value) {
      state.currentFile.value.content = state.editorContent.value;
      state.currentFile.value.modified = true;
      const tab = state.openTabs.value.find(t => t.id === state.currentFile.value.id);
      if (tab) tab.modified = true;
    }
    updateCursorPosition(state);
    
    // 触发自动保存
    if (composables?.handleContentChange) {
      composables.handleContentChange();
    }
  };

  const syncScroll = (e) => {
    const highlight = document.querySelector('.code-highlight');
    if (highlight) {
      highlight.scrollTop = e.target.scrollTop;
      highlight.scrollLeft = e.target.scrollLeft;
    }
  };

  const onTab = (e) => {
    e.preventDefault();
    const textarea = state.editorRef.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    state.editorContent.value = state.editorContent.value.substring(0, start) + '  ' + state.editorContent.value.substring(end);
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    });
  };

  const changeLanguage = async () => {
    if (!state.currentFile.value) return;
    
    const lang = state.currentLanguage.value;
    
    // 加载语言组件
    if (window.PrismLoader) {
      try {
        await window.PrismLoader.loadLanguage(lang);
      } catch (err) {
        console.warn('加载语言组件失败:', err);
      }
    }
    
    // 更新文件语言
    state.currentFile.value.language = lang;
    
    // 强制触发 Vue 响应式更新
    state.editorContent.value = state.editorContent.value;
    
    showToast(`✅ 语言已切换为 ${lang}`, 'success');
  };

  return { onInput, syncScroll, onTab, changeLanguage };
}

function updateCursorPosition(state) {
  if (state.editorRef.value) {
    const text = state.editorContent.value.substring(0, state.editorRef.value.selectionStart);
    const lines = text.split('\n');
    state.cursorLine.value = lines.length;
    state.cursorColumn.value = lines[lines.length - 1].length + 1;
  }
}
