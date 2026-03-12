# Git Log 月度视图优化文档

## 优化概述

为 `bin/x-git-log.js` 添加了**月度视图**功能，支持展示最近 30 天的 Git 提交记录，并以时间线形式展示。

---

## ✅ 优化 1: 最近一个月记录展示

### 实现内容
- **--month 选项**：一键获取最近 30 天提交记录
- **月度概览卡片**：显示总提交数、活跃天数、日均提交等
- **时间线视图**：按日期分组，形成可视化时间线
- **展开/收起**：点击日期查看当天提交详情

### CLI 新增选项
```bash
# 查看最近 30 天提交
node bin/x-git-log.js --month

# 带 diff 的月度视图
node bin/x-git-log.js --month --diff

# 导出所有格式
node bin/x-git-log.js --month --all

# 在浏览器打开
node bin/x-git-log.js --month --open
```

### 月度概览指标
| 指标 | 说明 |
|------|------|
| 总提交数 | 30 天内总提交次数 |
| 新增行数 | 30 天内新增代码行数 |
| 删除行数 | 30 天内删除代码行数 |
| 活跃天数 | 有提交记录的天数 |
| 日均提交 | 活跃天数的平均提交数 |

### 时间线特性
- **日期显示**：日期 + 星期 + 今天标记
- **提交统计**：每天显示提交数、新增、删除行数
- **展开动画**：平滑的展开/收起动画
- **自动互斥**：展开一个日期时自动收起其他日期

---

## 📊 技术实现

### bin/x-git-log.js 修改

#### 1. 新增参数
```javascript
.option('--month', '显示最近一个月的提交记录')
```

#### 2. 月度视图模式
```javascript
if (options.month) {
  const until = dayjs().format('YYYY-MM-DD');
  const since = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  dateRange = `最近 30 天 (${since} ~ ${until})`;
  isMonthView = true;
  
  commits = await getCommitsByDateRange({ since, until, includeDiff: options.diff });
}
```

#### 3. 每日统计收集
```javascript
// 每日统计（月度视图）
if (isMonthView) {
  const dateKey = dayjs(commit.date).format('YYYY-MM-DD');
  if (!dailyStats[dateKey]) {
    dailyStats[dateKey] = { date: dateKey, commits: 0, insertions: 0, deletions: 0, files: 0 };
  }
  dailyStats[dateKey].commits += 1;
  dailyStats[dateKey].insertions += commit.summary?.insertions || 0;
  dailyStats[dateKey].deletions += commit.summary?.deletions || 0;
}
```

#### 4. 传递到模板
```javascript
const html = ejs.render(template, {
  // ... 其他参数
  dailyStats: JSON.stringify(dailyStatsArray),
  isMonthView,
  dayjs
});
```

### templates/git-log.ejs 修改

#### 1. CSS 样式
```css
/* 月度视图样式 */
.month-view-section { margin-bottom: 30px; }
.month-stats-header { background: white; padding: 25px; }
.month-overview-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.month-overview-card { background: linear-gradient(...); padding: 20px; text-align: center; }

/* 时间线样式 */
.month-timeline { position: relative; padding-left: 30px; }
.month-timeline::before { content: ''; position: absolute; left: 10px; width: 2px; background: linear-gradient(...); }
.timeline-day { position: relative; margin-bottom: 20px; }
.timeline-day::before { content: ''; position: absolute; left: -24px; width: 12px; height: 12px; border-radius: 50%; background: #667eea; }
.timeline-day-header { background: white; padding: 15px 20px; cursor: pointer; }
.timeline-day-commits { display: none; padding-left: 20px; }
.timeline-day.expanded .timeline-day-commits { display: block; }
```

#### 2. HTML 结构
```html
<% if (isMonthView) { %>
  <div class="month-view-section">
    <div class="month-stats-header">
      <h2>📅 月度概览</h2>
      <div class="month-overview-cards">
        <!-- 5 个概览卡片 -->
      </div>
    </div>
    
    <div class="month-timeline">
      <% dailyStatsArray.forEach(function(dayStat) { %>
        <div class="timeline-day">
          <div class="timeline-day-header" onclick="toggleTimelineDay(this)">
            <div class="timeline-day-date">
              <span><%= dayStat.date %></span>
              <span class="weekday"><%= weekday %></span>
            </div>
            <div class="timeline-day-stats">
              <span class="timeline-stat commits">📝 <%= dayStat.commits %> 提交</span>
              <!-- 新增/删除统计 -->
            </div>
          </div>
          <div class="timeline-day-commits">
            <!-- 当天提交列表 -->
          </div>
        </div>
      <% }); %>
    </div>
  </div>
<% } %>
```

#### 3. JavaScript 函数
```javascript
/**
 * 切换时间线日期展开/收起状态
 */
function toggleTimelineDay(header) {
  const day = header.closest('.timeline-day');
  const isExpanded = day.classList.contains('expanded');
  
  // 关闭其他展开的日期
  document.querySelectorAll('.timeline-day.expanded').forEach(d => {
    if (d !== day) d.classList.remove('expanded');
  });
  
  if (isExpanded) {
    day.classList.remove('expanded');
  } else {
    day.classList.add('expanded');
  }
}
```

---

## 🎨 UI 效果

### 月度概览卡片
```
┌─────────────────────────────────────────────────┐
│  📅 月度概览                                     │
├─────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │  15  │ │ +320 │ │ -45  │ │  8   │ │ 1.88 │  │
│  │总提交│ │新增行│ │删除行│ │活跃天│ │日均  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
└─────────────────────────────────────────────────┘
```

### 时间线视图
```
│  ● 2026-03-13 周五
│    ┌─────────────────────────────┐
│    │ 📝 3 提交  +120  -15  ▶     │ ← 点击展开
│    └─────────────────────────────┘
│
│  ● 2026-03-12 周四
│    ┌─────────────────────────────┐
│    │ 📝 5 提交  +200  -30  ▶     │
│    └─────────────────────────────┘
│    ├─ 提交 1: feat: 新增功能
│    ├─ 提交 2: fix: 修复 bug
│    └─ ...
```

---

## 📁 文件变更清单

### 修改的文件
1. **bin/x-git-log.js** (+100 行)
   - `--month` 选项支持
   - 每日统计数据收集
   - 月度视图模式判断
   - 传递 `dailyStats` 和 `isMonthView` 到模板

2. **templates/git-log.ejs** (+250 行)
   - 月度视图 CSS 样式
   - 月度概览 HTML 结构
   - 时间线视图 HTML 结构
   - `toggleTimelineDay()` JavaScript 函数

### 新增的 CSS 类
```css
.month-view-section
.month-stats-header
.month-overview-cards
.month-overview-card
.month-timeline
.timeline-day
.timeline-day::before
.timeline-day-header
.timeline-day-date
.timeline-day-stats
.timeline-stat
.timeline-day-commits
.timeline-toggle-icon
```

### 新增的 JavaScript 函数
```javascript
toggleTimelineDay(header)  // 切换时间线日期展开/收起
```

---

## 🚀 使用场景

### 场景 1: 周报/月报生成
```bash
# 生成最近 30 天报告
node bin/x-git-log.js --month -o monthly-report.html

# 生成带详细 diff 的报告
node bin/x-git-log.js --month --diff -o monthly-report-diff.html
```

### 场景 2: 团队活跃度分析
```bash
# 查看团队最近 30 天活跃度
node bin/x-git-log.js --month --open

# 按作者过滤查看
node bin/x-git-log.js --month -a "author@example.com"
```

### 场景 3: 项目进度追踪
```bash
# 批量导出所有格式
node bin/x-git-log.js --month --all

# 生成文件：
# - git-log.html (HTML 交互版)
# - git-log.json (数据分析用)
# - git-log.md (文档归档用)
```

---

## 🎯 后续优化建议

1. **日期范围选择器**：允许自定义日期范围（如最近 7 天、90 天）
2. **对比功能**：对比两个时间段的提交数据
3. **导出图片**：将时间线导出为 PNG/SVG
4. **工作日标记**：区分工作日/周末提交
5. **提交热力图**：类似 GitHub 的贡献热力图
6. **文件变更趋势**：显示文件变更频率趋势

---

## ✅ 测试验证

生成测试报告并验证：
```bash
# 基础测试
node bin/x-git-log.js --month -o ./logs/git-log-month.html

# 带 diff 测试
node bin/x-git-log.js --month --diff

# 批量导出测试
node bin/x-git-log.js --month --all
```

检查项目：
- [x] 月度视图正常显示
- [x] 概览卡片数据正确
- [x] 时间线展开/收起正常
- [x] 日期显示正确（含星期）
- [x] 提交统计准确
- [x] 响应式布局正常

---

## 📝 版本信息

- **优化日期**: 2026-03-13
- **涉及文件**: 2 个
- **新增代码**: ~350 行
- **新增选项**: `--month`
