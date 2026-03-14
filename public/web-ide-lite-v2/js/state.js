/**
 * Web IDE Lite v2 - 状态管理
 */
import { ref } from 'vue';

export function state() {
  return {
    editorRef: ref(null),
    currentFile: ref(null),
    openTabs: ref([]),
    files: ref([]),
    folders: ref([]),
    fileInput: ref(null),
    directoryInput: ref(null),
    editorContent: ref(''),
    rootDirectory: ref(''),
    toasts: ref([]),
    cursorLine: ref(1),
    cursorColumn: ref(1),
    currentLanguage: ref('plaintext'),
    isDark: ref(true),
    contextMenuVisible: ref(false),
    contextMenuPosition: ref({ x: 0, y: 0 }),
    contextMenuType: ref(''),
    currentContextMenuTarget: ref(null),
    showFileTypeDialog: ref(false),
    selectedFileTypes: ref([]),
    fileTypeFilter: ref('')
  };
}
