/**
 * 懒加载管理器
 * 图片、组件、路由的懒加载
 */

export class LazyLoader {
  constructor() {
    this.observers = new Map();
    this.loaded = new Set();
    this.init();
  }

  init() {
    // 图片懒加载
    this.observeImages();

    // 组件懒加载
    this.setupComponentLoader();
  }

  // 图片懒加载
  observeImages() {
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      images.forEach(img => imageObserver.observe(img));
      this.observers.set('images', imageObserver);
    } else {
      // 降级：直接加载
      images.forEach(img => this.loadImage(img));
    }
  }

  // 加载图片
  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (src) img.src = src;
    if (srcset) img.srcset = srcset;

    img.addEventListener('load', () => {
      img.classList.add('loaded');
      this.loaded.add(src);
    });

    img.addEventListener('error', () => {
      img.classList.add('error');
      console.error('[LazyLoader] Image load failed:', src);
    });
  }

  // 组件懒加载
  setupComponentLoader() {
    const components = document.querySelectorAll('[data-component]');

    if ('IntersectionObserver' in window) {
      const componentObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            this.loadComponent(el);
            observer.unobserve(el);
          }
        });
      }, {
        rootMargin: '100px 0px',
        threshold: 0
      });

      components.forEach(el => componentObserver.observe(el));
      this.observers.set('components', componentObserver);
    }
  }

  // 加载组件
  async loadComponent(el) {
    const componentName = el.dataset.component;
    const componentUrl = el.dataset.componentUrl || `/shared/components/${componentName}.js`;

    try {
      el.classList.add('loading');

      // 动态导入
      const module = await import(componentUrl);
      
      // 渲染组件
      if (module.render) {
        module.render(el);
      }

      el.classList.remove('loading');
      el.classList.add('loaded');
    } catch (error) {
      console.error('[LazyLoader] Component load failed:', componentName, error);
      el.classList.add('error');
    }
  }

  // 路由懒加载
  async loadRoute(routeName) {
    const routeMap = {
      'todo': '/todo-v7/index.html',
      'ide': '/web-ide/index.html',
      'ai': '/ai-chat/index.html',
      'calendar': '/calendar/index.html',
      'time': '/time/index.html',
      'files': '/file-viewer/index.html',
    };

    const url = routeMap[routeName];
    if (!url) {
      throw new Error(`Route not found: ${routeName}`);
    }

    try {
      const response = await fetch(url);
      return await response.text();
    } catch (error) {
      console.error('[LazyLoader] Route load failed:', routeName, error);
      throw error;
    }
  }

  // 预加载资源
  preload(urls) {
    urls.forEach(url => {
      if (this.loaded.has(url)) return;

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);

      // 预加载到缓存
      if ('caches' in window) {
        caches.open('prefetch-cache').then(cache => {
          fetch(url).then(response => {
            if (response.ok) cache.put(url, response);
          });
        });
      }
    });
  }

  // 预加载关键资源
  preloadCritical() {
    const criticalResources = [
      '/libs/vue/dist/vue.global.prod.js',
      '/shared/index.js',
      '/shared/utils.js',
    ];
    this.preload(criticalResources);
  }

  // 清理观察器
  cleanup() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  // 获取加载状态
  getStatus() {
    return {
      loaded: this.loaded.size,
      observers: this.observers.size,
    };
  }
}

// 创建全局实例
export const lazyLoader = new LazyLoader();

// 便捷函数
export const preload = (urls) => lazyLoader.preload(urls);
export const preloadCritical = () => lazyLoader.preloadCritical();
export const loadRoute = (name) => lazyLoader.loadRoute(name);

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    lazyLoader.preloadCritical();
  });
} else {
  lazyLoader.preloadCritical();
}
