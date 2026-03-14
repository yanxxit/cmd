/**
 * 全局导航栏组件
 * 可复用到所有页面
 */

export function createGlobalNavbar(currentPath = '/') {
  const navItems = [
    { name: '首页', icon: '🏠', path: '/' },
    { name: 'TODO', icon: '✅', path: '/todo-v7/' },
    { name: '文件', icon: '📁', path: '/file-viewer/' },
    { name: 'IDE', icon: '💻', path: '/web-ide/' },
    { name: 'AI', icon: '🤖', path: '/ai-chat/' },
    { name: '日历', icon: '📅', path: '/calendar/' },
    { name: '时间', icon: '⏰', path: '/time/' },
    { name: '工具', icon: '🔧', path: '/mock/' },
  ];

  const navbar = document.createElement('nav');
  navbar.className = 'global-navbar';
  navbar.innerHTML = `
    <div class="navbar-content">
      <div class="navbar-brand">
        <span class="brand-icon">🧰</span>
        <span class="brand-text">Web 工具箱</span>
      </div>
      <div class="navbar-items">
        ${navItems.map(item => `
          <a href="${item.path}" class="navbar-item ${currentPath === item.path ? 'active' : ''}" title="${item.name}">
            <span class="item-icon">${item.icon}</span>
            <span class="item-name">${item.name}</span>
          </a>
        `).join('')}
      </div>
      <div class="navbar-actions">
        <button class="theme-toggle" id="globalThemeToggle" title="切换主题">
          🌙
        </button>
      </div>
    </div>
    <style>
      .global-navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 56px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
      }

      .navbar-content {
        max-width: 1800px;
        margin: 0 auto;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
      }

      .navbar-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        color: white;
        font-weight: 700;
        font-size: 18px;
        text-decoration: none;
      }

      .brand-icon {
        font-size: 28px;
      }

      .navbar-items {
        display: flex;
        gap: 4px;
      }

      .navbar-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .navbar-item:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .navbar-item.active {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .item-icon {
        font-size: 18px;
      }

      .item-name {
        display: none;
      }

      @media (min-width: 768px) {
        .item-name {
          display: inline;
        }
      }

      .navbar-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .theme-toggle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        transition: all 0.2s;
      }

      .theme-toggle:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }

      /* 页面内容偏移 */
      body.has-navbar {
        padding-top: 56px;
      }
    </style>
  `;

  return navbar;
}

// 初始化主题切换
export function initThemeToggle() {
  const toggle = document.getElementById('globalThemeToggle');
  if (!toggle) return;

  // 加载保存的主题
  const savedTheme = localStorage.getItem('global-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  toggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('global-theme', next);
    toggle.textContent = next === 'light' ? '🌙' : '☀️';
  });
}

// 应用全局导航到页面
export function applyGlobalNavbar(currentPath = '/') {
  // 添加 body 类
  document.body.classList.add('has-navbar');

  // 创建并插入导航栏
  const navbar = createGlobalNavbar(currentPath);
  document.body.insertBefore(navbar, document.body.firstChild);

  // 初始化主题切换
  initThemeToggle();
}
