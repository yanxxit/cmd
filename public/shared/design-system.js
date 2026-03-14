/**
 * 共享设计系统
 * 统一颜色、字体、间距等设计变量
 */

export const designSystem = {
  // 颜色系统
  colors: {
    // 主色调
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // 成功色
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
    // 警告色
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    // 危险色
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    // 中性色
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  // 字体系统
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"Monaco", "Consolas", "Courier New", monospace',
  },

  // 间距系统
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },

  // 圆角系统
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // 阴影系统
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },

  // 断点
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// 生成 CSS 变量
export function generateCSSVariables() {
  const vars = [];
  
  // 颜色变量
  Object.entries(designSystem.colors).forEach(([category, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      vars.push(`--${category}-${shade}: ${value}`);
    });
  });

  // 字体变量
  Object.entries(designSystem.fonts).forEach(([name, value]) => {
    vars.push(`--font-${name}: ${value}`);
  });

  // 间距变量
  Object.entries(designSystem.spacing).forEach(([name, value]) => {
    vars.push(`--spacing-${name}: ${value}`);
  });

  // 圆角变量
  Object.entries(designSystem.radius).forEach(([name, value]) => {
    vars.push(`--radius-${name}: ${value}`);
  });

  // 阴影变量
  Object.entries(designSystem.shadows).forEach(([name, value]) => {
    vars.push(`--shadow-${name}: ${value}`);
  });

  return vars.join(';\n  ');
}

// 全局导航配置
export const navigation = {
  items: [
    { name: '首页', icon: '🏠', path: '/' },
    { name: 'TODO', icon: '✅', path: '/todo-v7/' },
    { name: '文件', icon: '📁', path: '/file-viewer/' },
    { name: 'IDE', icon: '💻', path: '/web-ide/' },
    { name: 'AI', icon: '🤖', path: '/ai-chat/' },
    { name: '日历', icon: '📅', path: '/calendar/' },
    { name: '时间', icon: '⏰', path: '/time/' },
    { name: '工具', icon: '🔧', path: '/mock/' },
  ],
};
