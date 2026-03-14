# CSV 转 Markdown/HTML 表格工具

> 📅 创建时间：2026-03-13  
> 📋 技术栈：Vue 3 + Tailwind CSS

---

## 🎯 功能概述

实时编辑 CSV 数据，同步渲染 Markdown 和 HTML 表格格式，支持一键复制和下载。

**功能特性：**
- ✅ 实时编辑 CSV，另一侧同步渲染
- ✅ 支持多种分隔符（逗号/分号/竖线/Tab）
- ✅ 支持表头识别
- ✅ Markdown 表格对齐方式可选
- ✅ HTML 表格预览
- ✅ 一键复制结果
- ✅ 下载为 .md 或 .html 文件
- ✅ 导入 CSV 文件
- ✅ 明/暗主题切换

---

## 📁 文件结构

```
public/csv-table-converter/
└── index.html          # CSV 转换器页面
```

---

## 🚀 快速开始

### 访问页面

```bash
# 启动服务
x-static

# 访问页面
http://127.0.0.1:3000/csv-table-converter/
```

---

## 🎨 页面布局

```
┌─────────────────────────────────────────────────┐
│  📊 CSV 转 Markdown/HTML 表格                    │
│  实时编辑 · 同步渲染 · 一键复制                 │
├─────────────────────────────────────────────────┤
│ 分隔符：逗号 | 表头：有 | Markdown 对齐：左对齐  │
│  [📝 加载示例] [🗑️ 清空]                        │
├───────────────────┬─────────────────────────────┤
│  📝 CSV 输入       │  📤 输出结果                │
│ [📁 导入] [📋 复制]│  [📝 Markdown] [🌐 HTML]    │
│                   │  [👁️ 预览] [✅ 复制] [💾 下载]│
│ 姓名，年龄，城市   │  | 姓名 | 年龄 | 城市 |     │
│ 张三，25，北京     │  | --- | --- | --- |        │
│ 李四，30，上海     │  | 张三 | 25 | 北京 |       │
│                   │  | 李四 | 30 | 上海 |       │
│ 📊 3 行 × 3 列      │                             │
└───────────────────┴─────────────────────────────┘
```

---

## 💻 使用指南

### 1. 输入 CSV 数据

在左侧文本框中输入或粘贴 CSV 数据：

```csv
姓名，年龄，城市，职业
张三，25，北京，工程师
李四，30，上海，设计师
王五，28，广州，产品经理
```

### 2. 配置选项

**分隔符：**
- 逗号 (,) - 默认
- 分号 (;)
- 竖线 (|)
- Tab

**表头：**
- 有表头 - 第一行作为表头
- 无表头 - 所有行都是数据

**Markdown 对齐：**
- 左对齐 - `| --- |`
- 居中 - `| :---: |`
- 右对齐 - `| ---: |`

### 3. 选择输出格式

**Markdown 选项卡：**
```markdown
| 姓名 | 年龄 | 城市 | 职业 |
| --- | --- | --- | --- |
| 张三 | 25 | 北京 | 工程师 |
| 李四 | 30 | 上海 | 设计师 |
| 王五 | 28 | 广州 | 产品经理 |
```

**HTML 选项卡：**
```html
<table>
  <thead>
    <tr>
      <th>姓名</th>
      <th>年龄</th>
      <th>城市</th>
      <th>职业</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>张三</td>
      <td>25</td>
      <td>北京</td>
      <td>工程师</td>
    </tr>
    <tr>
      <td>李四</td>
      <td>30</td>
      <td>上海</td>
      <td>设计师</td>
    </tr>
  </tbody>
</table>
```

**预览选项卡：**
- 以表格形式预览渲染效果
- 支持 hover 高亮

### 4. 复制/下载

**复制结果：**
- 点击"✅ 复制结果"按钮
- 粘贴到 Markdown 编辑器或 HTML 文件中

**下载文件：**
- Markdown: 下载为 `.md` 文件
- HTML: 下载为 `.html` 文件

---

## 🔧 核心功能

### CSV 解析

```javascript
const parseCSV = (text) => {
  const lines = text.trim().split('\n').map(line => line.trim());
  const rows = lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
  
  if (hasHeader && rows.length > 0) {
    return { headers: rows[0], rows: rows.slice(1) };
  }
  return { headers: [], rows };
};
```

### Markdown 表格生成

```javascript
const generateMarkdown = (data) => {
  const headers = data.headers.length > 0 ? data.headers : data.rows[0];
  const rows = data.headers.length > 0 ? data.rows : data.rows.slice(1);
  
  // 表头
  let md = '| ' + headers.join(' | ') + ' |\n';
  
  // 分隔行（根据对齐方式）
  const align = mdAlignment;
  const separators = headers.map(() => {
    if (align === 'center') return ':---:';
    if (align === 'right') return '---:';
    return '---';
  });
  md += '| ' + separators.join(' | ') + ' |\n';
  
  // 数据行
  rows.forEach(row => {
    md += '| ' + row.join(' | ') + ' |\n';
  });
  
  return md.trim();
};
```

### HTML 表格生成

```javascript
const generateHTML = (data) => {
  const headers = data.headers.length > 0 ? data.headers : data.rows[0];
  const rows = data.headers.length > 0 ? data.rows : data.rows.slice(1);
  
  let html = '<table>\n';
  
  // 表头
  if (headers.length > 0) {
    html += '  <thead>\n    <tr>\n';
    headers.forEach(h => {
      html += `      <th>${h}</th>\n`;
    });
    html += '    </tr>\n  </thead>\n';
  }
  
  // 表体
  if (rows.length > 0) {
    html += '  <tbody>\n';
    rows.forEach(row => {
      html += '    <tr>\n';
      row.forEach(cell => {
        html += `      <td>${cell}</td>\n`;
      });
      html += '    </tr>\n';
    });
    html += '  </tbody>\n';
  }
  
  html += '</table>';
  return html;
};
```

---

## 📊 示例数据

### 员工信息

```csv
姓名，年龄，部门，职位
张三，28，技术部，工程师
李四，32，产品部，产品经理
王五，25，设计部，UI 设计师
赵六，30，市场部，市场专员
```

### 产品销售

```csv
产品，单价，销量，销售额
iPhone 15,7999,1200,9598800
MacBook Pro,14999,500,7499500
iPad Air,4799,800,3839200
AirPods Pro,1899,2000,3798000
```

### 学生成绩

```csv
学号，姓名，语文，数学，英语
2023001，张三，85,92,88
2023002，李四，78,95,91
2023003，王五，92,88,85
2023004，赵六，88,90,93
```

---

## 🎨 主题切换

**浅色主题：**
- 白色背景
- 深色文字
- 明亮清新

**深色主题：**
- 深灰背景 (#111827)
- 浅色文字 (#f9fafb)
- 护眼舒适

点击右上角 🌙/☀️ 按钮切换主题，偏好自动保存。

---

## 🐛 常见问题

### 1. 表格渲染不正确

**原因：** 分隔符设置错误

**解决：** 检查 CSV 使用的分隔符，在设置中选择对应的分隔符

### 2. 表头识别错误

**原因：** 表头设置不正确

**解决：** 如果第一行是表头，选择"有表头"；否则选择"无表头"

### 3. 复制功能无效

**原因：** 浏览器权限限制

**解决：** 允许网站访问剪贴板权限

### 4. 文件导入失败

**原因：** 文件格式不支持

**解决：** 确保文件是 `.csv` 或 `.txt` 格式，编码为 UTF-8

---

## 🔗 相关资源

- [Markdown 表格语法](https://www.markdownguide.org/extended-syntax/#tables)
- [HTML 表格](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table)
- [Vue 3 文档](https://vuejs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)

---

## 📝 更新日志

### v1.0.0 (2026-03-13)
- ✅ 初始版本发布
- ✅ CSV 实时解析
- ✅ Markdown 表格生成
- ✅ HTML 表格生成
- ✅ 表格预览
- ✅ 一键复制
- ✅ 文件下载
- ✅ 文件导入
- ✅ 明/暗主题切换

---

*本文档基于 v1.0.0 版本编写，如有更新请参考最新代码。*
