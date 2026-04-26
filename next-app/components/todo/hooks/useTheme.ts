/**
 * 主题自定义 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { ThemeType } from '../types';

interface UseThemeReturn {
  theme: ThemeType;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

/**
 * 获取系统主题偏好
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 应用主题
 */
function applyTheme(theme: 'light' | 'dark') {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  // 移除旧主题类
  root.classList.remove('light', 'dark');
  // 添加新主题类
  root.classList.add(theme);

  // 保存到 localStorage
  localStorage.setItem('theme', theme);
}

/**
 * 主题自定义 Hook
 */
export function useTheme(): UseThemeReturn {
  // 状态
  const [theme, setThemeState] = useState<ThemeType>('auto');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 初始化主题
  useEffect(() => {
    // 检查本地存储
    const savedTheme = localStorage.getItem('theme') as ThemeType | null;
    const initialTheme = savedTheme || 'auto';

    // 应用主题
    const actualTheme = initialTheme === 'auto' ? getSystemTheme() : initialTheme;
    applyTheme(actualTheme);

    // 不再使用 setTimeout，而是直接在这里或初始化时设置
    setThemeState(initialTheme);
    setIsDarkMode(actualTheme === 'dark');
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);
      setIsDarkMode(systemTheme === 'dark');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 设置主题
  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const actualTheme = newTheme === 'auto' ? getSystemTheme() : newTheme;
    applyTheme(actualTheme);
    setIsDarkMode(actualTheme === 'dark');
  }, []);

  // 切换主题
  const toggleTheme = useCallback(() => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  }, [isDarkMode, setTheme]);

  return {
    theme,
    isDarkMode,
    toggleTheme,
    setTheme,
  };
}
