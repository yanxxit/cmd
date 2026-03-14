/**
 * PWA 管理器
 * 处理 Service Worker 注册、离线检测、安装提示等
 */

export class PWAManager {
  constructor() {
    this.registration = null;
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.init();
  }

  async init() {
    // 监听网络状态
    this.setupNetworkListeners();

    // 注册 Service Worker
    await this.registerServiceWorker();

    // 监听安装事件
    this.setupInstallListener();

    // 检查更新
    this.checkForUpdates();
  }

  // 注册 Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[PWA] Service Worker registered:', this.registration.scope);

        // 监听更新
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  // 设置网络监听
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.dispatch('online');
      console.log('[PWA] Back online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.dispatch('offline');
      console.log('[PWA] Gone offline');
    });
  }

  // 安装事件监听
  setupInstallListener() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.dispatch('installable', { prompt: e });
      console.log('[PWA] Install prompt available');
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.dispatch('installed');
      console.log('[PWA] App installed');
    });
  }

  // 显示安装提示
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    this.deferredPrompt = null;
    return outcome === 'accepted';
  }

  // 显示更新通知
  showUpdateNotification() {
    const message = '📦 有新版本可用，刷新页面以更新';
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'pwa-update-notification';
    notification.innerHTML = `
      <span>${message}</span>
      <button class="refresh-btn">立即刷新</button>
      <button class="dismiss-btn">×</button>
      <style>
        .pwa-update-notification {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 1002;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        .refresh-btn, .dismiss-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .refresh-btn:hover, .dismiss-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>
    `;

    // 刷新按钮
    notification.querySelector('.refresh-btn').addEventListener('click', () => {
      window.location.reload();
    });

    // 关闭按钮
    notification.querySelector('.dismiss-btn').addEventListener('click', () => {
      notification.remove();
    });

    document.body.appendChild(notification);

    // 5 秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  // 检查更新
  async checkForUpdates() {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('[PWA] Checked for updates');
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
    }
  }

  // 缓存资源
  async cacheResources(urls) {
    if (!this.registration) return;

    try {
      const cache = await caches.open('manual-cache');
      await cache.addAll(urls);
      console.log('[PWA] Cached resources:', urls);
    } catch (error) {
      console.error('[PWA] Cache failed:', error);
    }
  }

  // 清除缓存
  async clearCache() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[PWA] Cache cleared');
  }

  // 获取缓存状态
  async getCacheStatus() {
    const cacheNames = await caches.keys();
    const status = {};

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      status[name] = keys.length;
    }

    return status;
  }

  // 发送自定义事件
  dispatch(type, detail = {}) {
    window.dispatchEvent(new CustomEvent(`pwa:${type}`, { detail }));
  }

  // 监听 PWA 事件
  on(event, callback) {
    window.addEventListener(`pwa:${event}`, (e) => callback(e.detail));
  }

  // 离线检测
  isOffline() {
    return !this.isOnline;
  }

  // 在线检测
  isOnline() {
    return this.isOnline;
  }
}

// 创建全局实例
export const pwa = new PWAManager();

// 便捷函数
export const showInstallPrompt = () => pwa.showInstallPrompt();
export const cacheResources = (urls) => pwa.cacheResources(urls);
export const clearCache = () => pwa.clearCache();
export const getCacheStatus = () => pwa.getCacheStatus();
export const onPWAEvent = (event, callback) => pwa.on(event, callback);
