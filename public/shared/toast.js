/**
 * Toast 通知组件
 * 全局可用的消息提示
 */

export class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.id = 0;
    this.init();
  }

  init() {
    // 创建容器
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.innerHTML = `
      <style>
        .toast-container {
          position: fixed;
          top: 70px;
          right: 24px;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        .toast {
          min-width: 300px;
          max-width: 500px;
          padding: 14px 20px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
          pointer-events: auto;
          animation: toastSlideIn 0.3s ease;
          backdrop-filter: blur(10px);
        }

        @keyframes toastSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes toastSlideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .toast-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          color: white;
        }

        .toast-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .toast-close:hover {
          opacity: 1;
        }

        /* 主题变体 */
        .toast-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .toast-error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .toast-warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .toast-info {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        }
      </style>
    `;
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 3000) {
    const id = ++this.id;
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = `toast-${id}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">×</button>
    `;

    // 关闭按钮
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(id));

    // 添加到容器
    this.container.appendChild(toast);
    this.toasts.push({ id, element: toast });

    // 自动移除
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  remove(id) {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index === -1) return;

    const toast = this.toasts[index].element;
    toast.style.animation = 'toastSlideOut 0.3s ease';

    setTimeout(() => {
      toast.remove();
      this.toasts.splice(index, 1);
    }, 300);
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  clear() {
    this.toasts.forEach(t => t.element.remove());
    this.toasts = [];
  }
}

// 创建全局实例
export const toast = new ToastManager();

// 便捷函数
export const showToast = (message, type = 'info', duration = 3000) => {
  return toast.show(message, type, duration);
};

export const showSuccess = (message, duration) => toast.success(message, duration);
export const showError = (message, duration) => toast.error(message, duration);
export const showWarning = (message, duration) => toast.warning(message, duration);
export const showInfo = (message, duration) => toast.info(message, duration);
