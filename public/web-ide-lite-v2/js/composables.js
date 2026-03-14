/**
 * Web IDE Lite v2 - 组合式函数
 */
export function useComposables(state, actions) {
  return {
    getFileIcon: (filename) => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const icons = { js: '🟨', ts: '🔷', py: '🐍', go: '🔹', html: '🌐', css: '🎨', json: '📋', md: '📝', yaml: '📋', sh: '💻', sql: '🗄️', xml: '📄', txt: '📄' };
      return icons[ext] || '📄';
    }
  };
}
