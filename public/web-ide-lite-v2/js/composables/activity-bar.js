/**
 * Web IDE Lite v2 - 活动栏导航功能
 * 
 * 功能：
 * 1. 侧边图标导航
 * 2. 面板切换
 * 3. 活动栏隐藏/显示
 * 4. 图标自定义
 */

// 默认活动栏项目
const DEFAULT_ACTIVITY_ITEMS = [
  {
    id: 'explorer',
    icon: '📁',
    title: '文件资源管理器',
    tooltip: '文件资源管理器 (Ctrl+Shift+E)',
    panel: 'sidebar'
  },
  {
    id: 'search',
    icon: '🔍',
    title: '搜索',
    tooltip: '搜索 (Ctrl+Shift+F)',
    panel: 'sidebar',
    action: 'openSearch'
  },
  {
    id: 'files',
    icon: '📄',
    title: '打开的文件',
    tooltip: '打开的文件',
    panel: 'sidebar'
  },
  {
    id: 'source-control',
    icon: '📝',
    title: '源代码管理',
    tooltip: '源代码管理 (Ctrl+Shift+G)',
    panel: 'sidebar',
    disabled: true
  },
  {
    id: 'extensions',
    icon: '🧩',
    title: '扩展',
    tooltip: '扩展 (Ctrl+Shift+X)',
    panel: 'sidebar',
    disabled: true
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: '设置',
    tooltip: '设置 (Ctrl+,)',
    panel: 'modal',
    action: 'openSettings'
  }
];

/**
 * 创建活动栏状态管理
 * @returns {Object} 状态对象
 */
export function createActivityBarState() {
  return {
    visible: true,
    activeItem: 'explorer',
    items: [...DEFAULT_ACTIVITY_ITEMS],
    position: 'left' // 'left' or 'right'
  };
}

/**
 * 渲染活动栏
 * @param {HTMLElement} container - 容器元素
 * @param {Object} state - 活动栏状态
 * @param {Function} onItemClick - 点击回调
 */
export function renderActivityBar(container, state, onItemClick) {
  if (!container) return;
  
  container.innerHTML = '';
  container.className = `activity-bar activity-bar-${state.position}`;
  
  if (!state.visible) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  
  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'activity-bar-items';
  
  state.items.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = `activity-bar-item ${state.activeItem === item.id ? 'active' : ''}`;
    if (item.disabled) itemEl.classList.add('disabled');
    
    itemEl.innerHTML = `
      <span class="activity-bar-icon">${item.icon}</span>
      <span class="activity-bar-tooltip">${item.tooltip}</span>
    `;
    
    if (!item.disabled) {
      itemEl.addEventListener('click', () => {
        onItemClick(item);
      });
    }
    
    itemsContainer.appendChild(itemEl);
  });
  
  container.appendChild(itemsContainer);
}

/**
 * 处理活动栏点击
 * @param {Object} item - 点击的项目
 * @param {Object} state - 活动栏状态
 * @param {Object} actions - 操作函数
 */
export function handleActivityBarClick(item, state, actions) {
  if (item.disabled) return;
  
  state.activeItem = item.id;
  
  // 执行关联操作
  if (item.action) {
    switch (item.action) {
      case 'openSearch':
        if (actions.openSearchPanel) {
          actions.openSearchPanel();
        }
        break;
      case 'openSettings':
        if (actions.openSettings) {
          actions.openSettings();
        }
        break;
    }
  }
}

/**
 * 切换活动栏可见性
 * @param {Object} state - 活动栏状态
 */
export function toggleActivityBar(state) {
  state.visible = !state.visible;
}

/**
 * 切换活动栏位置
 * @param {Object} state - 活动栏状态
 */
export function toggleActivityBarPosition(state) {
  state.position = state.position === 'left' ? 'right' : 'left';
}

/**
 * 添加活动栏样式
 */
export function addActivityBarStyles() {
  const styleId = 'activity-bar-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .activity-bar {
      width: 48px;
      background: #333;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 0;
      flex-shrink: 0;
    }
    
    .activity-bar-right {
      order: 2;
    }
    
    .activity-bar-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      align-items: center;
    }
    
    .activity-bar-item {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.2s;
      position: relative;
    }
    
    .activity-bar-item:hover {
      background: #444;
    }
    
    .activity-bar-item.active {
      background: #444;
    }
    
    .activity-bar-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 2px;
      height: 20px;
      background: #007acc;
      border-radius: 1px;
    }
    
    .activity-bar-item.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    .activity-bar-item.disabled:hover {
      background: transparent;
    }
    
    .activity-bar-icon {
      font-size: 20px;
    }
    
    .activity-bar-tooltip {
      position: absolute;
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      background: #000;
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
      margin-left: 8px;
      z-index: 1000;
    }
    
    .activity-bar-item:hover .activity-bar-tooltip {
      opacity: 1;
    }
    
    .activity-bar-right .activity-bar-item .activity-bar-tooltip {
      left: auto;
      right: 100%;
      margin-left: 0;
      margin-right: 8px;
    }
    
    .theme-light .activity-bar {
      background: #f3f3f3;
    }
    
    .theme-light .activity-bar-item:hover {
      background: #e0e0e0;
    }
    
    .theme-light .activity-bar-item.active {
      background: #e0e0e0;
    }
    
    .theme-light .activity-bar-item.active::before {
      background: #0066cc;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * 注册活动栏快捷键
 * @param {Function} toggleSidebar - 切换侧边栏回调
 * @param {Function} openSearch - 打开搜索回调
 * @param {Function} openSettings - 打开设置回调
 */
export function registerActivityBarShortcuts(toggleSidebar, openSearch, openSettings) {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+E - 切换资源管理器
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      toggleSidebar();
    }
    
    // Ctrl+Shift+F - 打开搜索
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      openSearch();
    }
    
    // Ctrl+, - 打开设置
    if (e.ctrlKey && e.key === ',') {
      e.preventDefault();
      openSettings();
    }
    
    // Ctrl+B - 切换侧边栏
    if (e.ctrlKey && e.key === 'B') {
      e.preventDefault();
      toggleSidebar();
    }
  });
}

// 自动添加样式
addActivityBarStyles();
