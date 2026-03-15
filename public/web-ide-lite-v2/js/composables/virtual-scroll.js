/**
 * Web IDE Lite v2 - 虚拟滚动功能
 * 
 * 功能：
 * 1. 大文件列表性能优化
 * 2. 只渲染可见区域
 * 3. 滚动位置保持
 * 4. 动态高度支持
 */

/**
 * 计算虚拟滚动参数
 * @param {Array} items - 所有项目
 * @param {number} containerHeight - 容器高度
 * @param {number} itemHeight - 单项高度
 * @returns {Object} 虚拟滚动参数
 */
export function calculateVirtualScroll(items, containerHeight, itemHeight = 32) {
  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // 多渲染 2 个作为缓冲
  
  return {
    totalHeight,
    visibleCount,
    itemHeight
  };
}

/**
 * 获取可见区域的项目
 * @param {Array} items - 所有项目
 * @param {number} scrollTop - 滚动位置
 * @param {number} containerHeight - 容器高度
 * @param {number} itemHeight - 单项高度
 * @returns {Object} 可见区域信息
 */
export function getVisibleItems(items, scrollTop, containerHeight, itemHeight = 32) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    startIndex,
    endIndex,
    offsetY,
    total: items.length
  };
}

/**
 * 创建虚拟滚动状态管理
 * @returns {Object} 状态对象
 */
export function createVirtualScrollState() {
  return {
    items: [],
    scrollTop: 0,
    containerHeight: 0,
    itemHeight: 32,
    bufferSize: 5
  };
}

/**
 * 处理滚动事件
 * @param {Event} e - 滚动事件
 * @param {Object} state - 虚拟滚动状态
 */
export function handleScroll(e, state) {
  state.scrollTop = e.target.scrollTop;
  state.containerHeight = e.target.clientHeight;
}

/**
 * 滚动到指定项目
 * @param {HTMLElement} container - 滚动容器
 * @param {number} index - 项目索引
 * @param {number} itemHeight - 单项高度
 */
export function scrollToItem(container, index, itemHeight = 32) {
  if (!container) return;
  
  const targetScroll = index * itemHeight;
  container.scrollTo({
    top: targetScroll,
    behavior: 'smooth'
  });
}

/**
 * 滚动到顶部
 * @param {HTMLElement} container - 滚动容器
 */
export function scrollToTop(container) {
  if (!container) return;
  container.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 滚动到底部
 * @param {HTMLElement} container - 滚动容器
 * @param {number} totalHeight - 总高度
 */
export function scrollToBottom(container, totalHeight) {
  if (!container) return;
  container.scrollTo({
    top: totalHeight,
    behavior: 'smooth'
  });
}

/**
 * 分组虚拟滚动（用于文件夹结构）
 * @param {Array} items - 所有项目
 * @param {Array} groups - 分组信息
 * @param {number} scrollTop - 滚动位置
 * @param {number} containerHeight - 容器高度
 * @returns {Object} 分组可见区域信息
 */
export function getGroupedVisibleItems(items, groups, scrollTop, containerHeight, itemHeight = 32) {
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  
  // 找出可见区域内的分组
  const visibleGroups = [];
  let currentIndex = 0;
  
  for (const group of groups) {
    const groupStart = currentIndex;
    const groupEnd = currentIndex + group.items.length;
    
    // 检查分组是否与可见区域有交集
    if (groupEnd >= startIndex && groupStart < endIndex) {
      visibleGroups.push({
        ...group,
        visibleItems: group.items.filter((_, i) => {
          const itemIndex = groupStart + i;
          return itemIndex >= startIndex && itemIndex < endIndex;
        }),
        offsetY: Math.max(0, (groupStart - startIndex) * itemHeight)
      });
    }
    
    currentIndex = groupEnd;
  }
  
  return {
    visibleGroups,
    startIndex,
    endIndex,
    total: items.length
  };
}

/**
 * 优化：使用 Intersection Observer 实现懒加载
 * @param {HTMLElement} container - 容器元素
 * @param {Function} callback - 加载回调
 * @returns {IntersectionObserver} observer 实例
 */
export function createLazyLoader(container, callback) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = parseInt(entry.target.dataset.index);
        callback(index);
      }
    });
  }, {
    root: container,
    rootMargin: '100px',
    threshold: 0
  });
  
  return observer;
}
