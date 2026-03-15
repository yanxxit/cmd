/**
 * Mermaid 自定义主题配置
 * 参考：https://mermaid.js.org/config/theming.html
 */

export const customThemes = {
  // 复古 DOS 风格
  'retro-dos': {
    themeVariables: {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      primaryColor: '#0000AA',
      primaryTextColor: '#FFFFFF',
      primaryBorderColor: '#0000AA',
      lineColor: '#00AA00',
      secondaryColor: '#AA00AA',
      tertiaryColor: '#AA5500',
      mainBkg: '#0000AA',
      altBackground: '#00AA00',
      textColor: '#FFFFFF',
      edgeLabelBackground: '#000000',
      clusterBkg: '#111111',
      clusterBorder: '#00AA00',
      titleColor: '#FFFF55',
      nodeBorder: '#00AA00'
    }
  },

  // 夏日果汁风格
  'summer-juice': {
    themeVariables: {
      fontFamily: '"Comic Sans MS", cursive',
      fontSize: '14px',
      primaryColor: '#FF6B6B',
      primaryTextColor: '#FFFFFF',
      primaryBorderColor: '#FF6B6B',
      lineColor: '#4ECDC4',
      secondaryColor: '#FFE66D',
      tertiaryColor: '#95E1D3',
      mainBkg: '#FF6B6B',
      altBackground: '#FFE66D',
      textColor: '#2C3E50',
      edgeLabelBackground: '#FFFFFF',
      clusterBkg: '#F8F9FA',
      clusterBorder: '#4ECDC4',
      titleColor: '#FF6B6B',
      nodeBorder: '#FF6B6B'
    }
  },

  // 手绘彩笔风格
  'handdrawn-pastel': {
    themeVariables: {
      fontFamily: '"Segoe UI", sans-serif',
      fontSize: '14px',
      primaryColor: '#FFB5E8',
      primaryTextColor: '#5A3E5A',
      primaryBorderColor: '#FF80CC',
      lineColor: '#A0D2EB',
      secondaryColor: '#FFDAC1',
      tertiaryColor: '#E2F0CB',
      mainBkg: '#FFB5E8',
      altBackground: '#FFDAC1',
      textColor: '#5A3E5A',
      edgeLabelBackground: '#FFF9F0',
      clusterBkg: '#FFF9F0',
      clusterBorder: '#B5EAD7',
      titleColor: '#C7CEEA',
      nodeBorder: '#FF80CC'
    }
  },

  // 冰蓝理工风格
  'tech-ice': {
    themeVariables: {
      fontFamily: '"Roboto", "Microsoft YaHei", sans-serif',
      fontSize: '14px',
      primaryColor: '#00B4DB',
      primaryTextColor: '#FFFFFF',
      primaryBorderColor: '#0083B0',
      lineColor: '#0083B0',
      secondaryColor: '#74EBD5',
      tertiaryColor: '#9FACE6',
      mainBkg: '#00B4DB',
      altBackground: '#74EBD5',
      textColor: '#1A1A2E',
      edgeLabelBackground: '#FFFFFF',
      clusterBkg: '#E8F4F8',
      clusterBorder: '#0083B0',
      titleColor: '#0083B0',
      nodeBorder: '#0083B0'
    }
  },

  // 紫气东来风格
  'ethereal-purple': {
    themeVariables: {
      fontFamily: '"Noto Sans SC", sans-serif',
      fontSize: '14px',
      primaryColor: '#667EEA',
      primaryTextColor: '#FFFFFF',
      primaryBorderColor: '#764BA2',
      lineColor: '#F093FB',
      secondaryColor: '#FEC8D8',
      tertiaryColor: '#D291BC',
      mainBkg: '#667EEA',
      altBackground: '#FEC8D8',
      textColor: '#2D3748',
      edgeLabelBackground: '#FFFFFF',
      clusterBkg: '#F7FAFC',
      clusterBorder: '#9F7AEA',
      titleColor: '#667EEA',
      nodeBorder: '#764BA2'
    }
  },

  // 马卡龙渐变风格
  'macaron': {
    theme: 'base',
    themeVariables: {
      background: '#ffffff',
      primaryColor: '#fbcfe8',
      primaryTextColor: '#4b5563',
      primaryBorderColor: '#f472b6',
      lineColor: '#f9a8d4',
      textColor: '#4b5563',
      mainBkg: '#a5f3fc',
      secondaryColor: '#fde68a',
      tertiaryColor: '#c4b5fd',
      nodeBorder: '#fda4af',
      nodeTextColor: '#1f2937',
      fontFamily: 'Fira Code, JetBrains Mono, sans-serif',
      fontSize: '15px',
      noteBkgColor: '#fef9c3',
      noteTextColor: '#78350f',
      actorBkg: '#d8b4fe',
      actorBorder: '#a78bfa',
      sequenceNumberColor: '#f472b6',
      classText: '#6b21a8',
      classBackground: '#fbcfe8',
      classBorder: '#d946ef',
      labelBoxBkgColor: '#fef3c7',
      labelBoxBorderColor: '#facc15'
    }
  },

  // 赛博朋克风格
  'cyberpunk': {
    themeVariables: {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '14px',
      primaryColor: '#00F0FF',
      primaryTextColor: '#000000',
      primaryBorderColor: '#00F0FF',
      lineColor: '#FF00FF',
      secondaryColor: '#FFE600',
      tertiaryColor: '#FF6600',
      mainBkg: '#00F0FF',
      altBackground: '#1A1A2E',
      textColor: '#00F0FF',
      edgeLabelBackground: '#0D0D1A',
      clusterBkg: '#0D0D1A',
      clusterBorder: '#FF00FF',
      titleColor: '#FFE600',
      nodeBorder: '#00F0FF'
    }
  }
};

// 获取主题配置
export function getThemeConfig(themeName) {
  return customThemes[themeName] || null;
}

// 检查是否为自定义主题
export function isCustomTheme(themeName) {
  return customThemes.hasOwnProperty(themeName);
}
