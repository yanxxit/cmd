/**
 * TODO List 应用前端逻辑
 */

// API 基础路径
const API_BASE = '/api/todos';

// 全局状态
let state = {
  todos: [],
  filter: 'all', // all, pending, completed
  sort: 'created_desc',
  search: '',
  selectedIds: [],
  editingId: null,
  currentTodo: null
};

// DOM 元素
const elements = {};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  bindEvents();
  updateDate();
  loadTodos();
  loadStats();
});

/**
 * 初始化 DOM 元素引用
 */
function initElements() {
  elements.taskInput = document.getElementById('taskInput');
  elements.taskList = document.getElementById('taskList');
  elements.emptyState = document.getElementById('emptyState');
  elements.totalCount = document.getElementById('totalCount');
  elements.pendingCount = document.getElementById('pendingCount');
  elements.completedCount = document.getElementById('completedCount');
  elements.currentDate = document.getElementById('currentDate');
  elements.pageTitle = document.getElementById('pageTitle');
  elements.toastContainer = document.getElementById('toastContainer');
  elements.taskModal = document.getElementById('taskModal');
  elements.detailCompleted = document.getElementById('detailCompleted');
  elements.detailContent = document.getElementById('detailContent');
  elements.detailNote = document.getElementById('detailNote');
  elements.detailDueDate = document.getElementById('detailDueDate');
  elements.detailSubtaskList = document.getElementById('detailSubtaskList');
  elements.subtaskCount = document.getElementById('subtaskCount');
  elements.subtaskInput = document.getElementById('subtaskInput');
  elements.saveTaskBtn = document.getElementById('saveTaskBtn');
  elements.deleteTaskBtn = document.getElementById('deleteTaskBtn');
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 添加任务
  elements.taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  });

  // 侧边栏导航
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = item.dataset.filter;
      setFilter(filter);
    });
  });

  // 模态框保存按钮
  elements.saveTaskBtn.addEventListener('click', saveEditingTodo);

  // 模态框删除按钮
  elements.deleteTaskBtn.addEventListener('click', deleteEditingTodo);

  // 子任务输入
  elements.subtaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addSubtask();
    }
  });

  // 点击遮罩关闭模态框
  elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) {
      closeTaskModal();
    }
  });

  // 键盘事件
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.taskModal.classList.contains('hidden')) {
      closeTaskModal();
    }
  });
}

/**
 * 更新日期显示
 */
function updateDate() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  elements.currentDate.textContent = now.toLocaleDateString('zh-CN', options);
}

/**
 * 加载任务列表
 */
async function loadTodos() {
  try {
    const params = new URLSearchParams();
    if (state.filter !== 'all') {
      params.set('filter', state.filter);
    }
    params.set('sort', state.sort);
    if (state.search) {
      params.set('search', state.search);
    }

    const response = await fetch(`${API_BASE}?${params}`);
    const result = await response.json();

    if (result.success) {
      state.todos = result.data;
      renderTodos();
    } else {
      showToast('加载任务失败：' + result.error, 'error');
    }
  } catch (err) {
    console.error('加载任务失败:', err);
    showToast('网络错误，请稍后重试', 'error');
  }
}

/**
 * 加载统计信息
 */
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    const result = await response.json();

    if (result.success) {
      const stats = result.data;
      elements.totalCount.textContent = stats.total;
      elements.pendingCount.textContent = stats.pending;
      elements.completedCount.textContent = stats.completed;
    }
  } catch (err) {
    console.error('加载统计失败:', err);
  }
}

/**
 * 渲染任务列表
 */
function renderTodos() {
  const filtered = state.todos;

  if (filtered.length === 0) {
    elements.taskList.innerHTML = '';
    elements.emptyState.classList.remove('hidden');
    return;
  }

  elements.emptyState.classList.add('hidden');

  elements.taskList.innerHTML = filtered.map(todo => {
    const isCompleted = todo.completed;
    const priorityClass = getPriorityClass(todo.priority);
    const priorityText = getPriorityText(todo.priority);
    const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !isCompleted;
    const dueDateStr = todo.due_date ? formatDate(todo.due_date) : '';

    return `
      <div class="task-item ${isCompleted ? 'completed' : ''} ${state.selectedIds.includes(todo.id) ? 'selected' : ''}" data-id="${todo.id}">
        <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''} data-id="${todo.id}">
        <div class="task-content-wrapper">
          <div class="task-content">${escapeHtml(todo.content)}</div>
          <div class="task-meta">
            <span class="priority-badge ${priorityClass}">
              ${getPriorityIcon(todo.priority)} ${priorityText}
            </span>
            ${dueDateStr ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">📅 ${dueDateStr}</span>` : ''}
            ${todo.subtask_count > 0 ? `
              <span class="subtask-info">
                📝 ${todo.subtask_completed}/${todo.subtask_count}
              </span>
            ` : ''}
            ${todo.note ? '<span>📝 有备注</span>' : ''}
            <span>⏰ ${formatTime(todo.created_at)}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="task-action-btn edit" onclick="editTodo(${todo.id})" title="编辑">✏️</button>
          <button class="task-action-btn delete" onclick="confirmDeleteTodo(${todo.id})" title="删除">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  // 绑定复选框事件
  elements.taskList.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      toggleTodoStatus(e.target.dataset.id, e.target.checked);
    });
  });

  // 绑定双击编辑事件
  elements.taskList.querySelectorAll('.task-item').forEach(item => {
    item.addEventListener('dblclick', (e) => {
      // 如果点击的是复选框或按钮，不触发双击编辑
      if (e.target.classList.contains('task-checkbox') || 
          e.target.classList.contains('task-action-btn') ||
          e.target.closest('.task-actions')) {
        return;
      }
      const todoId = item.dataset.id;
      editTodo(parseInt(todoId));
    });
  });
}

/**
 * 添加任务
 */
async function addTodo() {
  const content = elements.taskInput.value.trim();
  if (!content) {
    showToast('请输入任务内容', 'warning');
    return;
  }

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        priority: 2,
        note: ''
      })
    });

    const result = await response.json();

    if (result.success) {
      elements.taskInput.value = '';
      showToast('任务添加成功', 'success');
      loadTodos();
      loadStats();
    } else {
      showToast('添加失败：' + result.error, 'error');
    }
  } catch (err) {
    console.error('添加任务失败:', err);
    showToast('网络错误，请稍后重试', 'error');
  }
}

/**
 * 切换任务状态
 */
async function toggleTodoStatus(id, completed) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });

    const result = await response.json();

    if (result.success) {
      showToast(completed ? '任务已完成' : '任务已恢复', 'success');
      loadTodos();
      loadStats();
    } else {
      showToast('更新失败：' + result.error, 'error');
    }
  } catch (err) {
    console.error('更新任务失败:', err);
    showToast('网络错误，请稍后重试', 'error');
  }
}

/**
 * 编辑任务
 */
async function editTodo(id) {
  const todo = state.todos.find(t => t.id === id);
  if (!todo) return;

  state.editingId = id;
  state.currentTodo = todo;

  elements.detailCompleted.checked = todo.completed;
  elements.detailContent.value = todo.content;
  elements.detailNote.value = todo.note || '';
  elements.detailDueDate.value = todo.due_date || '';

  // 加载子任务
  loadSubtasks(id);

  elements.taskModal.classList.remove('hidden');
}

/**
 * 加载子任务
 */
async function loadSubtasks(todoId) {
  try {
    const response = await fetch(`${API_BASE}/subtasks?todo_id=${todoId}`);
    const result = await response.json();

    if (result.success) {
      renderSubtasks(result.data);
    }
  } catch (err) {
    console.error('加载子任务失败:', err);
  }
}

/**
 * 渲染子任务
 */
function renderSubtasks(subtasks) {
  if (subtasks.length === 0) {
    elements.detailSubtaskList.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 10px 0;">暂无子任务</p>';
    elements.subtaskCount.textContent = '0/0';
    return;
  }

  const completed = subtasks.filter(s => s.completed).length;
  elements.subtaskCount.textContent = `${completed}/${subtasks.length}`;

  elements.detailSubtaskList.innerHTML = subtasks.map(subtask => `
    <div class="subtask-item ${subtask.completed ? 'completed' : ''}" data-id="${subtask.id}">
      <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''} data-id="${subtask.id}">
      <span class="subtask-content">${escapeHtml(subtask.content)}</span>
      <div class="subtask-actions">
        <button class="subtask-action-btn" onclick="deleteSubtask(${subtask.id})" title="删除">🗑️</button>
      </div>
    </div>
  `).join('');

  // 绑定子任务复选框事件
  elements.detailSubtaskList.querySelectorAll('.subtask-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      toggleSubtaskStatus(e.target.dataset.id, e.target.checked);
    });
  });

  // 绑定子任务双击编辑事件
  elements.detailSubtaskList.querySelectorAll('.subtask-item').forEach(item => {
    item.addEventListener('dblclick', (e) => {
      // 如果点击的是复选框或按钮，不触发双击编辑
      if (e.target.classList.contains('subtask-checkbox') ||
          e.target.classList.contains('subtask-action-btn') ||
          e.target.closest('.subtask-actions')) {
        return;
      }
      const subtaskId = item.dataset.id;
      startEditSubtask(parseInt(subtaskId), item);
    });
  });
}

/**
 * 开始编辑子任务（inline 编辑模式）
 */
function startEditSubtask(id, itemElement) {
  // 如果已经在编辑中，不重复处理
  if (itemElement.classList.contains('editing')) return;

  const contentSpan = itemElement.querySelector('.subtask-content');
  const currentContent = contentSpan.textContent;

  // 标记为编辑状态
  itemElement.classList.add('editing');

  // 创建输入框
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'subtask-edit-input';
  input.value = currentContent;

  // 替换 span 为 input
  contentSpan.style.display = 'none';
  itemElement.insertBefore(input, contentSpan.nextSibling);
  input.focus();

  // 选中文本
  input.select();

  // 按回车或失去焦点时保存
  const saveEdit = () => {
    const newContent = input.value.trim();
    if (newContent && newContent !== currentContent) {
      saveSubtaskEdit(id, newContent, itemElement, input, contentSpan);
    } else {
      cancelEdit(itemElement, input, contentSpan);
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit(itemElement, input, contentSpan);
    }
  });

  input.addEventListener('blur', () => {
    // 延迟一点，避免和点击事件冲突
    setTimeout(() => {
      if (itemElement.contains(input)) {
        saveEdit();
      }
    }, 150);
  });
}

/**
 * 保存子任务编辑
 */
async function saveSubtaskEdit(id, newContent, itemElement, input, contentSpan) {
  try {
    const response = await fetch(`${API_BASE}/subtasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent })
    });

    const result = await response.json();

    if (result.success) {
      showToast('子任务已更新', 'success');
      loadSubtasks(state.currentTodo.id);
    } else {
      showToast('更新失败：' + result.error, 'error');
      cancelEdit(itemElement, input, contentSpan);
    }
  } catch (err) {
    console.error('更新子任务失败:', err);
    showToast('网络错误，请稍后重试', 'error');
    cancelEdit(itemElement, input, contentSpan);
  }
}

/**
 * 取消编辑
 */
function cancelEdit(itemElement, input, contentSpan) {
  itemElement.classList.remove('editing');
  input.remove();
  contentSpan.style.display = '';
}

/**
 * 添加子任务
 */
async function addSubtask() {
  const content = elements.subtaskInput.value.trim();
  if (!content || !state.currentTodo) return;

  try {
    const response = await fetch(`${API_BASE}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        todo_id: state.currentTodo.id,
        content,
        priority: 2
      })
    });

    const result = await response.json();

    if (result.success) {
      elements.subtaskInput.value = '';
      loadSubtasks(state.currentTodo.id);
      showToast('子任务添加成功', 'success');
    } else {
      showToast('添加失败：' + result.error, 'error');
    }
  } catch (err) {
    console.error('添加子任务失败:', err);
    showToast('网络错误，请稍后重试', 'error');
  }
}

/**
 * 切换子任务状态
 */
async function toggleSubtaskStatus(id, completed) {
  try {
    const response = await fetch(`${API_BASE}/subtasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });

    const result = await response.json();

    if (result.success) {
      loadSubtasks(state.currentTodo.id);
    } else {
      showToast('更新失败：' + result.error, 'error');
    }
  } catch (err) {
    console.error('更新子任务失败:', err);
    showToast('网络错误，请稍后重试', 'error');
  }
}

/**
 * 删除子任务
 */
async function deleteSubtask(id) {
  if (!confirm('确定删除此子任务？')) return;

  try {
    const response = await fetch(`${API_BASE}/subtasks/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      loadSubtasks(state.currentTodo.id);
      showToast('子任务已删除', 'success');
    } else {
      showToast('删除失败：' + result.error, 'error');
    }
  } catch (err) {
    console.error('删除子任务失败:', err);
    showToast('网络错误，请稍后重试', 'error');
  }
}

/**
 * 保存编辑的任务
 */
async function saveEditingTodo() {
  if (!state.editingId) return;

  const content = elements.detailContent.value.trim();
  if (!content) {
    showToast('任务内容不能为空', 'warning');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/${state.editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        completed: elements.detailCompleted.checked,
        note: elements.detailNote.value.trim(),
        due_date: elements.detailDueDate.value || null
      })
    });

    const result = await response.json();

    if (result.success) {
      showToast('任务已保存', 'success');
      closeTaskModal();
      loadTodos();
      loadStats();
    } else {
      showToast('保存失败：' + result.error, 'error');
    }
  } catch (err) {
    console.error('保存任务失败:', err);
    showToast('网络错误，请稍后重试', 'error');
  }
}

/**
 * 删除编辑中的任务
 */
async function deleteEditingTodo() {
  if (!state.editingId) return;

  if (!confirm('确定删除此任务？')) return;

  await confirmDeleteTodo(state.editingId);
}

/**
 * 确认删除任务
 */
async function confirmDeleteTodo(id) {
  if (!confirm('确定删除此任务？')) return;

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      showToast('任务已删除', 'success');
      closeTaskModal();
      loadTodos();
      loadStats();
    } else {
      showToast('删除失败：' + result.error, 'error');
    }
  } catch (err) {
    console.error('删除任务失败:', err);
    showToast('网络错误，请稍后重试', 'error');
  }
}

/**
 * 关闭任务详情模态框
 */
function closeTaskModal() {
  elements.taskModal.classList.add('hidden');
  state.editingId = null;
  state.currentTodo = null;
}

/**
 * 设置筛选
 */
function setFilter(filter) {
  state.filter = filter;

  // 更新导航状态
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.filter === filter);
  });

  // 更新标题
  const titles = {
    all: '全部任务',
    pending: '待处理',
    completed: '已完成'
  };
  elements.pageTitle.textContent = titles[filter];

  loadTodos();
}

/**
 * 显示 Toast 提示
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * 工具函数：获取优先级样式类
 */
function getPriorityClass(priority) {
  const map = { 1: 'priority-high', 2: 'priority-medium', 3: 'priority-low' };
  return map[priority] || 'priority-medium';
}

/**
 * 工具函数：获取优先级文本
 */
function getPriorityText(priority) {
  const map = { 1: '高', 2: '中', 3: '低' };
  return map[priority] || '中';
}

/**
 * 工具函数：获取优先级图标
 */
function getPriorityIcon(priority) {
  const map = { 1: '🔴', 2: '🟡', 3: '🟢' };
  return map[priority] || '🟡';
}

/**
 * 工具函数：格式化日期
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return `逾期${Math.abs(days)}天`;
  } else if (days === 0) {
    return '今天';
  } else if (days === 1) {
    return '明天';
  } else if (days <= 7) {
    return `${days}天后`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
}

/**
 * 工具函数：格式化时间
 */
function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
}

/**
 * 工具函数：HTML 转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 导出全局函数
window.editTodo = editTodo;
window.confirmDeleteTodo = confirmDeleteTodo;
window.closeTaskModal = closeTaskModal;
window.deleteSubtask = deleteSubtask;
window.startEditSubtask = startEditSubtask;
