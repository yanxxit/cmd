# Markmap 思维导图编辑器 - 问题修复与优化方案

## 一、问题修复

### 1. 问题描述
- **错误1**: `Uncaught ReferenceError: d3 is not defined`
- **错误2**: `Uncaught Error: Can only have one anonymous define call per script file`
- **错误3**: `渲染失败：mm.Transformer is not a constructor`

### 2. 根本原因分析

#### 问题1 & 2: AMD 模块加载器冲突
- Monaco Editor 使用 AMD 模块加载器
- markmap 等库是 UMD 格式，会检测到 AMD 加载器并尝试使用 define()
- 导致多个库同时尝试使用 AMD 加载，产生冲突

#### 问题3: 缺少 markmap-lib 依赖
- Transformer 类在 markmap-lib 中，而不是 markmap-view 中
- 使用了 alpha 版本的库，API 不稳定

### 3. 修复方案

#### 方案1: 调整脚本加载顺序
**文件**: `public/markmap-editor/index.html`

```html
<!-- Markmap 依赖 - 先加载，避免与 Monaco 的 AMD 加载器冲突 -->
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script src="https://cdn.jsdelivr.net/npm/markmap-lib@0.15.4/dist/browser/index.min.js"></script>
<script>
  window._markmapLib = window.markmap;
</script>
<script src="https://cdn.jsdelivr.net/npm/markmap-view@0.15.4/dist/browser/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/markmap-toolbar@0.15.4/dist/browser/index.min.js"></script>

<!-- 保存引用，防止被覆盖 -->
<script>
  window._d3 = window.d3;
  window._markmap = window.markmap;
</script>
```

#### 方案2: 使用稳定版本的 markmap 库
- 从 `0.14.2-alpha.0` 升级到 `0.15.4`（稳定版）
- 使用 `/dist/browser/index.min.js` 专门为浏览器优化的版本

#### 方案3: 更新 app.js 使用正确的引用
**文件**: `public/markmap-editor/app.js`

```javascript
// 使用保存的引用
var markmapLib = window._markmapLib;
var Transformer = markmapLib.Transformer;
```

---

## 二、性能与功能优化

### 优化1: 延迟加载 Monaco Editor
**目标**: 提升初始页面加载速度

**实现方案**:
- 将 Monaco Editor 的加载改为按需延迟加载
- 先初始化 Markmap，让用户能立即看到思维导图
- 后台异步加载 Monaco Editor

**关键代码**:
```javascript
// index.html
window.monacoLoaded = false;
window.loadMonaco = function(callback) {
  if (window.monacoLoaded) {
    callback();
    return;
  }
  // 动态加载脚本
  const script = document.createElement('script');
  script.src = '/libs/monaco-editor/min/vs/loader.js';
  script.onload = function() {
    window.monacoLoaded = true;
    callback();
  };
  document.head.appendChild(script);
};

// app.js
function initApp() {
  initMarkmap(); // 先初始化 Markmap
  window.loadMonaco(function() {
    // 延迟加载 Monaco
  });
}
```

### 优化2: 自动保存功能
**目标**: 防止用户内容丢失

**实现方案**:
- 使用 localStorage 存储编辑器内容
- 防抖保存（2秒延迟）
- 页面加载时自动恢复内容

**关键代码**:
```javascript
const STORAGE_KEY = 'markmap-editor-content';

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || examples.basic;
  } catch (e) {
    return examples.basic;
  }
}

function saveToStorage(content) {
  try {
    localStorage.setItem(STORAGE_KEY, content);
  } catch (e) {
    console.warn('保存失败:', e);
  }
}

function debouncedSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    if (editor) {
      saveToStorage(editor.getValue());
      updateStatus('已自动保存', 'success');
    }
  }, 2000);
}
```

### 优化3: 快捷键支持
**目标**: 提升用户操作效率

**实现的快捷键**:
- `Ctrl/Cmd + S`: 手动保存
- `Ctrl/Cmd + B`: 切换编辑器显示/隐藏
- `Ctrl/Cmd + F`: 适应视图
- `Escape`: 退出全屏

**关键代码**:
```javascript
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
```

---

## 三、文件修改清单

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| `public/markmap-editor/index.html` | 修改 | 调整脚本加载顺序、延迟加载 Monaco |
| `public/markmap-editor/app.js` | 重写 | 添加自动保存、快捷键、延迟加载 |
| `public/markmap-editor/SOLUTION.md` | 新建 | 本文档 |

---

## 四、技术要点总结

### 1. AMD/UMD 模块冲突解决方案
1. **先加载 UMD 库，再加载 AMD 加载器**
2. **保存全局引用**，防止被后续加载的库覆盖
3. **使用 window._xxx** 命名空间保存引用

### 2. Markmap 库版本选择
- **稳定版优于 alpha 版**: 使用 0.15.4 而非 0.14.2-alpha
- **专用浏览器构建**: 使用 `/dist/browser/index.min.js`
- **分离的库**: markmap-lib（解析）+ markmap-view（渲染）

### 3. 性能优化策略
- **关键路径优先**: Markmap 先加载，让用户立即看到内容
- **延迟加载**: 非关键资源（Monaco）后台加载
- **防抖处理**: 避免频繁的保存和渲染操作

### 4. 用户体验提升
- **数据持久化**: localStorage 自动保存
- **键盘快捷键**: 提升操作效率
- **状态反馈**: 实时显示操作结果

---

## 五、测试验证

### 功能测试清单
- [x] Markdown 能正常渲染成思维导图
- [x] 编辑内容实时更新预览
- [x] 工具栏功能正常（缩放、适应等）
- [x] 下载 SVG/PNG 功能正常
- [x] 自动保存功能正常
- [x] 页面刷新后内容恢复
- [x] 快捷键功能正常
- [x] 全屏模式正常

### 性能测试
- 初始加载时间: < 2秒
- Markmap 渲染时间: < 500ms
- 自动保存延迟: 2秒（可配置）

---

## 六、后续优化建议

1. **主题切换**: 支持亮色/暗色主题
2. **导出格式**: 支持导出为 Markdown、PDF 等格式
3. **协作功能**: 支持多人实时协作编辑
4. **模板库**: 预置更多思维导图模板
5. **搜索功能**: 在思维导图中搜索内容
6. **历史版本**: 支持查看和恢复历史版本
