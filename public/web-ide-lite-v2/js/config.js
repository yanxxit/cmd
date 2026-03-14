/**
 * Web IDE Lite v2 - 配置
 */
export const languageMap = {
  'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
  'py': 'python', 'go': 'go', 'html': 'html', 'css': 'css', 'scss': 'css',
  'json': 'json', 'md': 'markdown', 'yaml': 'yaml', 'sh': 'bash', 'sql': 'sql', 'xml': 'xml'
};

export const fileTypes = [
  { value: '.js,.jsx', icon: '🟨', label: 'JavaScript' },
  { value: '.ts,.tsx', icon: '🔷', label: 'TypeScript' },
  { value: '.py', icon: '🐍', label: 'Python' },
  { value: '.go', icon: '🔹', label: 'Go' },
  { value: '.html,.htm', icon: '🌐', label: 'HTML' },
  { value: '.css,.scss', icon: '🎨', label: 'CSS' },
  { value: '.json,.yaml', icon: '📋', label: '数据配置' },
  { value: '.md,.txt', icon: '📝', label: '文档' }
];
