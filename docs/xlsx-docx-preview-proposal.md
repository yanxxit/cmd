# File Viewer XLSX/DOCX 文件预览支持方案评估

## 📋 概述

本文档评估在 file-viewer 项目中添加 XLSX (Excel) 和 DOCX (Word) 文件预览功能的可行方案。

**评估日期**: 2026-03-10

---

## 🎯 需求分析

### 支持的文件格式
| 格式 | 扩展名 | 说明 |
|------|--------|------|
| Excel | .xlsx, .xls | 微软电子表格 |
| Word | .docx, .doc | 微软文档 |

### 核心需求
- ✅ 纯前端解析（无需后端转换）
- ✅ 保持现有项目架构（Express + 原生 JS）
- ✅ 包体积尽可能小
- ✅ 渲染速度快
- ✅ 还原度高

---

## 💡 方案对比

### 方案一：纯前端方案（推荐 ⭐⭐⭐⭐⭐）

#### 1.1 DOCX 预览

| 库名 | 包大小 | 优点 | 缺点 |
|------|--------|------|------|
| **docx-preview** | ~200KB (gzipped) | 还原度高，支持样式 | 不支持 .doc |
| **mammoth** | ~50KB (gzipped) | 轻量，语义化 HTML | 样式丢失，只提取内容 |
| **@vue-office/docx** | 1.2MB | 一站式方案，支持多种格式 | 体积大，依赖 Vue |

**推荐**: `docx-preview`
- 还原度高，适合文档预览
- 包体积小
- 纯前端，无需后端

#### 1.2 XLSX 预览

| 库名 | 包大小 | 优点 | 缺点 |
|------|--------|------|------|
| **SheetJS (xlsx)** | ~800KB (全量) | 功能强大，支持编辑 | 体积大 |
| **SheetJS CE** | ~200KB (gzipped) | 社区版免费，够用 | 功能受限 |
| **handsontable** | ~500KB | 支持交互式表格 | 体积大 |

**推荐**: `SheetJS CE (community edition)`
- 社区版免费（Apache-2.0）
- 支持读取和渲染
- 体积可接受

#### 1.3 总体评估

```
依赖包:
├── docx-preview        ~200KB
├── xlsx (SheetJS CE)   ~200KB
├── 总计               ~400KB (gzipped)

磁盘占用:
├── node_modules       ~5MB (包含依赖)
└── 构建后           ~400KB

性能:
├── DOCX 渲染时间     < 500ms (1MB 文件)
├── XLSX 渲染时间     < 300ms (1MB 文件)
└── 内存占用         < 50MB
```

---

### 方案二：后端转换方案（⚠️ 不推荐）

#### 2.1 LibreOffice 转换

```bash
libreoffice --headless --convert-to html file.docx
```

**优点**:
- 支持格式最全（.doc, .docx, .xls, .xlsx）
- 还原度高

**缺点**:
- ❌ 需要安装 LibreOffice（~300MB）
- ❌ 后端依赖重
- ❌ 转换速度慢
- ❌ 服务器资源占用高

#### 2.2 OnlyOffice / Collabora

**优点**:
- 企业级解决方案
- 支持在线编辑

**缺点**:
- ❌ 需要独立服务
- ❌ 部署复杂
- ❌ 资源占用巨大

---

### 方案三：第三方服务（⚠️ 不推荐）

#### 3.1 Microsoft Office Online

```
https://view.officeapps.live.com/op/view.aspx?src=<文件 URL>
```

**优点**:
- 无需实现
- 支持格式全

**缺点**:
- ❌ 需要公网访问
- ❌ 数据隐私问题
- ❌ 依赖微软服务

#### 3.2 Google Docs Viewer

**优点**:
- 简单易用

**缺点**:
- ❌ 已停止服务
- ❌ 需要公网访问

---

## 📊 成本分析

### 方案一（纯前端）成本

| 项目 | 成本 |
|------|------|
| **包体积** | ~400KB (gzipped) |
| **磁盘占用** | ~5MB (node_modules) |
| **性能影响** | 可忽略（按需加载） |
| **开发成本** | 1-2 小时 |
| **维护成本** | 低 |

### 方案二（LibreOffice）成本

| 项目 | 成本 |
|------|------|
| **安装体积** | ~300MB |
| **服务器资源** | 高（CPU/内存） |
| **转换延迟** | 2-5 秒/文件 |
| **开发成本** | 4-8 小时 |
| **维护成本** | 高 |

### 方案三（第三方服务）成本

| 项目 | 成本 |
|------|------|
| **包体积** | 0 |
| **隐私风险** | 高 |
| **可用性** | 依赖第三方 |
| **开发成本** | 0.5 小时 |
| **维护成本** | 中 |

---

## 🎯 推荐方案

### 最佳方案：纯前端（方案一）

**选择理由**:
1. ✅ 包体积小（~400KB）
2. ✅ 纯前端，无需后端依赖
3. ✅ 响应速度快
4. ✅ 数据隐私安全
5. ✅ 易于维护和升级

**实施方案**:

```javascript
// 1. 安装依赖
npm install docx-preview xlsx

// 2. 在 index.html 中引入
<script src="https://cdn.jsdelivr.net/npm/docx-preview/dist/docx-preview.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>

// 3. 在 app.js 中添加预览函数
async function viewDocxFile(item) {
  const response = await fetch(`/api/file/content?path=${encodeURIComponent(item.path)}`);
  const blob = await response.blob();
  
  const container = document.getElementById('docxContainer');
  await docx.renderAsync(blob, container);
}

async function viewXlsxFile(item) {
  const response = await await fetch(`/api/file/content?path=${encodeURIComponent(item.path)}`);
  const arrayBuffer = await response.arrayBuffer();
  
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const html = XLSX.utils.sheet_to_html(workbook.Sheets[workbook.SheetNames[0]]);
  
  document.getElementById('xlsxContainer').innerHTML = html;
}
```

---

## 📦 依赖详情

### docx-preview

```json
{
  "name": "docx-preview",
  "version": "0.3.0",
  "size": "200KB (gzipped)",
  "license": "MIT",
  "dependencies": ["jszip"],
  "features": [
    "DOCX 文档渲染",
    "样式保留",
    "表格支持",
    "图片支持"
  ],
  "limitations": [
    "不支持 .doc 格式",
    "复杂布局可能失真"
  ]
}
```

### SheetJS (xlsx)

```json
{
  "name": "xlsx",
  "version": "0.18.5",
  "size": "200KB (gzipped, CE)",
  "license": "Apache-2.0",
  "dependencies": [],
  "features": [
    "XLSX/XLS 读取",
    "CSV 导出",
    "JSON 转换",
    "HTML 表格渲染"
  ],
  "limitations": [
    "社区版不支持样式",
    "不支持图表"
  ]
}
```

---

## 🚀 实施步骤

### 步骤 1: 安装依赖

```bash
npm install docx-preview xlsx
```

### 步骤 2: 添加 CDN（可选，减少包体积）

```html
<!-- 在 index.html 中添加 -->
<script src="https://cdn.jsdelivr.net/npm/docx-preview@0.3.0/dist/docx-preview.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
```

### 步骤 3: 修改后端 API

```javascript
// 在 file-viewer.js 中添加
router.get('/file/binary', async (req, res) => {
  // 返回二进制文件（用于 DOCX/XLSX 解析）
  const stream = fs.createReadStream(safePathResult);
  res.setHeader('Content-Type', 'application/octet-stream');
  stream.pipe(res);
});
```

### 步骤 4: 添加前端预览函数

```javascript
// 在 app.js 中添加
async function viewDocxFile(item) {
  const response = await fetch(`/api/file/binary?path=${encodeURIComponent(item.path)}`);
  const blob = await response.blob();
  
  const container = document.createElement('div');
  container.className = 'docx-container';
  elements.fileContent.appendChild(container);
  
  await docx.renderAsync(blob, container, null, {
    className: 'docx-rendered',
    inWrapper: false
  });
}

async function viewXlsxFile(item) {
  const response = await fetch(`/api/file/binary?path=${encodeURIComponent(item.path)}`);
  const arrayBuffer = await response.arrayBuffer();
  
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const html = XLSX.utils.sheet_to_html(worksheet);
  
  const container = document.createElement('div');
  container.className = 'xlsx-container';
  container.innerHTML = html;
  elements.fileContent.appendChild(container);
}
```

### 步骤 5: 添加 CSS 样式

```css
.docx-container {
  padding: 20px;
  background-color: var(--bg-primary);
  overflow: auto;
  max-height: calc(100vh - 100px);
}

.xlsx-container table {
  border-collapse: collapse;
  width: 100%;
}

.xlsx-container td,
.xlsx-container th {
  border: 1px solid var(--border-color);
  padding: 8px;
  text-align: left;
}
```

---

## 📈 性能预估

### 加载时间

| 文件大小 | DOCX 渲染 | XLSX 渲染 |
|----------|----------|----------|
| < 100KB | < 100ms | < 50ms |
| < 1MB | < 500ms | < 300ms |
| < 5MB | < 2s | < 1s |
| > 5MB | < 5s | < 3s |

### 内存占用

| 文件大小 | 内存占用 |
|----------|----------|
| < 100KB | < 10MB |
| < 1MB | < 30MB |
| < 5MB | < 80MB |
| > 5MB | < 150MB |

---

## ⚠️ 注意事项

### 1. 格式限制

- **DOCX**: 仅支持 .docx，不支持 .doc（旧版 Word）
- **XLSX**: 社区版不支持样式，仅显示数据

### 2. 大文件处理

- 建议限制文件大小 < 10MB
- 大文件可添加加载提示

### 3. 兼容性

- 现代浏览器（Chrome/Firefox/Edge/Safari）
- IE11 需要 polyfill

---

## 🎯 最终建议

### 推荐方案：纯前端（方案一）

**实施优先级**:
1. ✅ 先实施 DOCX 预览（docx-preview）
2. ✅ 再实施 XLSX 预览（SheetJS）
3. ⏸️ 后续可选：添加样式支持（付费版 SheetJS）

**预计总成本**:
- 开发时间：2-4 小时
- 包体积增加：~400KB
- 磁盘占用：~5MB

**ROI 分析**:
- 用户价值：⭐⭐⭐⭐⭐
- 实施难度：⭐⭐
- 维护成本：⭐
- 性能影响：⭐

---

*文档生成时间：2026-03-10*
