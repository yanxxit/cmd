/**
 * Markmap 思维导图编辑器 - 主应用
 * 参考：/markmap-editor/markmap.html
 */

var editor = null;
var markmap = null;
var renderTimer = null;
var isEditorVisible = true;
var autoSaveTimer = null;
var STORAGE_KEY = 'markmap-editor-content';

// 示例内容
var examples = {
  basic: '# Markmap 思维导图编辑器\n\n## 🎯 核心功能\n- ✅ 实时预览\n- 📝 Markdown 语法支持\n- 🌈 代码高亮\n- 💾 自动保存\n- ⌨️ 快捷键支持\n- 📤 导出 SVG/PNG\n\n## 📖 使用指南\n### 快速开始\n1. 在左侧编辑 Markdown\n2. 右侧实时预览思维导图\n3. 自动保存，刷新不丢失\n\n### 快捷键\n- `Ctrl/Cmd + S` - 保存\n- `Ctrl/Cmd + B` - 切换编辑器\n- `Ctrl/Cmd + F` - 适应视图\n- `Esc` - 退出全屏\n\n## 🎨 格式示例\n### 文本格式\n- **粗体文字**\n- *斜体文字*\n- ~~删除线~~\n- `行内代码`\n\n### 代码块\n```javascript\nfunction hello() {\n  console.log(\"Hello, Markmap!\");\n}\n```\n\n### 链接\n- [Markmap 官网](https://markmap.js.org/)\n- [GitHub 仓库](https://github.com/gera2ld/markmap)\n\n## 📊 思维导图示例\n### 项目管理\n- 需求分析\n- 设计阶段\n- 开发实现\n- 测试部署\n\n### 个人成长\n- 技术学习\n- 技能提升\n- 项目实践\n- 经验总结\n',

  project: '# 项目开发计划\n\n## 需求分析\n- 需求收集\n  - 用户调研\n  - 竞品分析\n- 需求评审\n  - 内部评审\n  - 客户确认\n\n## 设计阶段\n### UI 设计\n- 首页设计\n- 列表页设计\n- 详情页设计\n### 架构设计\n- 技术选型\n- 数据库设计\n- API 设计\n\n## 开发阶段\n### 前端开发\n- 项目搭建\n- 页面开发\n- 接口联调\n### 后端开发\n- 框架搭建\n- 接口开发\n- 单元测试\n\n## 测试部署\n- 功能测试\n- 性能测试\n- 上线部署\n- 运维监控\n',

  knowledge: '# 知识图谱\n\n## 编程语言\n### JavaScript\n- 基础语法\n- ES6+ 特性\n- 异步编程\n### Python\n- 基础语法\n- 数据分析\n- 机器学习\n### Java\n- 面向对象\n- Spring 框架\n- JVM 原理\n\n## 前端技术\n### HTML/CSS\n- HTML5\n- CSS3\n- 响应式布局\n### 框架\n- Vue.js\n- React\n- Angular\n\n## 后端技术\n### 数据库\n- MySQL\n- MongoDB\n- Redis\n### 服务器\n- Node.js\n- Nginx\n- Docker\n\n## 开发工具\n- Git 版本控制\n- VS Code 编辑器\n- Webpack 打包\n'
};

// 从本地存储加载内容
function loadFromStorage() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return saved;
    }
  } catch (e) {
    console.warn('无法从本地存储加载内容:', e);
  }
  return examples.basic;
}

// 保存到本地存储
function saveToStorage(content) {
  try {
    localStorage.setItem(STORAGE_KEY, content);
  } catch (e) {
    console.warn('无法保存到本地存储:', e);
  }
}

// 防抖保存
function debouncedSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(function() {
    if (editor) {
      saveToStorage(editor.getValue());
      updateStatus('已自动保存', 'success');
    }
  }, 2000);
}

// 初始化应用
function initApp() {
  // 先初始化 Markmap（不依赖 Monaco）
  initMarkmap();
  
  // 延迟加载 Monaco Editor
  window.loadMonaco(function() {
    require(['vs/editor/editor.main'], function () {
      // 创建 Monaco 编辑器
      editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: loadFromStorage(),
        language: 'markdown',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        renderWhitespace: 'selection'
      });

      // 监听内容变化
      editor.onDidChangeModelContent(function () {
        updateCharCount();
        debouncedRender();
        debouncedSave();
      });

      // 初始渲染
      renderMarkmap();
      updateCharCount();

      console.log('✅ Markmap 编辑器已初始化');
    });
  });
}

// 初始化 Markmap (参考 markmap.html)
function initMarkmap() {
  var mm = window._markmap || window.markmap || window.mm;
  var markmapLib = window._markmapLib || window.markmap;
  
  console.log('Markmap 加载检查:', {
    'd3': !!window._d3,
    'markmap': !!mm,
    'mm': !!window.mm,
    'markmapLib': !!markmapLib,
    'markmapLibKeys': markmapLib ? Object.keys(markmapLib) : []
  });
  
  if (!mm || !mm.Markmap) {
    console.error('Markmap 未加载');
    return;
  }

  // 创建 Markmap 实例 (参考 markmap.html 的初始化方式)
  var initialData = {
    type: 'heading',
    depth: 0,
    payload: { lines: [0, 1] },
    content: 'Markmap 思维导图',
    children: [
      {
        type: 'heading',
        depth: 1,
        payload: { lines: [0, 1] },
        content: '功能特性',
        children: [
          { type: 'list_item', depth: 2, content: '实时预览' },
          { type: 'list_item', depth: 2, content: 'Markdown 语法' }
        ]
      }
    ]
  };

  markmap = mm.Markmap.create('svg#mindmap', {
    maxWidth: 0,        // 不限制最大宽度
    spacingHorizontal: 80,  // 水平间距
    spacingVertical: 10,    // 垂直间距
    duration: 500,      // 动画时长
    fitRatio: 0.95,     // 适应视图时的边距比例
    initialExpandLevel: 3, // 初始展开层级
    zoom: true,         // 启用缩放
    pan: true           // 启用平移
  }, initialData);

  // 添加工具栏 (参考 markmap.html)
  setTimeout(function () {
    if (mm.Toolbar) {
      var toolbar = new mm.Toolbar();
      toolbar.attach(markmap);
      var el = toolbar.render();
      el.setAttribute('style', 'position:absolute;bottom:20px;right:20px');
      document.querySelector('.mindmap-wrapper').appendChild(el);
    }
  }, 100);
  
  // 初始渲染后自动适应视图
  setTimeout(function() {
    fitView();
  }, 300);
}

// 防抖渲染
function debouncedRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderMarkmap, 500);
}

// 渲染 Markmap
function renderMarkmap() {
  try {
    var markdown = editor ? editor.getValue() : loadFromStorage();
    
    console.log('开始渲染 Markdown:', markdown.substring(0, 50));
    
    // 使用 markmap-lib 的 Transformer
    var markmapLib = window._markmapLib;
    if (!markmapLib) {
      throw new Error('markmap-lib 未加载');
    }
    
    // 查找 Transformer
    var Transformer = markmapLib.Transformer;
    if (!Transformer) {
      Transformer = markmapLib.default && markmapLib.default.Transformer;
    }
    
    if (!Transformer) {
      throw new Error('找不到 Transformer 构造函数，可用属性: ' + Object.keys(markmapLib).join(', '));
    }
    
    var transformer = new Transformer();
    var result = transformer.transform(markdown);
    
    // 渲染
    if (markmap) {
      markmap.setData(result.root);
      
      // 渲染完成后自动适应视图
      setTimeout(function() {
        fitView();
      }, 100);
    }
    
    updateStatus('渲染成功', 'success');
  } catch (error) {
    console.error('Markmap 渲染错误:', error);
    updateStatus('渲染失败：' + error.message, 'error');
  }
}

// 更新字符计数
function updateCharCount() {
  var code = editor ? editor.getValue() : '';
  document.getElementById('char-count').textContent = code.length + ' 字符';
}

// 更新状态
function updateStatus(message, type) {
  var status = document.getElementById('status-info');
  status.textContent = message;
  status.style.color = type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--text-secondary)';
}

// 加载示例
window.loadExample = function(type) {
  if (examples[type] && editor) {
    editor.setValue(examples[type]);
    updateStatus('已加载' + type + '示例', 'success');
  }
};

// 格式化代码
window.formatCode = function() {
  if (editor) {
    editor.getAction('editor.action.formatDocument').run();
    updateStatus('代码已格式化', 'success');
  }
};

// 清空编辑器
window.clearEditor = function() {
  if (editor && confirm('确定要清空编辑器吗？')) {
    editor.setValue('');
    updateStatus('编辑器已清空', 'success');
  }
};

// 切换编辑器显示
window.toggleEditor = function() {
  var editorPane = document.getElementById('editor-pane');
  isEditorVisible = !isEditorVisible;
  
  if (isEditorVisible) {
    editorPane.classList.remove('hidden');
    setTimeout(function () {
      if (editor) editor.layout();
      renderMarkmap();
    }, 100);
  } else {
    editorPane.classList.add('hidden');
    setTimeout(function () {
      renderMarkmap();
    }, 100);
  }
  
  updateStatus(isEditorVisible ? '编辑器已显示' : '编辑器已隐藏', 'info');
};

// 缩放控制
window.zoomIn = function() {
  if (markmap) {
    var state = markmap.state;
    var newZoom = (state.zoom || 1) + 0.2;
    markmap.setOptions({ zoom: Math.min(newZoom, 5) });
    updateStatus('已放大 (' + Math.round(newZoom * 100) + '%)', 'success');
  }
};

window.zoomOut = function() {
  if (markmap) {
    var state = markmap.state;
    var newZoom = (state.zoom || 1) - 0.2;
    markmap.setOptions({ zoom: Math.max(newZoom, 0.1) });
    updateStatus('已缩小 (' + Math.round(newZoom * 100) + '%)', 'success');
  }
};

window.resetZoom = function() {
  if (markmap) {
    markmap.setOptions({ zoom: 1 });
    updateStatus('已重置缩放 (100%)', 'success');
  }
};

// 适应视图 - 自动调整到最佳显示比例
window.fitView = function() {
  if (markmap) {
    markmap.fit();
    updateStatus('已适应视图', 'success');
  }
};

// 全屏切换
window.toggleFullscreen = function() {
  var container = document.getElementById('app');
  
  if (!document.fullscreenElement) {
    container.requestFullscreen().then(function () {
      updateStatus('已进入全屏', 'success');
      setTimeout(function () {
        if (editor) editor.layout();
        renderMarkmap();
      }, 300);
    }).catch(function (err) {
      updateStatus('全屏失败：' + err.message, 'error');
    });
  } else {
    document.exitFullscreen().then(function () {
      updateStatus('已退出全屏', 'success');
    });
  }
};

// 下载 SVG
window.downloadSVG = function() {
  var svg = document.querySelector('#mindmap svg');
  
  if (!svg) {
    // 尝试直接获取 #mindmap
    svg = document.getElementById('mindmap');
    if (!svg || svg.tagName !== 'svg') {
      alert('没有可下载的图表，请先生成思维导图');
      return;
    }
  }

  // 克隆 SVG 并修复样式
  var svgClone = svg.cloneNode(true);
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // 获取 SVG 数据
  var svgData = new XMLSerializer().serializeToString(svgClone);
  var blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  
  var a = document.createElement('a');
  a.href = url;
  a.download = 'markmap-' + Date.now() + '.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
  updateStatus('SVG 已下载', 'success');
};

// 下载 PNG
window.downloadPNG = function() {
  var svg = document.querySelector('#mindmap svg');
  
  if (!svg) {
    svg = document.getElementById('mindmap');
    if (!svg || svg.tagName !== 'svg') {
      alert('没有可下载的图表，请先生成思维导图');
      return;
    }
  }

  // 克隆 SVG 并修复样式
  var svgClone = svg.cloneNode(true);
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // 移除 transform，确保完整显示
  svgClone.removeAttribute('transform');
  svgClone.setAttribute('width', '100%');
  svgClone.setAttribute('height', '100%');
  
  // 获取完整的边界
  var bbox = svg.getBBox();
  
  // 如果没有有效的 bbox，使用 viewBox
  if (!bbox || bbox.width === 0 || bbox.height === 0) {
    var viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      var parts = viewBox.split(' ');
      bbox = {
        x: parseFloat(parts[0]),
        y: parseFloat(parts[1]),
        width: parseFloat(parts[2]),
        height: parseFloat(parts[3])
      };
    } else {
      bbox = {
        x: 0,
        y: 0,
        width: parseFloat(svg.getAttribute('width')) || 800,
        height: parseFloat(svg.getAttribute('height')) || 600
      };
    }
  }
  
  // 添加边距（确保内容不被裁剪）
  var padding = 20;
  var contentWidth = bbox.width + padding * 2;
  var contentHeight = bbox.height + padding * 2;
  
  // 设置画布大小（2x 分辨率）
  var canvas = document.createElement('canvas');
  canvas.width = contentWidth * 2;
  canvas.height = contentHeight * 2;
  
  var ctx = canvas.getContext('2d');
  
  // 绘制白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 获取 SVG 数据
  var svgData = new XMLSerializer().serializeToString(svgClone);
  
  var img = new Image();
  img.onload = function () {
    // 绘制图片（保持原始比例，2x 缩放）
    ctx.drawImage(
      img,
      bbox.x - padding,
      bbox.y - padding,
      contentWidth,
      contentHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    // 下载
    canvas.toBlob(function (blob) {
      if (!blob) {
        alert('PNG 导出失败，请尝试 SVG 格式');
        return;
      }
      
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'markmap-' + Date.now() + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      updateStatus('PNG 已下载', 'success');
    }, 'image/png');
  };
  
  img.onerror = function() {
    alert('PNG 导出失败，请尝试 SVG 格式');
  };
  
  // 将 SVG 转换为 base64
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
};

// 快捷键支持
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + S - 保存
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (editor) {
      saveToStorage(editor.getValue());
      updateStatus('已手动保存', 'success');
    }
  }
  
  // Ctrl/Cmd + B - 切换编辑器
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    window.toggleEditor();
  }
  
  // Ctrl/Cmd + F - 适应视图
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    window.fitView();
  }
  
  // Escape - 退出全屏
  if (e.key === 'Escape' && document.fullscreenElement) {
    document.exitFullscreen();
  }
});

// 启动应用
initApp();

// 阻止 Vimium 等浏览器扩展的键盘快捷键
document.addEventListener('keydown', function(e) {
  // 如果焦点在编辑器或输入框中，不拦截
  if (document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.isContentEditable) {
    return;
  }

  // Vimium 特定快捷键（只拦截这些）
  var vimiumKeys = [
    'j', 'k', 'h', 'l',  // 滚动
    'f', 'F',            // 链接跟随
    'v', 'V',            // 可视模式
    'p', 'P',            // 粘贴搜索
    'r',                 // 刷新
    'n', 'N',            // 搜索导航
    'x',                 // 关闭标签
    'o', 'O',            // 打开链接
    'i', 'I',            // 插入模式
    '/', '?',            // 搜索
    'g', 'G'             // g 开头组合键
  ];
  
  // 只拦截 Vimium 特定按键
  if (vimiumKeys.indexOf(e.key) !== -1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.stopPropagation();
  }
  
  // 拦截 g 开头的组合键 (g0, g$, gg, gT, gt 等)
  if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.stopPropagation();
  }
}, true);
