// js/icons.js - 集合图标 emoji 映射 + 候选项
export const ICON_EMOJI_MAP = {
  FolderOpenOutlined: '📁',
  AppstoreOutlined: '🧩',
  ApiOutlined: '🔌',
  BugOutlined: '🐞',
  ExperimentOutlined: '🧪',
  RocketOutlined: '🚀',
  DatabaseOutlined: '🗄️',
  CloudOutlined: '☁️',
  TagsOutlined: '🏷️',
  ProjectOutlined: '📋',
};

export const ICON_OPTIONS = [
  { value: 'FolderOpenOutlined', label: '📁 文件夹' },
  { value: 'AppstoreOutlined', label: '🧩 应用' },
  { value: 'ApiOutlined', label: '🔌 API' },
  { value: 'BugOutlined', label: '🐞 调试' },
  { value: 'ExperimentOutlined', label: '🧪 实验' },
  { value: 'RocketOutlined', label: '🚀 项目' },
  { value: 'DatabaseOutlined', label: '🗄️ 数据' },
  { value: 'CloudOutlined', label: '☁️ 云端' },
  { value: 'TagsOutlined', label: '🏷️ 标签' },
  { value: 'ProjectOutlined', label: '📋 项目' },
];

export const renderIcon = (icon) => ICON_EMOJI_MAP[icon] || '📁';
