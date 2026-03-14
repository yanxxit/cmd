/**
 * Web IDE Lite v2 - 加载状态管理
 * 
 * 功能：
 * 1. 骨架屏加载
 * 2. 加载动画
 * 3. 进度指示器
 * 4. 懒加载支持
 */

// 加载状态
let isLoading = false;
let loadingCount = 0;
const loadingListeners = [];

/**
 * 显示加载状态
 * @param {string} message - 加载消息
 */
export function showLoading(message = '加载中...') {
  isLoading = true;
  loadingCount++;
  notifyListeners();
  
  // 创建或更新加载遮罩
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = createLoadingOverlay();
    document.body.appendChild(overlay);
  }
  
  overlay.querySelector('.loading-message').textContent = message;
  overlay.classList.add('show');
  
  console.log('[Loading] 开始加载:', message);
}

/**
 * 隐藏加载状态
 */
export function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  
  if (loadingCount === 0) {
    isLoading = false;
    notifyListeners();
    
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (loadingCount === 0) {
          overlay.remove();
        }
      }, 300);
    }
    
    console.log('[Loading] 加载完成');
  }
}

/**
 * 创建加载遮罩
 * @returns {HTMLElement} 加载遮罩元素
 */
function createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <div class="loading-message">加载中...</div>
    </div>
  `;
  
  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    #loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
    }
    
    #loading-overlay.show {
      opacity: 1;
      visibility: visible;
    }
    
    .loading-content {
      text-align: center;
      color: #fff;
    }
    
    .loading-spinner {
      position: relative;
      width: 60px;
      height: 60px;
      margin: 0 auto 20px;
    }
    
    .spinner-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 3px solid transparent;
      border-top-color: #007acc;
      border-radius: 50%;
      animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    }
    
    .spinner-ring:nth-child(1) {
      animation-delay: -0.45s;
      border-top-color: #007acc;
    }
    
    .spinner-ring:nth-child(2) {
      animation-delay: -0.3s;
      border-top-color: #00bcd4;
    }
    
    .spinner-ring:nth-child(3) {
      animation-delay: -0.15s;
      border-top-color: #4caf50;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    .loading-message {
      font-size: 14px;
      font-weight: 500;
    }
  `;
  
  overlay.appendChild(style);
  return overlay;
}

/**
 * 监听加载状态变化
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消监听函数
 */
export function watchLoading(callback) {
  loadingListeners.push(callback);
  callback(isLoading);
  
  return () => {
    const index = loadingListeners.indexOf(callback);
    if (index > -1) {
      loadingListeners.splice(index, 1);
    }
  };
}

/**
 * 通知监听器
 */
function notifyListeners() {
  loadingListeners.forEach(cb => cb(isLoading));
}

/**
 * 检查是否正在加载
 * @returns {boolean} 是否正在加载
 */
export function isAnyLoading() {
  return isLoading;
}

/**
 * 骨架屏组件
 * @param {Object} options - 配置选项
 * @returns {string} HTML 字符串
 */
export function createSkeleton(options = {}) {
  const {
    type = 'text', // text, image, list, card
    width = '100%',
    height = '20px',
    borderRadius = '4px',
    count = 1
  } = options;
  
  const skeletonClass = `skeleton skeleton-${type}`;
  
  let skeleton = '';
  
  for (let i = 0; i < count; i++) {
    skeleton += `
      <div class="${skeletonClass}" 
           style="width: ${width}; height: ${height}; border-radius: ${borderRadius};"
           data-skeleton="true"></div>
    `;
  }
  
  return skeleton;
}

/**
 * 显示骨架屏
 * @param {string} containerSelector - 容器选择器
 * @param {Object} options - 骨架屏选项
 */
export function showSkeleton(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  container.innerHTML = createSkeleton(options);
  container.classList.add('skeleton-container');
}

/**
 * 隐藏骨架屏
 * @param {string} containerSelector - 容器选择器
 */
export function hideSkeleton(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  container.classList.remove('skeleton-container');
  const skeletons = container.querySelectorAll('[data-skeleton="true"]');
  skeletons.forEach(s => s.remove());
}

/**
 * 添加骨架屏样式
 */
export function addSkeletonStyles() {
  const styleId = 'skeleton-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .skeleton-container {
      position: relative;
      overflow: hidden;
    }
    
    .skeleton {
      background: linear-gradient(
        90deg,
        #2a2d2e 25%,
        #3a3d3e 50%,
        #2a2d2e 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      position: relative;
    }
    
    .skeleton-text {
      height: 16px;
      margin: 8px 0;
      border-radius: 4px;
    }
    
    .skeleton-image {
      width: 100%;
      height: 200px;
      border-radius: 8px;
    }
    
    .skeleton-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .skeleton-card {
      padding: 16px;
      border-radius: 8px;
      margin: 8px 0;
    }
    
    .skeleton-card .skeleton-text {
      margin: 4px 0;
    }
    
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
    
    /* 暗色主题适配 */
    .theme-light .skeleton {
      background: linear-gradient(
        90deg,
        #e0e0e0 25%,
        #f0f0f0 50%,
        #e0e0e0 75%
      );
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * 懒加载图片
 * @param {NodeList} images - 图片元素列表
 * @param {string} placeholder - 占位图 URL
 */
export function lazyLoadImages(images, placeholder = '') {
  if (!('IntersectionObserver' in window)) {
    // 不支持 IntersectionObserver，直接加载
    images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
    return;
  }
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      }
    });
  });
  
  images.forEach(img => {
    if (placeholder) {
      img.src = placeholder;
    }
    imageObserver.observe(img);
  });
}

/**
 * 懒加载组件
 * @param {string} selector - 选择器
 * @param {Function} loadFn - 加载函数
 * @param {Object} options - IntersectionObserver 选项
 */
export function lazyLoadComponent(selector, loadFn, options = {}) {
  if (!('IntersectionObserver' in window)) {
    loadFn();
    return;
  }
  
  const element = document.querySelector(selector);
  if (!element) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadFn();
        observer.unobserve(element);
      }
    });
  }, {
    rootMargin: '50px',
    ...options
  });
  
  observer.observe(element);
}

/**
 * 进度条组件
 * @returns {Object} 进度条控制对象
 */
export function createProgressBar() {
  let progress = 0;
  let element = null;
  
  return {
    /**
     * 显示进度条
     */
    show() {
      if (!element) {
        element = document.createElement('div');
        element.id = 'progress-bar';
        element.innerHTML = `
          <style>
            #progress-bar {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 3px;
              background: transparent;
              z-index: 10000;
            }
            #progress-bar .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #007acc, #00bcd4);
              transition: width 0.3s;
              width: 0;
            }
          </style>
          <div class="progress-fill"></div>
        `;
        document.body.appendChild(element);
      }
      element.style.display = 'block';
    },
    
    /**
     * 设置进度
     * @param {number} value - 进度值 (0-100)
     */
    set(value) {
      progress = Math.max(0, Math.min(100, value));
      if (element) {
        element.querySelector('.progress-fill').style.width = `${progress}%`;
      }
    },
    
    /**
     * 增加进度
     * @param {number} step - 增加的步长
     */
    increment(step = 10) {
      this.set(progress + step);
    },
    
    /**
     * 隐藏进度条
     */
    hide() {
      if (element) {
        element.style.display = 'none';
        this.set(0);
      }
    },
    
    /**
     * 获取当前进度
     * @returns {number} 当前进度
     */
    get() {
      return progress;
    }
  };
}

// 初始化时添加骨架屏样式
addSkeletonStyles();
