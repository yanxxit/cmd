/**
 * 共享模块统一导出
 * 方便其他页面引用
 */

// 设计系统
export { designSystem, generateCSSVariables, navigation } from './design-system.js';

// 全局导航
export { createGlobalNavbar, initThemeToggle, applyGlobalNavbar } from './global-navbar.js';

// Toast 通知
export { ToastManager, toast, showToast, showSuccess, showError, showWarning, showInfo } from './toast.js';

// PWA 管理
export { PWAManager, pwa, showInstallPrompt, cacheResources, clearCache, getCacheStatus, onPWAEvent } from './pwa-manager.js';

// 懒加载
export { LazyLoader, lazyLoader, preload, preloadCritical, loadRoute } from './lazy-loader.js';

// 工具函数
export * from './utils.js';

// 版本信息
export const VERSION = '1.0.0';
export const BUILD_DATE = '2026-03-13';
