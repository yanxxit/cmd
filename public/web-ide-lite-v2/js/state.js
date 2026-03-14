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
    importSettingsFile: ref(null),
    editorContent: ref(''),
    rootDirectory: ref(''),
    toasts: ref([]),
    cursorLine: ref(1),
    cursorColumn: ref(1),
    currentLanguage: ref('plaintext'),
    isDark: ref(true),
    // 右键菜单状态
    contextMenuVisible: ref(false),
    contextMenuPosition: ref({ x: 0, y: 0 }),
    contextMenuType: ref(''),
    currentContextMenuTarget: ref(null),
    // 编辑器右键菜单状态
    editorContextMenuVisible: ref(false),
    editorContextMenuPosition: ref({ x: 0, y: 0 }),
    showFileTypeDialog: ref(false),
    selectedFileTypes: ref([]),
    fileTypeFilter: ref(''),
    // 响应式布局状态
    sidebarOpen: ref(false),
    // 设置相关状态
    settingsVisible: ref(false),
    currentSettingsCategory: ref('editor'),
    settings: ref(null)
  };
}
