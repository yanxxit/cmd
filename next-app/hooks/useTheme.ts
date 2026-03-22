import { useState, useEffect, useCallback } from 'react';

/**
 * 使用主题切换的自定义 Hook
 */
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 初始化主题
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
      
      setTheme(initialTheme);
      setIsDarkMode(initialTheme === 'dark');
    }
  }, []);

  // 应用主题
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
      setIsDarkMode(theme === 'dark');
    }
  }, [theme]);

  // 切换主题
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // 设置为亮色模式
  const setLightMode = useCallback(() => {
    setTheme('light');
  }, []);

  // 设置为暗色模式
  const setDarkMode = useCallback(() => {
    setTheme('dark');
  }, []);

  return {
    theme,
    isDarkMode,
    toggleTheme,
    setLightMode,
    setDarkMode,
  };
}
