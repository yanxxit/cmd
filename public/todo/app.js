/**
 * TODO List Application
 */

// 全局状态
const state = {
  todos: [],
  filter: 'all', // all, pending, completed
  sort: 'created_desc',
  search: '',
  selectedIds: new Set(),
  theme: 'light',
  expandedTasks: new Set() // 展开的任务 ID（显示子任务）
};

// DOM 元素
const elements = {
  todoInput: document.getElementById('todoInput'),
  addBtn: document.getElementById('addBtn'),
  todoList: document.getElementById('todoList'),
  loading: document.getElementById('loading'),
  empty: document.getElementById('empty'),
  totalCount: document.getElementById('totalCount'),
  pendingCount: document.getElementById('pendingCount'),
  completedCount: document.getElementById('completedCount'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  sortSelect: document.getElementById('sortSelect'),
  searchInput: document.getElementById('searchInput'),
  batchBar: document.getElementById('batchBar'),
  selectedCount: document.getElementById('selectedCount'),
  batchComplete: document.getElementById('batchComplete'),
  batchDelete: document.getElementById('batchDelete'),
  cancelSelection: document.getElementById('cancelSelection'),
  // 编辑对话框
  editDialog: document.getElementById('editDialog'),
  editId: document.getElementById('editId'),
  editContent: document.getElementById('editContent'),
  editPriority: document.getElementById('editPriority'),
  editDueDate: document.getElementById('editDueDate'),
  editNote: document.getElementById('editNote'),
  closeEdit: document.getElementById('closeEdit'),
  cancelEdit: document.getElementById('cancelEdit'),
  saveEdit: document.getElementById('saveEdit'),
  // 主题切换
  themeToggle: document.getElementById('themeToggle'),
  // Toast
  toastContainer: document.getElementById('toastContainer')
};

const API_BASE = '/api/todos';

/**
 * API 请求封装
 */
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }
  
  return data;
}

/**
 * 获取 TODO 列表
 */
async function loadTodos() {
  try {
    const params = new URLSearchParams({
      filter: state.filter,
      sort: state.sort,
      parent_id: 'null' // 只获取主任务
    });

    if (state.search) {
      params.append('search', state.search);
    }

    const result = await apiRequest(`${API_BASE}?${params}`);
    state.todos = result.data;

    // 获取每个任务的子任务数量
    await Promise.all(state.todos.map(async (todo) => {
      try {
        const subResult = await apiRequest(`${API_BASE}/${todo.id}/subtodos`);
        todo.subtaskCount = subResult.data.length;
        todo.hasSubtasks = subResult.data.length > 0;
      } catch (e) {
        todo.subtaskCount = 0;
        todo.hasSubtasks = false;
      }
    }));

    renderTodos();
    updateStats();
    hideLoading();

  } catch (err) {
    console.error('加载 TODO 失败:', err);
    showToast('加载失败：' + err.message, 'error');
  }
}

/**
 * 添加 TODO
 */
async function addTodo(content, priority = 2, due_date = null, note = '') {
  if (!content || !content.trim()) {
    showToast('任务内容不能为空', 'warning');
    return;
  }

  try {
    const requestBody = {
      content: content.trim(),
      priority: parseInt(priority) || 2,
      due_date: due_date || null,
      note: note || '',
      parent_id: null
    };

    await apiRequest(API_BASE, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    showToast('任务添加成功', 'success');
    await loadTodos();

  } catch (err) {
    console.error('添加 TODO 失败:', err);
    showToast('添加失败：' + err.message, 'error');
  }
}

/**
 * 更新 TODO
 */
async function updateTodo(id, updates) {
  try {
    await apiRequest(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    
    showToast('任务更新成功', 'success');
    await loadTodos();
    
  } catch (err) {
    console.error('更新 TODO 失败:', err);
    showToast('更新失败：' + err.message, 'error');
  }
}

/**
 * 删除 TODO
 */
async function deleteTodo(id) {
  try {
    await apiRequest(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    
    showToast('任务删除成功', 'success');
    await loadTodos();
    
  } catch (err) {
    console.error('删除 TODO 失败:', err);
    showToast('删除失败：' + err.message, 'error');
  }
}

/**
 * 批量操作
 */
async function batchOperate(ids, action) {
  try {
    await apiRequest(`${API_BASE}/batch`, {
      method: 'POST',
      body: JSON.stringify({ ids, action })
    });
    
    const actionText = action === 'complete' ? '完成' : '删除';
    showToast(`已${actionText} ${ids.length} 个任务`, 'success');
    
    state.selectedIds.clear();
    updateBatchBar();
    await loadTodos();
    
  } catch (err) {
    console.error('批量操作失败:', err);
    showToast('操作失败：' + err.message, 'error');
  }
}

/**
 * 获取统计信息
 */
async function loadStats() {
  try {
    const result = await apiRequest(`${API_BASE}/stats`);
    const { total, pending, completed } = result.data;
    
    elements.totalCount.textContent = total;
    elements.pendingCount.textContent = pending;
    elements.completedCount.textContent = completed;
    
  } catch (err) {
    console.error('获取统计失败:', err);
  }
}

/**
 * 渲染 TODO 列表
 */
function renderTodos() {
  elements.todoList.innerHTML = '';
  
  if (state.todos.length === 0) {
    elements.empty.classList.remove('hidden');
    elements.todoList.classList.add('hidden');
    return;
  }
  
  elements.empty.classList.add('hidden');
  elements.todoList.classList.remove('hidden');
  
  const today = new Date().toISOString().split('T')[0];
  
  for (const todo of state.todos) {
    const item = createTodoItem(todo, today);
    elements.todoList.appendChild(item);
  }
}

/**
 * 创建 TODO 项
 */
function createTodoItem(todo, today, isSubtask = false) {
  const div = document.createElement('div');
  div.className = `todo-item${todo.completed ? ' completed' : ''}${state.selectedIds.has(todo.id) ? ' selected' : ''}${isSubtask ? ' subtask' : ''}`;
  div.dataset.id = todo.id;

  const priorityLabels = {
    1: { text: '高', class: 'high', icon: '🔴' },
    2: { text: '中', class: 'medium', icon: '🟡' },
    3: { text: '低', class: 'low', icon: '🟢' }
  };

  const priority = priorityLabels[todo.priority] || priorityLabels[2];

  // 检查是否逾期
  let dueClass = '';
  let dueText = '无截止日期';
  if (todo.due_date) {
    const dueDate = new Date(todo.due_date).toISOString().split('T')[0];
    if (dueDate < today && !todo.completed) {
      dueClass = 'overdue';
      dueText = `📅 逾期：${todo.due_date}`;
    } else {
      dueText = `📅 ${todo.due_date}`;
    }
  }

  // 子任务展开按钮
  const expandButton = todo.hasSubtasks !== false ? `
    <button class="btn btn-sm btn-icon expand-btn" title="${state.expandedTasks.has(todo.id) ? '收起子任务' : '展开子任务'}" data-action="expand">
      ${state.expandedTasks.has(todo.id) ? '🔼' : '🔽'}
    </button>
  ` : '';

  // 搜索高亮
  const highlightedContent = highlightSearch(todo.content);

  div.innerHTML = `
    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} ${state.selectedIds.has(todo.id) ? 'checked' : ''}>
    <div class="todo-content">
      <div>${highlightedContent}</div>
      <div class="todo-meta">
        <span class="todo-priority ${priority.class}">${priority.icon} ${priority.text}</span>
        <span class="todo-due ${dueClass}">${dueText}</span>
        ${todo.note ? `<span>📝 有备注</span>` : ''}
        <span>⏰ ${formatDate(todo.created_at)}</span>
        ${todo.subtaskCount > 0 ? `<span>📋 ${todo.subtaskCount} 子任务</span>` : ''}
      </div>
    </div>
    <div class="todo-actions">
      ${expandButton}
      <button class="btn btn-sm btn-icon" title="添加子任务" onclick="addSubtask(${todo.id})">➕</button>
      <button class="btn btn-sm btn-icon" title="编辑" onclick="editTodo(${todo.id})">✏️</button>
      <button class="btn btn-sm btn-icon" title="删除" onclick="deleteTodoById(${todo.id})">🗑️</button>
    </div>
    ${state.expandedTasks.has(todo.id) ? `<div class="subtasks-container" data-parent-id="${todo.id}"></div>` : ''}
  `;

  // 绑定事件
  const checkbox = div.querySelector('.todo-checkbox');
  checkbox.addEventListener('change', () => toggleSelect(todo.id));

  // 完成状态改变
  div.querySelector('.todo-checkbox').addEventListener('change', async (e) => {
    e.stopPropagation();
    await updateTodo(todo.id, { completed: e.target.checked });
  });

  // 展开/收起子任务
  const expandBtn = div.querySelector('.expand-btn');
  if (expandBtn) {
    expandBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await toggleExpandSubtasks(todo.id);
    });
  }

  return div;
}

/**
 * 更新统计
 */
function updateStats() {
  const total = state.todos.length;
  const completed = state.todos.filter(t => t.completed).length;
  const pending = total - completed;
  
  elements.totalCount.textContent = total;
  elements.pendingCount.textContent = pending;
  elements.completedCount.textContent = completed;
}

/**
 * 更新批量操作栏
 */
function updateBatchBar() {
  const count = state.selectedIds.size;
  
  if (count > 0) {
    elements.batchBar.classList.remove('hidden');
    elements.selectedCount.textContent = count;
  } else {
    elements.batchBar.classList.add('hidden');
  }
}

/**
 * 切换选择
 */
function toggleSelect(id) {
  if (state.selectedIds.has(id)) {
    state.selectedIds.delete(id);
  } else {
    state.selectedIds.add(id);
  }
  
  renderTodos();
  updateBatchBar();
}

/**
 * 显示加载
 */
function showLoading() {
  elements.loading.classList.remove('hidden');
  elements.todoList.classList.add('hidden');
  elements.empty.classList.add('hidden');
}

/**
 * 隐藏加载
 */
function hideLoading() {
  elements.loading.classList.add('hidden');
}

/**
 * Toast 提示
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * 格式化日期
 */
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 搜索关键词高亮
 */
function highlightSearch(text) {
  if (!state.search) return escapeHtml(text);
  
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${escapeHtml(state.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  
  return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * 编辑 TODO（全局函数）
 */
window.editTodo = async function(id) {
  const todo = state.todos.find(t => t.id === id);
  if (!todo) return;
  
  elements.editId.value = id;
  elements.editContent.value = todo.content;
  elements.editPriority.value = todo.priority;
  elements.editDueDate.value = todo.due_date || '';
  elements.editNote.value = todo.note || '';
  
  elements.editDialog.classList.remove('hidden');
};

/**
 * 删除 TODO（全局函数）
 */
window.deleteTodoById = async function(id) {
  if (!confirm('确定要删除这个任务吗？')) return;
  await deleteTodo(id);
};

/**
 * 绑定事件
 */
function bindEvents() {
  // 主题切换
  initTheme();
  elements.themeToggle.addEventListener('click', toggleTheme);

  // 添加任务
  elements.addBtn.addEventListener('click', () => {
    addTodo(elements.todoInput.value);
    elements.todoInput.value = '';
  });

  elements.todoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addTodo(elements.todoInput.value);
      elements.todoInput.value = '';
    }
  });
  
  // 筛选
  elements.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      loadTodos();
    });
  });
  
  // 排序
  elements.sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    loadTodos();
  });
  
  // 搜索（带防抖）
  let searchTimer = null;
  elements.searchInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    
    // 清除之前的定时器
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    // 防抖 300ms
    searchTimer = setTimeout(() => {
      state.search = value;
      loadTodos();
    }, 300);
  });
  
  // 批量操作
  elements.batchComplete.addEventListener('click', () => {
    batchOperate(Array.from(state.selectedIds), 'complete');
  });
  elements.batchDelete.addEventListener('click', () => {
    batchOperate(Array.from(state.selectedIds), 'delete');
  });
  elements.cancelSelection.addEventListener('click', () => {
    state.selectedIds.clear();
    renderTodos();
    updateBatchBar();
  });
  
  // 编辑对话框
  elements.closeEdit.addEventListener('click', () => {
    elements.editDialog.classList.add('hidden');
  });
  
  elements.cancelEdit.addEventListener('click', () => {
    elements.editDialog.classList.add('hidden');
  });
  
  elements.editDialog.querySelector('.modal-overlay').addEventListener('click', () => {
    elements.editDialog.classList.add('hidden');
  });
  
  elements.saveEdit.addEventListener('click', async () => {
    const id = parseInt(elements.editId.value);
    const content = elements.editContent.value.trim();
    
    if (!content) {
      showToast('任务内容不能为空', 'warning');
      return;
    }
    
    await updateTodo(id, {
      content: content,
      priority: parseInt(elements.editPriority.value),
      due_date: elements.editDueDate.value || null,
      note: elements.editNote.value.trim()
    });
    
    elements.editDialog.classList.add('hidden');
  });
  
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      elements.editDialog.classList.add('hidden');
      if (state.selectedIds.size > 0) {
        state.selectedIds.clear();
        renderTodos();
        updateBatchBar();
      }
    }
  });
}

/**
 * 初始化主题
 */
function initTheme() {
  const savedTheme = localStorage.getItem('todoTheme') || 'light';
  state.theme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

/**
 * 切换主题
 */
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon(state.theme);
  localStorage.setItem('todoTheme', state.theme);
}

/**
 * 更新主题图标
 */
function updateThemeIcon(theme) {
  const icon = elements.themeToggle.querySelector('.icon');
  if (icon) {
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
  }
}

/**
 * 展开/收起子任务
 */
async function toggleExpandSubtasks(todoId) {
  if (state.expandedTasks.has(todoId)) {
    state.expandedTasks.delete(todoId);
  } else {
    state.expandedTasks.add(todoId);
  }
  renderTodos();
  
  // 如果展开，加载子任务
  if (state.expandedTasks.has(todoId)) {
    await loadSubtodos(todoId);
  }
}

/**
 * 加载子任务
 */
async function loadSubtodos(parentId) {
  try {
    const container = document.querySelector(`.subtasks-container[data-parent-id="${parentId}"]`);
    if (!container) return;
    
    container.innerHTML = '<div class="loading-subtasks">加载中...</div>';
    
    const result = await apiRequest(`${API_BASE}/${parentId}/subtodos`);
    const subtodos = result.data;
    
    container.innerHTML = '';
    
    if (subtodos.length === 0) {
      container.innerHTML = '<div class="no-subtasks">暂无子任务</div>';
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    for (const subtodo of subtodos) {
      const subItem = createTodoItem(subtodo, today, true);
      container.appendChild(subItem);
    }
  } catch (err) {
    console.error('加载子任务失败:', err);
  }
}

/**
 * 添加子任务
 */
async function addSubtask(parentId) {
  const content = prompt('请输入子任务内容：');
  if (!content || !content.trim()) return;
  
  try {
    await apiRequest(API_BASE, {
      method: 'POST',
      body: JSON.stringify({
        content: content.trim(),
        priority: 2,
        parent_id: parentId
      })
    });
    
    showToast('子任务添加成功', 'success');
    
    // 如果在展开状态，重新加载子任务
    if (state.expandedTasks.has(parentId)) {
      await loadSubtodos(parentId);
    }
    
    // 重新加载主任务列表
    await loadTodos();
  } catch (err) {
    showToast('添加失败：' + err.message, 'error');
  }
}

/**
 * 删除子任务
 */
async function deleteSubtaskById(id) {
  if (!confirm('确定要删除这个子任务吗？')) return;
  
  try {
    await apiRequest(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    
    showToast('子任务已删除', 'success');
    
    // 重新加载主任务列表
    await loadTodos();
  } catch (err) {
    showToast('删除失败：' + err.message, 'error');
  }
}

// 使函数全局可用
window.addSubtask = addSubtask;
window.deleteSubtaskById = deleteSubtaskById;

/**
 * 初始化应用
 */
async function init() {
  bindEvents();
  showLoading();

  try {
    await loadTodos();
    await loadStats();
  } catch (err) {
    console.error('应用初始化失败:', err);
    showToast('应用初始化失败：' + err.message, 'error');
    hideLoading();
  }
}

// 启动应用
init();
