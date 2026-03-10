# 本地文件查看器 Web 页面设计方案

## 1. 项目概述

### 1.1 功能目标
创建一个简洁美观的本地文件查看器 Web 页面，支持以下功能：
- 📁 展示当前目录文件列表
- 📂 支持点击进入子目录
- 📄 查看文件内容（支持文本文件高亮显示）
- ⬇️ 下载文件
- 🔙 返回上级目录
- 🏠 默认读取当前服务启动目录
- 🔍 文件名搜索
- 💻 代码内容搜索（支持正则、全字匹配等）
- 🖼️ 图片预览
- 🎬 视频播放
- 🎵 音频播放
- 📕 PDF 预览（支持翻页、缩放）
- 📦 二进制文件元数据查看
- 📤 拖拽上传文件
- ⬆️ 点击上传文件

### 1.2 技术栈
- **后端**: Node.js + Express（基于现有项目架构）
- **前端**: 原生 HTML + CSS + JavaScript（轻量级，无需额外依赖）
- **图标**: Emoji 图标
- **代码高亮**: 自定义高亮
- **文件上传**: formidable
- **PDF 预览**: PDF.js

## 2. 系统架构

### 2.1 目录结构
```
cmd/
├── bin/
│   └── static.js              # 入口文件（已有）
├── src/
│   └── http-server/
│       ├── static.js          # 静态服务（已有）
│       └── file-viewer.js     # 文件查看器路由
├── public/
│   └── file-viewer/
│       ├── index.html         # 前端页面
│       ├── style.css          # 样式文件
│       └── app.js             # 前端逻辑
└── docs/
    └── file-viewer-design.md  # 设计文档
```

### 2.2 API 接口设计

#### 文件浏览
| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/files` | GET | 获取文件列表 | `path` (可选，相对路径) |
| `/api/file/content` | GET | 获取文件内容 | `path` (文件路径) |
| `/api/file/download` | GET | 下载文件 | `path` (文件路径) |
| `/api/file/is-binary` | GET | 判断是否为二进制文件 | `path` (文件路径) |

#### 搜索功能
| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/files/search` | GET | 搜索文件名 | `q` (关键词), `path`, `type` |
| `/api/files/search-content` | GET | 搜索代码内容 | `q`, `path`, `case`, `word`, `regex`, `limit`, `context` |

#### 媒体文件
| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/file/meta` | GET | 获取文件元数据 | `path` (文件路径) |
| `/api/file/preview` | GET | 文件预览（图片/PDF） | `path` (文件路径) |
| `/api/file/stream` | GET | 流式传输（视频/音频） | `path` (文件路径) |

#### 文件上传
| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/file/upload` | POST | 上传文件到根目录 | multipart/form-data |
| `/api/file/upload-to` | POST | 上传文件到指定目录 | `path`, multipart/form-data |
| `/api/file/create-dir` | POST | 创建新目录 | `path`, `name` |

### 2.3 接口响应格式

#### GET /api/files
```json
{
  "success": true,
  "data": {
    "currentPath": "/Users/mac/github/cmd",
    "parentPath": "/Users/mac/github",
    "rootPath": "/Users/mac/github/cmd",
    "items": [
      {
        "name": "src",
        "type": "directory",
        "icon": "📁",
        "path": "/Users/mac/github/cmd/src",
        "relativePath": "src",
        "size": null,
        "modified": "2026-03-10T10:00:00Z"
      },
      {
        "name": "package.json",
        "type": "text",
        "icon": "📝",
        "path": "/Users/mac/github/cmd/package.json",
        "relativePath": "package.json",
        "size": {"bytes": 1741, "formatted": "1.7 KB"},
        "modified": "2026-03-10T10:00:00Z"
      }
    ]
  }
}
```

#### GET /api/file/meta
```json
{
  "success": true,
  "data": {
    "name": "example.png",
    "path": "/Users/mac/github/cmd/example.png",
    "relativePath": "example.png",
    "extension": ".png",
    "size": {"bytes": 102400, "formatted": "100.0 KB"},
    "modified": "2026-03-10T10:00:00Z",
    "created": "2026-03-10T09:00:00Z",
    "accessed": "2026-03-10T10:00:00Z",
    "fileType": "image",
    "icon": "🖼️",
    "isMedia": true,
    "mimeType": "image/png",
    "mediaType": "image",
    "previewUrl": "/api/file/preview?path=...",
    "isBinary": true,
    "header": "89 50 4E 47 0D 0A 1A 0A ...",
    "detectedType": "PNG 图片"
  }
}
```

#### GET /api/files/search-content
```json
{
  "success": true,
  "data": {
    "query": "function",
    "searchPath": "/Users/mac/github/cmd",
    "rootPath": "/Users/mac/github/cmd",
    "results": [
      {
        "name": "app.js",
        "path": "/Users/mac/github/cmd/app.js",
        "relativePath": "app.js",
        "extension": ".js",
        "matches": [
          {
            "lineNumber": 42,
            "line": "function init() { ... }",
            "lineMatches": [{"start": 0, "end": 8, "text": "function"}],
            "context": "...",
            "contextStart": 40,
            "contextEnd": 44
          }
        ],
        "matchCount": 5,
        "size": {"bytes": 5000, "formatted": "4.9 KB"},
        "modified": "2026-03-10T10:00:00Z"
      }
    ],
    "count": 1,
    "filesSearched": 100,
    "limit": 50,
    "options": {
      "caseSensitive": false,
      "wholeWord": true,
      "useRegex": false,
      "contextLines": 2
    }
  }
}
```

#### POST /api/file/upload-to
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "name": "example.txt",
        "path": "/Users/mac/github/cmd/example.txt",
        "relativePath": "example.txt",
        "size": {"bytes": 1024, "formatted": "1.0 KB"},
        "modified": "2026-03-10T10:00:00Z"
      }
    ],
    "count": 1,
    "targetPath": "/Users/mac/github/cmd"
  }
}
```

## 3. 前端页面设计

### 3.1 页面布局
```
┌─────────────────────────────────────────────────────────────┐
│  📁 本地文件查看器                              [🌙] 主题   │
├─────────────────────────────────────────────────────────────┤
│  🔍 搜索文件名 (Ctrl+F) 或代码 (Ctrl+Shift+F)    [📄] [子目录]│
│     [区分大小写] [全字匹配] [正则表达式]                     │
├─────────────────────────────────────────────────────────────┤
│  🏠 根目录 / src / http-server                              │
│  ↑ 返回                                                     │
├─────────────────────────────────────────────────────────────┤
│  📂 /Users/mac/github/cmd/src/http-server       [⬆️] 上传   │
├─────────────────────────────────────────────────────────────┤
│  📁 .. (上级目录)                              2026-03-10   │
│  📁 public/                                  2026-03-10     │
│  📝 static.js                   5.2 KB      2026-03-10      │
│  🖼️ logo.png                   12.5 KB     2026-03-10      │
│  🎬 demo.mp4                   15.3 MB     2026-03-10      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 文件类型图标
| 类型 | 图标 | 说明 |
|------|------|------|
| 目录 | 📁 | folder |
| 普通文件 | 📄 | file |
| 图片 | 🖼️ | image |
| 文本 | 📝 | text |
| 代码 | 📜/📘/💚 | js/ts/vue |
| 视频 | 🎬 | video |
| 音频 | 🎵 | audio |
| 压缩包 | 📦 | archive |

### 3.3 交互设计

#### 文件浏览
1. **目录浏览**: 点击目录项进入该目录
2. **文件查看**: 点击文件项在模态框中查看内容
3. **文件下载**: 点击下载按钮下载文件
4. **面包屑导航**: 显示当前路径，支持点击跳转
5. **返回上级**: 支持返回上一级目录

#### 搜索功能
1. **文件名搜索**: 输入关键词实时搜索文件名
2. **代码搜索**: 切换模式后搜索文件内容
3. **搜索选项**: 区分大小写、全字匹配、正则表达式
4. **快捷键**: 
   - `Ctrl/Cmd + F` - 文件名搜索
   - `Ctrl/Cmd + Shift + F` - 代码搜索

#### 文件预览
1. **图片**: 直接显示预览图，支持缩放
2. **视频**: 原生播放器，支持 seek/进度控制
3. **音频**: 原生播放器
4. **文本**: 代码高亮显示
5. **二进制**: 显示元数据（文件头、类型检测等）

#### 文件上传
1. **拖拽上传**: 拖拽文件到页面任意位置
2. **点击上传**: 点击上传按钮选择文件
3. **快捷键**: `Ctrl/Cmd + U` 打开上传对话框
4. **进度显示**: 实时显示上传进度
5. **并发控制**: 最多 3 个文件并发上传

### 3.4 样式风格
- **主题**: 浅色/深色模式自适应
- **配色**:
  - 主色调：#1890ff (科技蓝)
  - 背景色：#f5f5f5 (浅灰) / #1a1a2e (深色)
  - 文字色：#333 (深灰) / #e4e4e4 (浅色)
  - 强调色：#40a9ff (亮蓝)
- **字体**: 系统默认字体，代码使用等宽字体
- **响应式**: 支持不同屏幕尺寸
- **动画**: 平滑过渡效果

### 3.5 模态框设计
```
┌─────────────────────────────────────────────────┐
│  📄 package.json                    [⬇️] [✕]   │
├─────────────────────────────────────────────────┤
│  {                                               │
│    "name": "it-cmd",                            │
│    "version": "1.0.12"                          │
│  }                                               │
├─────────────────────────────────────────────────┤
│  大小：1.7 KB    修改时间：2026-03-10           │
└─────────────────────────────────────────────────┘
```

## 4. 安全考虑

### 4.1 路径安全
- 限制访问范围在启动目录及其子目录
- 防止路径遍历攻击（`../`）
- 对路径参数进行标准化处理
- `safePath()` 函数验证路径合法性

### 4.2 文件类型限制
- 二进制文件不提供内容预览
- 大文件限制预览（文本 > 1MB，二进制 > 500KB）
- 敏感文件过滤（`.env`, `.git/config`, `node_modules` 等）

### 4.3 上传安全
- 最大文件大小限制：100MB
- 限制上传目录在允许的范围内
- 文件重命名处理
- 依赖检测（formidable）

### 4.4 搜索限制
- 排除目录：`node_modules`, `.git`, `dist`, `build`, `coverage` 等
- 结果数量限制：默认 50-100 条
- 每个文件匹配数限制：10 条

## 5. 实现细节

### 5.1 后端实现

#### 文件类型检测
```javascript
// 基于文件头魔数检测
const signatures = {
  '89504E470D0A1A0A': 'PNG 图片',
  'FFD8FF': 'JPEG 图片',
  '474946383': 'GIF 图片',
  '0000001866747970': 'MP4 视频',
  '1A45DFA3': 'Matroska (MKV) 视频',
  '494433': 'ID3 (MP3 音频)',
  '25504446': 'PDF 文档',
  '504B0304': 'ZIP 压缩包'
};
```

#### 支持的文件扩展名
- **图片**: .jpg, .jpeg, .png, .gif, .webp, .svg, .bmp, .avif
- **视频**: .mp4, .webm, .ogg, .mov, .avi, .wmv, .flv, .mkv
- **音频**: .mp3, .wav, .ogg, .flac, .aac, .m4a, .wma
- **代码**: .js, .jsx, .ts, .tsx, .vue, .html, .css, .scss, .less
- **配置**: .json, .xml, .yaml, .yml, .toml, .ini
- **文档**: .md, .markdown
- **其他**: .py, .java, .c, .cpp, .go, .rs, .php, .rb, .sh, .sql

### 5.2 前端实现

#### 状态管理
```javascript
const state = {
  currentPath: '',
  rootPath: '',
  history: [],
  theme: 'light',
  isSearching: false,
  searchResults: [],
  searchMode: 'filename', // 'filename' or 'code'
  codeSearchResults: []
};
```

#### 事件处理
- 防抖搜索输入（300ms）
- 键盘快捷键
- 拖拽事件（dragenter, dragover, dragleave, drop）
- 文件选择变化

### 5.3 性能优化
- 文件列表排序（目录在前，文件在后）
- 搜索结果按相关性排序
- 并发上传控制（最多 3 个）
- 流式文件传输（支持 Range 请求）
- 懒加载媒体资源

## 6. 已完成功能清单

- [x] 文件列表浏览
- [x] 目录导航（进入/返回）
- [x] 文件内容查看（文本）
- [x] 文件下载
- [x] 文件名搜索
- [x] 代码内容搜索
- [x] 搜索选项（大小写/全字/正则）
- [x] 图片预览
- [x] 视频播放
- [x] 音频播放
- [x] 二进制文件元数据
- [x] 文件类型检测（魔数）
- [x] 拖拽上传
- [x] 点击上传
- [x] 上传进度显示
- [x] 深色/浅色主题
- [x] 响应式设计
- [x] 快捷键支持
- [x] 面包屑导航
- [x] 敏感文件过滤
- [x] 路径安全检查
- [x] PDF 预览（支持翻页、缩放）

## 7. 扩展功能（待实现）

- [ ] 文件重命名
- [ ] 文件删除
- [ ] 新建文件/目录
- [ ] 文件多选操作
- [ ] 文件复制/移动
- [ ] 文件压缩/解压
- [ ] 文件历史版本
- [ ] 文件分享链接
- [ ] 文件排序（按名称/大小/时间）
- [ ] 文件过滤（按类型）
- [ ] 右键菜单
- [ ] 文件属性编辑
- [ ] 批量操作

## 8. 使用方式

### 8.1 基本使用
```bash
# 启动静态文件服务（默认当前目录）
x-static

# 指定目录
x-static ./my-project

# 指定端口
x-static -p 8080

# 指定目录和端口
x-static ./my-project -p 8080
```

### 8.2 访问地址
- 主页面：`http://127.0.0.1:3000/file-viewer/`
- 根目录：`http://127.0.0.1:3000/`（自动重定向）

### 8.3 快捷键
| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + F` | 聚焦文件名搜索 |
| `Ctrl/Cmd + Shift + F` | 聚焦代码搜索 |
| `Ctrl/Cmd + U` | 打开上传对话框 |
| `Enter` | 执行搜索 |
| `Esc` | 关闭模态框/搜索结果/拖拽区域 |
| `←` / `→` | PDF 上一页/下一页 |
| `+` / `-` | PDF 放大/缩小 |

### 8.4 依赖安装
```bash
# 安装文件上传依赖（可选）
npm install formidable

# 或使用 uv（如果项目使用 uv）
uv pip install formidable
```

### 8.5 PDF 预览功能
PDF 预览使用 [PDF.js](https://mozilla.github.io/pdf.js/) 库，通过 CDN 自动加载，无需额外安装。

**功能特性：**
- 📕 支持多页 PDF 浏览
- 🔍 支持缩放（放大/缩小/适应页面）
- ⌨️ 支持键盘操作（方向键翻页，+/- 缩放）
- 📥 支持下载 PDF 文件
- 📱 响应式设计，自适应容器大小

## 9. 注意事项

1. **网络要求**: 首次使用需要安装 `formidable` 依赖
2. **权限要求**: 确保对目标目录有读写权限
3. **文件大小**: 上传文件最大 100MB，预览文件最大 1MB（文本）/500KB（二进制）
4. **浏览器支持**: 需要现代浏览器（支持 ES6、Fetch API、File API）
5. **安全提示**: 不要在不信任的网络环境中使用

## 10. 更新日志

### v1.0.0 (2026-03-10)
- ✨ 初始版本发布
- 📁 文件列表浏览
- 🔍 文件名和内容搜索
- 🖼️ 图片/视频/音频预览
- 📤 拖拽上传功能
- 🌙 深色/浅色主题
- 📱 响应式设计
