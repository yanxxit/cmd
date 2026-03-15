/**
 * Web IDE Lite v2 - 文件树拖拽功能
 * 
 * 功能：
 * 1. 文件拖拽排序
 * 2. 文件夹拖拽排序
 * 3. 文件拖入文件夹
 * 4. 拖拽视觉反馈
 */

/**
 * 处理拖拽开始
 * @param {DragEvent} e - 拖拽事件
 * @param {Object} item - 拖拽的文件/文件夹对象
 * @param {Object} state - Vue 响应式状态
 */
export function handleDragStart(e, item, state) {
  state.draggedItem.value = { ...item };
  
  // 设置拖拽数据
  e.dataTransfer.setData('application/json', JSON.stringify({
    id: item.id,
    type: item.folderId ? 'folder' : 'file',
    name: item.name
  }));
  
  // 设置拖拽效果
  e.dataTransfer.effectAllowed = 'move';
  
  // 添加拖拽样式
  setTimeout(() => {
    e.target.classList.add('dragging');
  }, 0);
}

/**
 * 处理拖拽结束
 * @param {DragEvent} e - 拖拽事件
 * @param {Object} state - Vue 响应式状态
 */
export function handleDragEnd(e, state) {
  e.target.classList.remove('dragging');
  state.draggedItem.value = null;
  state.dragOverItem.value = null;
}

/**
 * 处理拖拽悬停
 * @param {DragEvent} e - 拖拽事件
 * @param {Object} targetItem - 目标文件/文件夹对象
 * @param {Object} state - Vue 响应式状态
 */
export function handleDragOver(e, targetItem, state) {
  e.preventDefault();
  
  const draggedItem = state.draggedItem.value;
  if (!draggedItem || draggedItem.id === targetItem.id) {
    return;
  }
  
  // 设置放置效果
  e.dataTransfer.dropEffect = 'move';
  
  // 更新悬停目标
  state.dragOverItem.value = { ...targetItem };
}

/**
 * 处理放置
 * @param {DragEvent} e - 拖拽事件
 * @param {Object} targetItem - 目标文件/文件夹对象
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 */
export function handleDrop(e, targetItem, state, actions) {
  e.preventDefault();
  
  const draggedItem = state.draggedItem.value;
  if (!draggedItem || draggedItem.id === targetItem.id) {
    return;
  }
  
  // 获取拖拽数据
  const data = JSON.parse(e.dataTransfer.getData('application/json'));
  
  // 检查是否可以放置
  if (!canDrop(draggedItem, targetItem)) {
    actions.showToast('❌ 无法放置到此位置', 'error');
    return;
  }
  
  // 执行放置操作
  if (targetItem.folderId !== undefined) {
    // 放置到文件夹
    moveItemToFolder(draggedItem, targetItem, state, actions);
  } else {
    // 放置到文件旁边（排序）
    reorderItems(draggedItem, targetItem, state, actions);
  }
  
  // 清除状态
  state.draggedItem.value = null;
  state.dragOverItem.value = null;
}

/**
 * 检查是否可以放置
 * @param {Object} draggedItem - 拖拽的物品
 * @param {Object} targetItem - 目标物品
 * @returns {boolean} 是否可以放置
 */
function canDrop(draggedItem, targetItem) {
  // 不能拖拽到自己
  if (draggedItem.id === targetItem.id) {
    return false;
  }
  
  // 文件夹不能拖拽到自己的子文件夹
  if (draggedItem.folderId === targetItem.id) {
    return false;
  }
  
  return true;
}

/**
 * 移动物品到文件夹
 * @param {Object} draggedItem - 拖拽的物品
 * @param {Object} targetFolder - 目标文件夹
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 */
function moveItemToFolder(draggedItem, targetFolder, state, actions) {
  const files = state.files.value;
  const file = files.find(f => f.id === draggedItem.id);
  
  if (file) {
    file.folderId = targetFolder.id;
    actions.showToast(`✅ 已移动到 "${targetFolder.name}"`, 'success');
  }
}

/**
 * 重新排序物品
 * @param {Object} draggedItem - 拖拽的物品
 * @param {Object} targetItem - 目标物品
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 */
function reorderItems(draggedItem, targetItem, state, actions) {
  const files = state.files.value;
  const draggedIndex = files.findIndex(f => f.id === draggedItem.id);
  const targetIndex = files.findIndex(f => f.id === targetItem.id);
  
  if (draggedIndex === -1 || targetIndex === -1) {
    return;
  }
  
  // 移除拖拽物品
  const [removed] = files.splice(draggedIndex, 1);
  
  // 插入到目标位置
  files.splice(targetIndex, 0, removed);
  
  actions.showToast('✅ 已重新排序', 'success');
}

/**
 * 创建拖拽状态管理
 * @returns {Object} 拖拽状态对象
 */
export function createDragState() {
  return {
    draggedItem: null,  // 当前拖拽的物品
    dragOverItem: null, // 当前悬停的物品
    isDragging: false   // 是否正在拖拽
  };
}

/**
 * 获取拖拽样式类
 * @param {Object} item - 物品对象
 * @param {Object} state - 拖拽状态
 * @returns {Object} 样式类对象
 */
export function getDragClasses(item, state) {
  return {
    'dragging': state.draggedItem?.value?.id === item.id,
    'drag-over': state.dragOverItem?.value?.id === item.id,
    'drag-over-top': state.dragOverItem?.value?.id === item.id
  };
}

/**
 * 初始化文件树拖拽
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 */
export function initFileTreeDragDrop(state, actions) {
  console.log('[DragDrop] 文件树拖拽已初始化');
  
  return {
    handleDragStart: (e, item) => handleDragStart(e, item, state),
    handleDragEnd: (e) => handleDragEnd(e, state),
    handleDragOver: (e, item) => handleDragOver(e, item, state),
    handleDrop: (e, item) => handleDrop(e, item, state, actions)
  };
}
