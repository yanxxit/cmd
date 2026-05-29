# Project Summary

## Overall Goal
开发一个功能完善、UI 精美的 JSON 对比工具 (json-diff-v3)，支持差异高亮、过滤相同项、历史记录、导出等实用功能。

## Key Knowledge

### 技术栈
- **框架**: Next.js 16.1.6 (Turbopack)
- **UI 库**: Ant Design v5
- **语言**: TypeScript + React
- **存储**: LocalStorage (历史记录持久化)

### 项目结构
```
cmd/next-app/
├── components/json-diff/
│   ├── constants.ts      # 高亮样式配置、示例数据
│   ├── types.ts          # TypeScript 类型定义
│   ├── utils.ts          # 行处理工具函数
│   ├── logic.ts          # 核心逻辑 (差异计算、过滤)
│   ├── styles.ts         # 样式定义
│   └── HighlightEditor.tsx # 高亮编辑器组件
└── pages/
    └── json-diff-v3.tsx  # 主页面
```

### 核心功能
1. **差异高亮**: 删除 (红色)、新增 (绿色)、修改 (蓝色)
2. **过滤相同项**: 开关控制，自动重新对比
3. **历史记录**: 最近 10 条，LocalStorage 持久化
4. **导出功能**: 下载 JSON 文件
5. **字体缩放**: 11px - 20px 可调
6. **快捷键**: `⌘/Ctrl + Enter` 对比，`⌘/Ctrl + H` 历史

### 开发命令
```bash
cd /Users/mac/github/cmd/next-app
npm run dev  # 启动开发服务器 (端口 3030)
```

### 访问地址
- V3: `http://localhost:3030/json-diff-v3`

## Recent Actions

### 代码重构与优化
1. **[DONE]** 代码拆分为模块化结构 (7 个文件)
2. **[DONE]** 修复 `line is not defined` 变量引用错误
3. **[DONE]** 移除无意义的统计卡片模块
4. **[DONE]** 优化高亮样式 (降低透明度，更柔和)

### 功能实现
1. **[DONE]** 差异高亮编辑器 (contentEditable + 分层渲染)
2. **[DONE]** 过滤相同项功能 (toggleFilter 函数)
3. **[DONE]** 历史记录功能 (LocalStorage)
4. **[DONE]** 导出 JSON 文件功能
5. **[DONE]** 字体缩放功能 (11-20px)
6. **[DONE]** 5 个示例数据集

### UI 优化
1. **[DONE]** 全屏布局 (100vh)
2. **[DONE]** 编辑区占据 80% 空间
3. **[DONE]** 顶部工具栏固定 56px
4. **[DONE]** 渐变背景主题 (#667eea → #764ba2)
5. **[DONE]** 磨砂玻璃效果工具栏

## Current Plan

### 已完成 [DONE]
1. ✅ 基础对比功能
2. ✅ 差异高亮显示
3. ✅ 过滤相同项
4. ✅ 历史记录
5. ✅ 导出功能
6. ✅ 代码模块化拆分
7. ✅ UI 布局优化
8. ✅ 文件上传对比 (支持左右侧分别上传)
9. ✅ JSON 格式化/压缩功能
10. ✅ 主题切换 (深色/浅色模式，快捷键 `⌘/Ctrl + B`)
11. ✅ 性能优化 (大 JSON 分块处理工具函数)
12. ✅ 粘贴自动格式化 JSON
13. ✅ 编辑器复制按钮
14. ✅ 导入优化 (拖拽上传模态框)

### 进行中 [IN PROGRESS]
- 无

### 待办 [TODO]
1. [TODO] 添加单元测试
2. [TODO] 支持文件拖拽上传到指定区域
3. [TODO] 添加更多实用功能 (如：批量对比、URL 导入)

## Important Notes

### 样式约定
- 高亮样式使用渐变背景，透明度 0.15/0.08
- 边框使用对应颜色的 0.25 透明度
- 相同内容使用透明背景、#555 文字颜色
- 深色模式使用深蓝紫色渐变背景 (#1a1a2e → #16213e)
- 浅色模式使用蓝紫色渐变背景 (#667eea → #764ba2)

### 关键函数
- `calculateDiff()` - 计算 JSON 差异
- `filterSameFields()` - 过滤相同字段
- `processLines()` - 处理行差异标记
- `collectDiffPaths()` - 收集差异路径
- `formatJson()` - 格式化 JSON
- `minifyJson()` - 压缩 JSON
- `parseJsonFile()` - 解析上传的 JSON 文件
- `processLargeJson()` - 分块处理大 JSON
- `smartFormat()` - 智能格式化（粘贴时自动调用）
- `copyToClipboard()` - 复制到剪贴板
- `isValidJson()` - 验证 JSON 格式

### 快捷键
- `⌘/Ctrl + Enter` - 对比 JSON
- `⌘/Ctrl + H` - 打开历史记录
- `⌘/Ctrl + B` - 切换主题 (深色/浅色)

### 用户偏好
- 简洁大气的 UI 设计
- 编辑区需要足够大 (页面 80%)
- 背景统一使用渐变色
- 边距规范合理

---

## Summary Metadata
**Update time**: 2026-03-22T08:00:00.000Z 
