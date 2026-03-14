# UI 设计规范与组件库

> 📅 创建时间：2026-03-13  
> 📋 基于 CSV 转换器页面的设计系统  
> 🎨 现代化、可复用的 UI 组件库

---

## 🎨 设计理念

### 核心原则

1. **现代化** - 渐变背景、毛玻璃效果、圆角设计
2. **层次感** - 多层次阴影、清晰的视觉层次
3. **流畅交互** - 平滑过渡动画、悬停效果
4. **响应式** - 适配桌面、平板、移动端
5. **无障碍** - 明暗主题、清晰的对比度

---

## 🎨 颜色系统

### 主色调

```css
/* 渐变背景 */
--bg-gradient-light: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--bg-gradient-dark: linear-gradient(135deg, #1f2937 0%, #111827 100%);

/* 强调色 */
--accent-color: #0ea5e9;
--accent-gradient: linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%);

/* 成功色 */
--success-color: #10b981;
--success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
```

### CSS 变量系统

```css
:root {
  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  
  /* 文字颜色 */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  
  /* 边框颜色 */
  --border-color: #e5e7eb;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  
  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}

[data-theme="dark"] {
  --bg-primary: #1f2937;
  --bg-secondary: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --border-color: #4b5563;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.4);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.5);
}
```

---

## 📐 布局组件

### 1. 页面容器

```css
.container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 40px 20px;
}

@media (max-width: 768px) {
  .container {
    padding: 20px 12px;
  }
}
```

**使用示例：**
```html
<div class="container">
  <!-- 页面内容 -->
</div>
```

### 2. 头部组件

```css
.header {
  text-align: center;
  margin-bottom: 32px;
  padding: 32px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.2);
}

.header h1 {
  font-size: 36px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.header p {
  color: rgba(255,255,255,0.9);
  font-size: 16px;
}
```

**使用示例：**
```html
<header class="header">
  <h1>📊 页面标题</h1>
  <p>副标题或描述文字</p>
</header>
```

### 3. 卡片组件

```css
.card {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.card:hover {
  box-shadow: 0 15px 30px rgba(0,0,0,0.15);
}
```

**使用示例：**
```html
<div class="card">
  <!-- 卡片内容 -->
</div>
```

### 4. 设置面板

```css
.settings-panel {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border: 1px solid var(--border-color);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  align-items: end;
}
```

**使用示例：**
```html
<div class="settings-panel">
  <div class="settings-grid">
    <div class="form-group">
      <label class="form-label">选项 1</label>
      <select class="form-select">...</select>
    </div>
    <div class="form-group">
      <label class="form-label">选项 2</label>
      <select class="form-select">...</select>
    </div>
  </div>
</div>
```

### 5. 分割视图

```css
.split-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1200px) {
  .split-view {
    grid-template-columns: 1fr;
  }
}
```

**使用示例：**
```html
<div class="split-view">
  <div class="card">
    <!-- 左侧内容 -->
  </div>
  <div class="card">
    <!-- 右侧内容 -->
  </div>
</div>
```

---

## 🧩 表单组件

### 1. 表单组

```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input, .form-select {
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.2s;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}
```

**使用示例：**
```html
<div class="form-group">
  <label class="form-label">标签</label>
  <input type="text" class="form-input" placeholder="请输入...">
</div>
```

### 2. 文本域

```css
.editor-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: 'Monaco', 'Consolas', monospace;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.2s;
  min-height: 400px;
}

.editor-textarea:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}
```

**使用示例：**
```html
<textarea class="editor-textarea" placeholder="请输入内容..."></textarea>
```

---

## 🔘 按钮组件

### 基础按钮

```css
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
```

### 主要按钮

```css
.btn-primary {
  background: linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(14, 165, 233, 0.4);
}
```

### 次要按钮

```css
.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--border-color);
  transform: translateY(-1px);
}
```

### 成功按钮

```css
.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
}
```

### 按钮组

```css
.btn-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .btn-group {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
```

**使用示例：**
```html
<div class="btn-group">
  <button class="btn btn-primary">✅ 主要操作</button>
  <button class="btn btn-secondary">📝 次要操作</button>
  <button class="btn btn-success">💾 成功操作</button>
</div>
```

---

## 📑 选项卡组件

```css
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  background: var(--bg-secondary);
  padding: 4px;
  border-radius: 8px;
}

.tab {
  flex: 1;
  padding: 10px 20px;
  text-align: center;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  color: var(--text-secondary);
  border-radius: 6px;
  transition: all 0.2s;
  border: none;
  background: transparent;
}

.tab:hover {
  background: rgba(14, 165, 233, 0.1);
  color: #0ea5e9;
}

.tab.active {
  background: linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);
}
```

**使用示例：**
```html
<div class="tabs">
  <button class="tab active">选项 1</button>
  <button class="tab">选项 2</button>
  <button class="tab">选项 3</button>
</div>
```

---

## 📊 输出组件

### 输出框

```css
.output-box {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 450px;
  overflow-y: auto;
  line-height: 1.6;
}
```

**使用示例：**
```html
<div class="output-box">输出内容...</div>
```

### 表格预览

```css
.preview-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.preview-table th, .preview-table td {
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  text-align: left;
}

.preview-table th {
  background: linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%);
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.preview-table tr:nth-child(even) {
  background: var(--bg-secondary);
}

.preview-table tr:hover {
  background: rgba(14, 165, 233, 0.1);
}
```

**使用示例：**
```html
<div class="preview-container">
  <table class="preview-table">
    <thead>
      <tr>
        <th>列 1</th>
        <th>列 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>数据 1</td>
        <td>数据 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 📈 统计组件

### 统计栏

```css
.stats-bar {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-value {
  font-weight: 700;
  color: #0ea5e9;
}
```

**使用示例：**
```html
<div class="stats-bar">
  <div class="stat-item">
    <span>📊</span>
    <span class="stat-value">100</span>
    <span>行</span>
  </div>
  <div class="stat-item">
    <span>📏</span>
    <span class="stat-value">10</span>
    <span>列</span>
  </div>
</div>
```

---

## 🔔 提示组件

### Toast 提示

```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 10px 15px rgba(0,0,0,0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease;
  font-weight: 500;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

**Vue 使用示例：**
```javascript
const toast = ref({ show: false, message: '' });

const showToast = (message) => {
  toast.value = { show: true, message };
  setTimeout(() => {
    toast.value.show = false;
  }, 2000);
};
```

```html
<div v-if="toast.show" class="toast" v-text="toast.message"></div>
```

---

## 🎛️ 主题切换

```css
.theme-toggle {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  z-index: 100;
}

.theme-toggle:hover {
  transform: scale(1.1) rotate(15deg);
  box-shadow: 0 10px 15px rgba(0,0,0,0.15);
}
```

**Vue 使用示例：**
```javascript
const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  isDark.value = savedTheme === 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
});
```

```html
<button class="theme-toggle" @click="toggleTheme">
  {{ isDark ? '☀️' : '🌙' }}
</button>
```

---

## 📝 编辑器头部

```css
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.editor-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
```

**使用示例：**
```html
<div class="editor-header">
  <h3 class="editor-title">
    <span>📝</span> 标题
  </h3>
  <div class="btn-group">
    <button class="btn btn-secondary btn-sm">操作 1</button>
    <button class="btn btn-success btn-sm">操作 2</button>
  </div>
</div>
```

---

## 🎯 空状态

```css
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-muted);
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}
```

**使用示例：**
```html
<div class="empty-state">
  <div class="empty-state-icon">📊</div>
  <p>暂无数据</p>
  <p style="font-size: 13px; margin-top: 8px;">操作提示文字</p>
</div>
```

---

## 📱 响应式断点

```css
/* 移动端 */
@media (max-width: 768px) {
  .container { padding: 20px 12px; }
  .header { padding: 24px 16px; }
  .header h1 { font-size: 28px; }
  .card { padding: 16px; }
  .settings-grid { grid-template-columns: 1fr; }
  .btn-group { flex-direction: column; }
  .btn { width: 100%; justify-content: center; }
}

/* 平板端 */
@media (min-width: 769px) and (max-width: 1200px) {
  /* 平板特定样式 */
}

/* 桌面端 */
@media (min-width: 1201px) {
  .split-view { grid-template-columns: 1fr 1fr; }
}
```

---

## 🎨 滚动条美化

```css
.output-box::-webkit-scrollbar {
  width: 8px;
}

.output-box::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

.output-box::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.output-box::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
```

---

## 📋 使用清单

### 新项目启动

- [ ] 复制 CSS 变量系统
- [ ] 添加主题切换功能
- [ ] 设置页面容器
- [ ] 添加头部组件
- [ ] 配置响应式断点

### 页面组件

- [ ] 卡片容器
- [ ] 设置面板（如需要）
- [ ] 分割视图（如需要）
- [ ] 表单组件
- [ ] 按钮组
- [ ] 输出区域

### 交互功能

- [ ] Toast 提示
- [ ] 主题切换
- [ ] 数据绑定
- [ ] 文件上传
- [ ] 复制功能
- [ ] 下载功能

---

## 🔗 相关资源

- [CSV 转换器示例](/csv-table-converter/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Vue 3 文档](https://vuejs.org/)

---

*本设计规范基于 CSV 转换器页面整理，可在后续开发中复用。*
