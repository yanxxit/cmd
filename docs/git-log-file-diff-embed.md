# Git Log 文件 Diff 嵌入优化

## 优化概述

对 `bin/git-log.js` 和 `templates/git-log.ejs` 进行优化，实现以下功能：

1. **HTML 报告始终嵌入 Diff 数据** - 无需 `--diff` 参数
2. **点击文件展开 Diff** - 改进交互体验
3. **文件与 Diff 双向联动** - 点击文件列表项直接展开对应的 Diff

---

## ✅ 优化 1: HTML 报告始终包含 Diff

### 问题
之前需要使用 `--diff` 参数才能在 HTML 中显示代码变更内容，导致：
- 默认生成的报告缺少 Diff 信息
- 用户体验不一致

### 解决方案
修改 `src/git/report-generator.js`，HTML 报告始终获取并嵌入 Diff 数据：

```javascript
// 为每个 commit 添加 diff 数据（用于嵌入到 HTML）- HTML 报告始终包含 diff
for (const commit of commits) {
  if (commit.hash) {
    // 获取 diff 数据
    try {
      commit.diffs = getCommitDiff(commit.hash);
    } catch (e) {
      commit.diffs = [];
    }
  }
}
```

### 文件变更
- `src/git/report-generator.js`: 移除 `includeDiff` 条件判断
- `bin/git-log.js`: HTML 报告生成始终传递 `true`

---

## ✅ 优化 2: 点击文件展开 Diff

### 问题
之前点击文件列表项只是滚动到对应的 Diff 位置，不会展开 Diff 区域，导致：
- 用户需要手动展开 Diff 才能看到内容
- 交互体验不直观

### 解决方案
改进文件列表项的点击行为，实现：
- 点击文件 → 自动展开提交卡片
- 点击文件 → 自动展开 Diff 区域
- 点击文件 → 自动展开对应的文件 Diff
- 再次点击 → 收起该文件的 Diff

### 技术实现

#### 1. 文件列表项添加索引
```html
<% commit.files.forEach(function(file, fileIndex) { %>
  <div class="file-item" onclick="toggleFileDiff(<%= commitIndex %>, <%= fileIndex %>, '<%= escapeHtml(file.path) %>')">
    <!-- ... -->
    <span class="file-toggle-icon" style="margin-left:8px;font-size:12px;">▶</span>
  </div>
<% }); %>
```

#### 2. Diff 文件项添加索引属性
```html
<% commit.diffs.forEach(function(diff, diffIndex) { %>
  <div class="diff-file" data-file-index="<%= diffIndex %>" data-file-path="<%= escapeHtml(diff.path) %>">
    <!-- ... -->
  </div>
<% }); %>
```

#### 3. JavaScript 实现切换逻辑
```javascript
function toggleFileDiff(commitIndex, fileIndex, filePath) {
  // 1. 找到对应的提交卡片
  const card = document.querySelector(`.commit-card[data-commit-index="${commitIndex}"]`);
  
  // 2. 展开提交卡片
  if (!card.classList.contains('expanded')) {
    card.classList.add('expanded');
  }
  
  // 3. 展开 Diff 区域
  const diffSection = card.querySelector('.diff-section-header');
  if (diffSection && !diffSection.classList.contains('expanded')) {
    diffSection.classList.add('expanded');
  }
  
  // 4. 找到并展开对应的文件 Diff
  setTimeout(() => {
    const fileElement = card.querySelector(`.diff-file[data-file-index="${fileIndex}"]`);
    if (fileElement) {
      const fileHeader = fileElement.querySelector('.diff-file-header');
      const isExpanded = fileHeader.classList.contains('expanded');
      
      if (isExpanded) {
        fileHeader.classList.remove('expanded');
        showToast('📁 已收起：' + filePath);
      } else {
        fileHeader.classList.add('expanded');
        fileElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 高亮效果
        fileElement.style.boxShadow = '0 0 0 2px #667eea';
        setTimeout(() => {
          fileElement.style.boxShadow = '';
        }, 2000);
        showToast('📁 已展开：' + filePath);
      }
    }
  }, 100);
}
```

### 文件变更
- `templates/git-log.ejs`:
  - 文件列表项添加 `fileIndex` 参数和展开图标
  - Diff 文件项添加 `data-file-index` 属性
  - 新增 `toggleFileDiff` 函数
  - 移除旧的 `scrollToFileDiff` 函数

---

## 使用示例

### 基本用法
```bash
# 生成 HTML 报告（现在始终包含 Diff）
x-git-log -d yesterday

# 指定输出文件
x-git-log -d yesterday -o ./my-report.html

# 生成后自动打开
x-git-log -d yesterday --open

# 生成月度报告
x-git-log --month --open
```

### 选项说明
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-d, --date <date>` | 指定日期（YYYY-MM-DD 或 yesterday/today） | yesterday |
| `-o, --output <path>` | 输出文件路径 | ./git-log.html |
| `--open` | 生成后自动在浏览器中打开 | false |
| `--month` | 显示最近一个月的提交记录 | false |
| `--diff` | ~~包含详细的代码变更内容~~（HTML 已始终包含） | - |
| `--mine` | 仅查看自己的提交记录 | false |
| `--no-merges` | 排除 merge 提交 | false |

> **注意**: `--diff` 选项现在仅影响 JSON/Markdown 报告，HTML 报告始终包含 Diff 数据。

---

## 交互流程

### 点击文件列表项
```
点击文件 
  ↓
展开提交卡片（如果未展开）
  ↓
展开 Diff 区域（如果未展开）
  ↓
展开对应文件的 Diff
  ↓
滚动到该 Diff 并高亮
  ↓
显示 Toast 提示
```

### 再次点击同一文件
```
再次点击文件
  ↓
收起该文件的 Diff
  ↓
显示 Toast 提示
```

---

## 技术细节

### 数据流
```
Git 仓库
  ↓ (git show 命令)
getCommitDiff()
  ↓
commit.diffs 数组
  ↓ (EJS 模板渲染)
HTML 中的 Diff 内容
  ↓ (JavaScript 交互)
展开/收起 Diff
```

### 性能考虑
- **Diff 获取**: 使用同步方式获取，确保渲染时数据完整
- **懒展开**: Diff 内容默认收起，避免页面过长
- **高亮效果**: 2 秒后自动消失，不干扰用户阅读

### 容错处理
- 如果找不到 `data-file-index` 匹配的元素，尝试使用 `data-file-path` 匹配
- 如果文件没有对应的 Diff，显示 Toast 提示
- 如果获取 Diff 失败，使用空数组避免渲染错误

---

## 效果展示

### 文件列表
- 每个文件右侧显示展开图标 `▶`
- 悬停时背景色变化，提示可点击

### Diff 区域
- 点击文件后自动展开
- Diff 内容使用深色主题，语法高亮
- 新增行绿色背景，删除行红色背景

### 交互反馈
- Toast 提示显示操作结果
- 高亮效果帮助用户定位
- 平滑滚动提升用户体验

---

## 相关文件

- `bin/git-log.js` - CLI 入口
- `src/git/report-generator.js` - 报告生成
- `src/git/commit-log.js` - Git 命令封装
- `templates/git-log.ejs` - HTML 模板

---

## 后续优化建议

1. **Diff 懒加载** - 对于大量文件的提交，可以考虑懒加载 Diff 内容
2. **Diff 视图切换** - 支持 unified/split 视图切换
3. **语法高亮增强** - 集成 Monaco Editor 实现完整语法高亮
4. **Diff 统计图表** - 在 Diff 区域显示更详细的统计信息
5. **文件搜索** - 在文件列表中支持快速搜索过滤

---

## 更新日期
2026-03-20

## 更新日志

### 2026-03-20 - 默认展开全部内容
- **新增**: 页面加载时自动展开所有提交、Diff 区域和文件 Diff
- **新增**: 作者贡献卡片默认展开
- **新增**: 月度视图时间线默认展开
- **优化**: 点击标题/文件时始终展开，不再收起
- **优化**: "展开全部/收起全部"按钮功能增强

### 2026-03-20 - 文件 Diff 嵌入优化
- 初始版本发布
