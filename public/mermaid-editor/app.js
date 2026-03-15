/**
 * Mermaid 编辑器 - 主应用
 */

let editor = null;
let currentZoom = 1;
let renderTimer = null;

// 示例代码
const examples = {
  flowchart: `graph TD
    A[开始] --> B{是否成功？}
    B -->|是 | C[结束]
    B -->|否 | D[重试]
    D --> B
    
    style A fill:#10b981,color:#fff
    style C fill:#10b981,color:#fff
    style D fill:#f59e0b,color:#fff`,

  sequence: `sequenceDiagram
    autonumber
    participant U as 用户
    participant F as 前端
    participant S as 服务器
    
    U->>F: 输入内容
    F->>S: 发送请求
    S-->>F: 返回结果
    F->>U: 显示结果
    
    Note over F,S: HTTPS 加密传输`,

  class: `classDiagram
    class Animal {
      +String name
      +int age
      +eat()
      +sleep()
    }
    
    class Dog {
      +bark()
    }
    
    class Cat {
      +meow()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat`,

  gantt: `gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    
    section 需求分析
    需求收集     :a1, 2024-01-01, 7d
    需求评审     :after a1, 3d
    
    section 设计
    架构设计     :2024-01-11, 5d
    接口设计     :2024-01-16, 5d
    
    section 开发
    前端开发     :2024-01-21, 14d
    后端开发     :2024-01-21, 14d
    
    section 部署
    上线部署     :2024-02-11, 3d`,

  pie: `pie title 项目时间分配
    "开发" : 40
    "测试" : 25
    "会议" : 15
    "文档" : 10
    "其他" : 10`,

  er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
    
    CUSTOMER {
      string name
      string email
      string phone
    }
    
    ORDER {
      int id
      string status
      float total
    }
    
    LINE-ITEM {
      int productId
      int quantity
      float price
    }`,

  journey: `journey title 用户购物流程
    section 浏览商品
      搜索商品：5: 用户
      查看列表：4: 用户
      筛选排序：3: 用户
    section 购买商品
      加入购物车：5: 用户
      填写地址：4: 用户
      支付订单：5: 用户，系统
    section 收货评价
      等待发货：3: 用户
      确认收货：5: 用户
      评价商品：4: 用户`
};

// 初始化应用
function initApp() {
  require(['vs/editor/editor.main'], function () {
    // 创建 Monaco 编辑器
    editor = monaco.editor.create(document.getElementById('editor-container'), {
      value: examples.flowchart,
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
    editor.onDidChangeModelContent(() => {
      updateCharCount();
      debouncedRender();
    });

    // 初始渲染
    renderMermaid();
    updateCharCount();

    console.log('✅ Mermaid 编辑器已初始化');
  });
}

// 防抖渲染
function debouncedRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderMermaid, 500);
}

// 渲染 Mermaid 图表
async function renderMermaid() {
  const code = editor.getValue();
  const output = document.getElementById('mermaid-output');
  const errorContainer = document.getElementById('error-container');
  const errorMessage = document.getElementById('error-message');

  if (!code.trim()) {
    output.innerHTML = '';
    errorContainer.style.display = 'none';
    return;
  }

  try {
    // 清空输出
    output.innerHTML = '<div class="loading"></div>';
    errorContainer.style.display = 'none';

    // 生成唯一 ID
    const id = 'mermaid-' + Date.now();
    
    // 使用 mermaid.render 渲染
    const { svg } = await window.mermaid.render(id, code);
    output.innerHTML = svg;
    
    // 移除 loading 状态后应用缩放
    setTimeout(() => {
      applyZoom();
    }, 100);

    updateStatus('渲染成功', 'success');
  } catch (error) {
    output.innerHTML = '';
    errorMessage.textContent = error.message || '语法错误，请检查代码';
    errorContainer.style.display = 'block';
    updateStatus('渲染失败', 'error');
    console.error('Mermaid 渲染错误:', error);
  }
}

// 更新字符计数
function updateCharCount() {
  const code = editor.getValue();
  document.getElementById('char-count').textContent = `${code.length} 字符`;
}

// 更新状态
function updateStatus(message, type) {
  const status = document.getElementById('status-info');
  status.textContent = message;
  status.style.color = type === 'success' ? 'var(--success-color)' : 'var(--error-color)';
}

// 加载示例
function loadExample(type) {
  if (examples[type]) {
    editor.setValue(examples[type]);
    updateStatus(`已加载${type}示例`, 'success');
  }
}

// 格式化代码
function formatCode() {
  editor.getAction('editor.action.formatDocument').run();
  updateStatus('代码已格式化', 'success');
}

// 清空编辑器
function clearEditor() {
  if (confirm('确定要清空编辑器吗？')) {
    editor.setValue('');
    updateStatus('编辑器已清空', 'success');
  }
}

// 缩放控制
function zoomIn() {
  currentZoom = Math.min(currentZoom + 0.1, 3);
  applyZoom();
}

function zoomOut() {
  currentZoom = Math.max(currentZoom - 0.1, 0.3);
  applyZoom();
}

function resetZoom() {
  currentZoom = 1;
  applyZoom();
}

function applyZoom() {
  const output = document.getElementById('mermaid-output');
  const svg = output.querySelector('svg');
  if (svg) {
    svg.style.transform = `scale(${currentZoom})`;
    svg.style.transformOrigin = 'center center';
  }
}

// 下载 SVG
function downloadSVG() {
  const output = document.getElementById('mermaid-output');
  const svg = output.querySelector('svg');
  
  if (!svg) {
    alert('没有可下载的图表');
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `mermaid-${Date.now()}.svg`;
  a.click();
  
  URL.revokeObjectURL(url);
  updateStatus('SVG 已下载', 'success');
}

// 下载 PNG
function downloadPNG() {
  const output = document.getElementById('mermaid-output');
  const svg = output.querySelector('svg');
  
  if (!svg) {
    alert('没有可下载的图表');
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const img = new Image();
  img.onload = () => {
    // 设置画布大小
    const bbox = svg.getBBox();
    canvas.width = bbox.width * 2;
    canvas.height = bbox.height * 2;
    
    // 绘制白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制图片
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    
    // 下载
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mermaid-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      updateStatus('PNG 已下载', 'success');
    });
  };
  
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

// 切换主题
function changeTheme() {
  const selector = document.getElementById('theme-selector');
  const newTheme = selector.value;
  
  // 保存到 localStorage
  localStorage.setItem('mermaid-theme', newTheme);
  window.currentTheme = newTheme;
  
  // 使用新的配置重新初始化
  if (window.getMermaidConfig) {
    window.mermaid.initialize(window.getMermaidConfig(newTheme));
  } else {
    // 兼容旧版本
    window.mermaid.initialize({
      startOnLoad: false,
      theme: newTheme,
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
      sequence: { useMaxWidth: true, mirrorActors: true },
      pie: { useMaxWidth: true, textPosition: 0.5 },
      er: { useMaxWidth: true },
      journey: { useMaxWidth: true }
    });
  }
  
  // 重新渲染
  renderMermaid();
  
  updateStatus(`已切换到${getThemeName(newTheme)}主题`, 'success');
}

// 获取主题名称
function getThemeName(theme) {
  const names = {
    'default': '默认',
    'forest': '森林',
    'dark': '深色',
    'neutral': '中性',
    'base': '基础'
  };
  return names[theme] || theme;
}

// 暴露到全局
window.loadExample = loadExample;
window.formatCode = formatCode;
window.clearEditor = clearEditor;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;
window.downloadSVG = downloadSVG;
window.downloadPNG = downloadPNG;
window.changeTheme = changeTheme;
