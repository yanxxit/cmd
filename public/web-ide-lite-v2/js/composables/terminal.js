/**
 * Web IDE Lite v2 - 终端面板功能
 * 
 * 功能：
 * 1. 输出控制台
 * 2. 日志显示
 * 3. 清空/过滤
 * 4. 折叠/展开
 */

// 日志类型
const LOG_TYPES = {
  info: { icon: 'ℹ️', color: '#4a9eff' },
  success: { icon: '✅', color: '#4caf50' },
  warning: { icon: '⚠️', color: '#ff9800' },
  error: { icon: '❌', color: '#f44336' },
  debug: { icon: '🐛', color: '#9c27b0' }
};

/**
 * 创建终端状态管理
 * @returns {Object} 状态对象
 */
export function createTerminalState() {
  return {
    visible: false,
    height: 200,
    logs: [],
    filter: '',
    filterType: 'all', // 'all', 'info', 'success', 'warning', 'error', 'debug'
    autoScroll: true,
    maxLogs: 1000
  };
}

/**
 * 添加日志
 * @param {Object} state - 终端状态
 * @param {string} message - 日志消息
 * @param {string} type - 日志类型
 * @param {Object} data - 附加数据
 */
export function addLog(state, message, type = 'info', data = null) {
  const log = {
    id: Date.now() + Math.random(),
    timestamp: Date.now(),
    message,
    type,
    data,
    collapsed: false
  };
  
  state.logs.push(log);
  
  // 限制日志数量
  if (state.logs.length > state.maxLogs) {
    state.logs.shift();
  }
  
  // 自动滚动
  if (state.autoScroll) {
    setTimeout(() => {
      const container = document.querySelector('.terminal-logs');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }
}

/**
 * 添加信息日志
 */
export function logInfo(state, message, data) {
  addLog(state, message, 'info', data);
}

/**
 * 添加成功日志
 */
export function logSuccess(state, message, data) {
  addLog(state, message, 'success', data);
}

/**
 * 添加警告日志
 */
export function logWarning(state, message, data) {
  addLog(state, message, 'warning', data);
}

/**
 * 添加错误日志
 */
export function logError(state, message, data) {
  addLog(state, message, 'error', data);
}

/**
 * 添加调试日志
 */
export function logDebug(state, message, data) {
  addLog(state, message, 'debug', data);
}

/**
 * 清空日志
 * @param {Object} state - 终端状态
 */
export function clearLogs(state) {
  state.logs = [];
}

/**
 * 过滤日志
 * @param {Object} state - 终端状态
 * @param {string} filter - 过滤文本
 * @param {string} filterType - 过滤类型
 * @returns {Array} 过滤后的日志
 */
export function filterLogs(state, filter = '', filterType = 'all') {
  return state.logs.filter(log => {
    // 类型过滤
    if (filterType !== 'all' && log.type !== filterType) {
      return false;
    }
    
    // 文本过滤
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }
    
    return true;
  });
}

/**
 * 获取日志统计
 * @param {Object} state - 终端状态
 * @returns {Object} 统计信息
 */
export function getLogStats(state) {
  return {
    total: state.logs.length,
    info: state.logs.filter(l => l.type === 'info').length,
    success: state.logs.filter(l => l.type === 'success').length,
    warning: state.logs.filter(l => l.type === 'warning').length,
    error: state.logs.filter(l => l.type === 'error').length,
    debug: state.logs.filter(l => l.type === 'debug').length
  };
}

/**
 * 格式化日志时间
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
export function formatLogTime(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * 导出日志
 * @param {Object} state - 终端状态
 * @param {string} format - 导出格式（'text', 'json'）
 * @returns {string} 导出的日志
 */
export function exportLogs(state, format = 'text') {
  if (format === 'json') {
    return JSON.stringify(state.logs, null, 2);
  }
  
  // 文本格式
  return state.logs.map(log => 
    `[${formatLogTime(log.timestamp)}] [${log.type.toUpperCase()}] ${log.message}`
  ).join('\n');
}

/**
 * 下载日志文件
 * @param {Object} state - 终端状态
 * @param {string} filename - 文件名
 * @param {string} format - 导出格式
 */
export function downloadLogs(state, filename = 'logs.txt', format = 'text') {
  const content = exportLogs(state, format);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 渲染终端面板
 * @param {HTMLElement} container - 容器元素
 * @param {Object} state - 终端状态
 * @param {Object} actions - 操作函数
 */
export function renderTerminal(container, state, actions) {
  if (!container) return;
  
  container.innerHTML = '';
  container.className = 'terminal-panel';
  
  if (!state.visible) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  container.style.height = `${state.height}px`;
  
  // 终端头部
  const header = document.createElement('div');
  header.className = 'terminal-header';
  header.innerHTML = `
    <div class="terminal-title">📟 输出</div>
    <div class="terminal-actions">
      <button class="terminal-btn" title="清空" onclick="actions.clearLogs()">🗑️</button>
      <button class="terminal-btn" title="下载" onclick="actions.downloadLogs()">📥</button>
      <button class="terminal-btn" title="关闭" onclick="actions.toggleTerminal()">✕</button>
    </div>
  </div>
  `;
  
  // 过滤栏
  const filterBar = document.createElement('div');
  filterBar.className = 'terminal-filter';
  filterBar.innerHTML = `
    <input type="text" class="terminal-search" placeholder="过滤日志..." value="${state.filter}"/>
    <select class="terminal-type-filter">
      <option value="all" ${state.filterType === 'all' ? 'selected' : ''}>全部</option>
      <option value="info" ${state.filterType === 'info' ? 'selected' : ''}>信息</option>
      <option value="success" ${state.filterType === 'success' ? 'selected' : ''}>成功</option>
      <option value="warning" ${state.filterType === 'warning' ? 'selected' : ''}>警告</option>
      <option value="error" ${state.filterType === 'error' ? 'selected' : ''}>错误</option>
      <option value="debug" ${state.filterType === 'debug' ? 'selected' : ''}>调试</option>
    </select>
    <span class="terminal-stats">${state.logs.length} 条日志</span>
  </div>
  `;
  
  // 日志区域
  const logsContainer = document.createElement('div');
  logsContainer.className = 'terminal-logs';
  
  const filteredLogs = filterLogs(state, state.filter, state.filterType);
  
  filteredLogs.forEach(log => {
    const logEl = document.createElement('div');
    logEl.className = `terminal-log log-${log.type}`;
    logEl.innerHTML = `
      <span class="log-time">${formatLogTime(log.timestamp)}</span>
      <span class="log-icon">${LOG_TYPES[log.type]?.icon || 'ℹ️'}</span>
      <span class="log-message">${log.message}</span>
    `;
    logsContainer.appendChild(logEl);
  });
  
  container.appendChild(header);
  container.appendChild(filterBar);
  container.appendChild(logsContainer);
  
  // 绑定事件
  bindTerminalEvents(container, state, actions);
}

/**
 * 绑定终端事件
 */
function bindTerminalEvents(container, state, actions) {
  const searchInput = container.querySelector('.terminal-search');
  const typeFilter = container.querySelector('.terminal-type-filter');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filter = e.target.value;
      // 重新渲染
    });
  }
  
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      state.filterType = e.target.value;
      // 重新渲染
    });
  }
}

/**
 * 添加终端样式
 */
export function addTerminalStyles() {
  const styleId = 'terminal-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .terminal-panel {
      background: #1e1e1e;
      border-top: 1px solid #404040;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    
    .terminal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #252526;
      border-bottom: 1px solid #404040;
    }
    
    .terminal-title {
      font-size: 13px;
      font-weight: 500;
      color: #cccccc;
    }
    
    .terminal-actions {
      display: flex;
      gap: 8px;
    }
    
    .terminal-btn {
      background: transparent;
      border: none;
      color: #cccccc;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .terminal-btn:hover {
      background: #404040;
    }
    
    .terminal-filter {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      background: #252526;
      border-bottom: 1px solid #404040;
    }
    
    .terminal-search {
      flex: 1;
      background: #3c3c3c;
      border: 1px solid #404040;
      color: #cccccc;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .terminal-type-filter {
      background: #3c3c3c;
      border: 1px solid #404040;
      color: #cccccc;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .terminal-stats {
      font-size: 12px;
      color: #858585;
      padding: 4px 8px;
    }
    
    .terminal-logs {
      flex: 1;
      overflow-y: auto;
      padding: 8px 12px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
    }
    
    .terminal-log {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 4px 0;
      border-bottom: 1px solid #333;
    }
    
    .terminal-log:last-child {
      border-bottom: none;
    }
    
    .log-time {
      color: #858585;
      font-size: 11px;
      white-space: nowrap;
    }
    
    .log-icon {
      font-size: 12px;
    }
    
    .log-message {
      color: #cccccc;
      flex: 1;
      word-break: break-all;
    }
    
    .log-info .log-message { color: #4a9eff; }
    .log-success .log-message { color: #4caf50; }
    .log-warning .log-message { color: #ff9800; }
    .log-error .log-message { color: #f44336; }
    .log-debug .log-message { color: #9c27b0; }
    
    .theme-light .terminal-panel {
      background: #ffffff;
      border-top-color: #e0e0e0;
    }
    
    .theme-light .terminal-header,
    .theme-light .terminal-filter {
      background: #f3f3f3;
      border-bottom-color: #e0e0e0;
    }
    
    .theme-light .terminal-title,
    .theme-light .terminal-btn {
      color: #333333;
    }
    
    .theme-light .terminal-search,
    .theme-light .terminal-type-filter {
      background: #ffffff;
      border-color: #e0e0e0;
      color: #333333;
    }
    
    .theme-light .terminal-log {
      border-bottom-color: #f0f0f0;
    }
    
    .theme-light .log-time {
      color: #999999;
    }
    
    .theme-light .log-message {
      color: #333333;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * 拦截控制台输出
 * @param {Object} state - 终端状态
 */
export function interceptConsole(state) {
  const originalConsole = { ...console };
  
  console.log = (...args) => {
    logInfo(state, args.join(' '));
    originalConsole.log(...args);
  };
  
  console.error = (...args) => {
    logError(state, args.join(' '));
    originalConsole.error(...args);
  };
  
  console.warn = (...args) => {
    logWarning(state, args.join(' '));
    originalConsole.warn(...args);
  };
  
  console.debug = (...args) => {
    logDebug(state, args.join(' '));
    originalConsole.debug(...args);
  };
  
  return () => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.debug = originalConsole.debug;
  };
}

// 自动添加样式
addTerminalStyles();
