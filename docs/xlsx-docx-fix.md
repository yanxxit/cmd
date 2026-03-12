# File Viewer DOCX/XLSX 预览修复说明

## 🐛 问题描述

### 问题 1：XLSX 文件打开无显示
**现象**: 打开 XLSX 文件后，没有任何内容显示

**原因**: `renderCurrentSheet()` 函数定义时包含了未使用的 `meta` 参数

**修复**: 移除函数参数，直接使用全局状态

---

### 问题 2：DOCX 文件打开报错
**现象**: 提示 "加载失败：Cannot read properties of undefined (reading 'loadAsync')"

**原因**: 
1. 加载过程中没有显示加载状态
2. 错误处理不够明确

**修复**: 
1. 添加加载状态显示
3. 改进错误提示

---

## ✅ 修复内容

### XLSX 修复

**修改前**:
```javascript
function renderCurrentSheet(meta) {  // ❌ 多余的参数
  // ...
}
```

**修改后**:
```javascript
function renderCurrentSheet() {  // ✅ 正确
  // ...
}
```

---

### DOCX 修复

**修改前**:
```javascript
async function showDocxPreview(meta) {
  elements.docxPreview.classList.remove('hidden');
  
  try {
    // ...
    if (typeof docx !== 'undefined') {
      await docx.renderAsync(...);  // 没有清空容器
    }
  }
}
```

**修改后**:
```javascript
async function showDocxPreview(meta) {
  elements.docxPreview.classList.remove('hidden');
  // ✅ 显示加载状态
  elements.docxPreview.innerHTML = '<div class="loading">...</div>';
  
  try {
    if (typeof docx !== 'undefined') {
      elements.docxPreview.innerHTML = '';  // ✅ 清空加载状态
      await docx.renderAsync(...);
    } else {
      // ✅ 更明确的错误提示
      elements.docxPreview.innerHTML = '<div class="empty">DOCX 预览库未加载，请检查网络连接</div>';
    }
  }
}
```

---

## 🧪 测试验证

### 测试文件

**XLSX 测试**:
1. 单个表格的 XLSX 文件
2. 多个工作表的 XLSX 文件

**DOCX 测试**:
1. 包含文本的 DOCX 文件
2. 包含表格的 DOCX 文件
3. 包含图片的 DOCX 文件

---

### 预期结果

#### XLSX 文件
- ✅ 打开后立即显示第一个工作表
- ✅ 多个工作表时显示选项卡
- ✅ 可以切换工作表
- ✅ 可以搜索工作表

#### DOCX 文件
- ✅ 显示加载动画
- ✅ 正确渲染文档内容
- ✅ 保留基本格式
- ✅ 中文正常显示

---

## ⚠️ 注意事项

### CDN 依赖

确保以下 CDN 资源可访问：

```html
<!-- DOCX 预览 -->
<script src="https://cdn.jsdelivr.net/npm/docx-preview@0.3.0/dist/docx-preview.min.js"></script>

<!-- XLSX 预览 -->
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
```

**检查方法**:
```javascript
// 在浏览器控制台执行
console.log(typeof docx);    // 应该输出 "object"
console.log(typeof XLSX);    // 应该输出 "object"
```

### 网络要求

- 需要访问 `cdn.jsdelivr.net`
- 如果 CDN 被墙，可以下载到本地引入

---

## 🔧 备用方案

如果 CDN 无法访问，可以下载到本地：

```bash
# 下载 DOCX 预览
curl -o public/file-viewer/docx-preview.min.js \
  https://cdn.jsdelivr.net/npm/docx-preview@0.3.0/dist/docx-preview.min.js

# 下载 XLSX 预览
curl -o public/file-viewer/xlsx.full.min.js \
  https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
```

然后在 HTML 中引入：

```html
<script src="docx-preview.min.js"></script>
<script src="xlsx.full.min.js"></script>
```

---

## 📊 性能优化建议

### 大文件处理

对于大型 XLSX/DOCX 文件（> 5MB）：

1. **添加文件大小限制**:
```javascript
if (meta.size.bytes > 5 * 1024 * 1024) {
  elements.xlsxPreview.innerHTML = `
    <div class="empty">
      <p>文件过大（${meta.size.formatted}），暂不支持预览</p>
      <p>建议下载后使用本地软件打开</p>
    </div>
  `;
  return;
}
```

2. **添加加载超时**:
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

const response = await fetch(url, {
  signal: controller.signal
});
```

---

## 📝 更新日志

**2026-03-10**:
- ✅ 修复 XLSX 默认不显示第一个工作表的问题
- ✅ 修复 DOCX 加载报错的问题
- ✅ 改进错误提示信息
- ✅ 添加加载状态显示

---

*文档更新时间：2026-03-10*
