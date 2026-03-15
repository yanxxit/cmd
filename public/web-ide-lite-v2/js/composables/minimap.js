/**
 * Web IDE Lite v2 - 编辑器缩略图（Minimap）功能
 * 
 * 功能：
 * 1. 代码缩略图显示
 * 2. 可视区域指示器
 * 3. 点击跳转定位
 * 4. 拖拽滚动
 */

/**
 * 渲染缩略图
 * @param {string} content - 代码内容
 * @param {HTMLElement} container - 容器元素
 * @param {Object} options - 渲染选项
 */
export function renderMinimap(content, container, options = {}) {
  if (!container) return;
  
  const {
    charWidth = 3,
    lineHeight = 6,
    maxColumns = 200,
    showBlocks = true
  } = options;
  
  container.innerHTML = '';
  container.className = 'minimap';
  
  const lines = content.split('\n');
  const maxLineLength = Math.min(Math.max(...lines.map(l => l.length)), maxColumns);
  
  // 设置容器宽度
  container.style.width = `${maxLineLength * charWidth + 10}px`;
  
  // 创建缩略图内容
  const minimapContent = document.createElement('div');
  minimapContent.className = 'minimap-content';
  
  lines.forEach((line, index) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'minimap-line';
    lineEl.style.height = `${lineHeight}px`;
    lineEl.dataset.line = index + 1;
    
    if (showBlocks && line.trim()) {
      // 创建代码块表示
      const blocks = createMinimapBlocks(line, charWidth, maxColumns);
      blocks.forEach(block => {
        const blockEl = document.createElement('span');
        blockEl.className = `minimap-block ${block.type}`;
        blockEl.style.width = `${block.width}px`;
        blockEl.style.marginLeft = `${block.offset}px`;
        lineEl.appendChild(blockEl);
      });
    } else if (line.trim()) {
      // 简单线条表示
      const lineWidth = Math.min(line.length * charWidth, maxColumns * charWidth);
      const lineBar = document.createElement('span');
      lineBar.className = 'minimap-line-bar';
      lineBar.style.width = `${lineWidth}px`;
      lineEl.appendChild(lineBar);
    }
    
    minimapContent.appendChild(lineEl);
  });
  
  container.appendChild(minimapContent);
  
  // 添加可视区域指示器
  addViewportIndicator(container, options);
  
  // 添加点击事件
  addMinimapClickHandler(container, options);
}

/**
 * 创建缩略图代码块
 * @param {string} line - 代码行
 * @param {number} charWidth - 字符宽度
 * @param {number} maxColumns - 最大列数
 * @returns {Array} 代码块数组
 */
function createMinimapBlocks(line, charWidth, maxColumns) {
  const blocks = [];
  let currentBlock = null;
  
  for (let i = 0; i < Math.min(line.length, maxColumns); i++) {
    const char = line[i];
    const isWhitespace = /\s/.test(char);
    
    if (isWhitespace) {
      if (currentBlock && currentBlock.type === 'text') {
        blocks.push(currentBlock);
        currentBlock = null;
      }
    } else {
      if (!currentBlock) {
        currentBlock = {
          type: 'text',
          width: 0,
          offset: i * charWidth
        };
      }
      currentBlock.width += charWidth;
    }
  }
  
  if (currentBlock) {
    blocks.push(currentBlock);
  }
  
  return blocks;
}

/**
 * 添加可视区域指示器
 * @param {HTMLElement} container - 容器元素
 * @param {Object} options - 选项
 */
function addViewportIndicator(container, options) {
  const { editorRef, scrollContainer } = options;
  
  if (!scrollContainer) return;
  
  const viewport = document.createElement('div');
  viewport.className = 'minimap-viewport';
  container.appendChild(viewport);
  
  // 更新指示器位置
  const updateViewport = () => {
    const scrollTop = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;
    
    const totalLines = container.querySelectorAll('.minimap-line').length;
    const visibleRatio = clientHeight / scrollHeight;
    const scrollRatio = scrollTop / (scrollHeight - clientHeight);
    
    const viewportHeight = Math.max(30, totalLines * 6 * visibleRatio);
    const viewportTop = scrollRatio * (totalLines * 6 - viewportHeight);
    
    viewport.style.height = `${viewportHeight}px`;
    viewport.style.top = `${viewportTop}px`;
  };
  
  scrollContainer.addEventListener('scroll', updateViewport);
  window.addEventListener('resize', updateViewport);
  
  // 初始更新
  updateViewport();
  
  return updateViewport;
}

/**
 * 添加缩略图点击处理
 * @param {HTMLElement} container - 容器元素
 * @param {Object} options - 选项
 */
function addMinimapClickHandler(container, options) {
  const { scrollContainer, editorRef } = options;
  
  if (!scrollContainer) return;
  
  container.addEventListener('click', (e) => {
    const rect = container.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const totalHeight = container.scrollHeight;
    
    const scrollRatio = clickY / totalHeight;
    const targetScroll = scrollRatio * (scrollContainer.scrollHeight - scrollContainer.clientHeight);
    
    scrollContainer.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  });
  
  // 拖拽滚动
  let isDragging = false;
  let startY = 0;
  let startScroll = 0;
  
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startScroll = scrollContainer.scrollTop;
    container.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - startY;
    const scrollDelta = (deltaY / container.clientHeight) * scrollContainer.scrollHeight;
    
    scrollContainer.scrollTop = startScroll - scrollDelta;
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    container.style.cursor = 'pointer';
  });
}

/**
 * 创建缩略图状态管理
 * @returns {Object} 状态对象
 */
export function createMinimapState() {
  return {
    visible: true,
    width: 100,
    renderType: 'blocks', // 'blocks', 'lines', 'text'
    scale: 0.5
  };
}

/**
 * 更新缩略图
 * @param {string} content - 代码内容
 * @param {HTMLElement} container - 容器元素
 * @param {Object} state - 缩略图状态
 * @param {Object} editorState - 编辑器状态
 */
export function updateMinimap(content, container, state, editorState) {
  if (!state.visible) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  
  renderMinimap(content, container, {
    charWidth: 3 * state.scale,
    lineHeight: 6 * state.scale,
    showBlocks: state.renderType === 'blocks',
    editorRef: editorState.editorRef,
    scrollContainer: editorState.scrollContainer
  });
}

/**
 * 添加缩略图样式
 */
export function addMinimapStyles() {
  const styleId = 'minimap-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .minimap {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 100px;
      background: rgba(30, 30, 30, 0.5);
      overflow: hidden;
      cursor: pointer;
      user-select: none;
    }
    
    .minimap-content {
      padding: 16px 5px;
    }
    
    .minimap-line {
      display: flex;
      align-items: center;
      opacity: 0.7;
    }
    
    .minimap-line:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.1);
    }
    
    .minimap-block {
      height: 4px;
      background: #4a9eff;
      border-radius: 1px;
    }
    
    .minimap-block.string {
      background: #ce9178;
    }
    
    .minimap-block.comment {
      background: #6a9955;
    }
    
    .minimap-block.keyword {
      background: #569cd6;
    }
    
    .minimap-line-bar {
      display: block;
      height: 3px;
      background: #666;
      border-radius: 1px;
    }
    
    .minimap-viewport {
      position: absolute;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      pointer-events: none;
      transition: top 0.1s;
    }
    
    .theme-light .minimap {
      background: rgba(240, 240, 240, 0.8);
    }
    
    .theme-light .minimap-line:hover {
      background: rgba(0, 0, 0, 0.05);
    }
    
    .theme-light .minimap-viewport {
      background: rgba(0, 0, 0, 0.1);
    }
  `;
  
  document.head.appendChild(style);
}

// 自动添加样式
addMinimapStyles();
