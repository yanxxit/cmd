# Flowchart 流程图编辑器

基于 [flowchart.js](https://flowchart.js.org/) 实现的在线流程图编辑器，使用简单的 DSL 语法绘制流程图。

## 访问地址

启动服务器后访问：http://127.0.0.1:3000/flowchart-editor/

## 功能特点

- 📝 **实时预览**：输入语法后立即渲染流程图
- 🎨 **符号丰富**：支持开始/结束、操作、条件、输入输出等多种符号
- 🔄 **撤销/重做**：支持 Ctrl+Z/Y 撤销重做操作
- 📥 **导出功能**：支持下载 SVG 和 PNG 格式
- 🔍 **缩放控制**：支持 50%-200% 缩放
- 📋 **示例模板**：内置基础、条件、循环、复杂流程示例
- ⌨️ **快捷键**：Tab 缩进、Ctrl+S 下载、Ctrl+Z/Y 撤销重做
- 🎯 **快速插入**：右下角快捷插入符号面板

## 快速开始

### 1. 基础语法

flowchart.js 使用简单的 DSL（领域特定语言）定义流程图：

```
# 定义符号
symbolId=>symbolType: 显示文本

# 连接符号
symbol1->symbol2
```

### 2. 符号类型

| 类型 | 关键字 | 形状 | 用途 |
|------|--------|------|------|
| 开始/结束 | `start` | 圆角矩形 | 流程的开始和结束 |
| 操作 | `operation` | 矩形 | 处理步骤、操作 |
| 条件 | `condition` | 菱形 | 判断、分支条件 |
| 输入输出 | `inputoutput` | 平行四边形 | 数据输入输出 |
| 并行 | `parallel` | 双竖线 | 并行处理 |

### 3. 连接方式

```
# 简单连接
st->op->e

# 条件分支
cond(yes)->op1
cond(no)->op2

# 带标签连接
op1->op2: 标签文本
```

## 示例代码

### 基础流程

```
st=>start: 开始
op1=>operation: 第一步操作
op2=>operation: 第二步操作
e=>end: 结束

st->op1->op2->e
```

### 条件判断

```
st=>start: 开始
input=>inputoutput: 输入数据
cond=>condition: 数据有效？
op1=>operation: 处理数据
op2=>operation: 报错提示
e=>end: 结束

st->input->cond
cond(yes)->op1->e
cond(no)->op2->e
```

### 循环流程

```
st=>start: 开始
init=>operation: 初始化 i=0
cond=>condition: i < 10?
op=>operation: 执行操作
inc=>operation: i++
e=>end: 结束

st->init->cond
cond(yes)->op->inc->cond
cond(no)->e
```

### 复杂流程（用户登录）

```
st=>start: 用户登录
login=>operation: 输入账号密码
valid=>condition: 验证通过？
admin=>condition: 是管理员？
dashboard=>operation: 进入管理后台
userPage=>operation: 进入用户页面
retry=>operation: 重新登录
error=>operation: 显示错误信息
e=>end: 结束

st->login->valid
valid(yes)->admin
valid(no)->error->retry->login
admin(yes)->dashboard->e
admin(no)->userPage->e
```

## 使用说明

### 编辑器操作

| 操作 | 快捷键/方式 | 说明 |
|------|------------|------|
| 插入符号 | 点击右下角快速插入按钮 | 快速插入常用符号 |
| 格式化代码 | `✨ 格式化` 按钮 | 自动整理代码格式 |
| 撤销 | `Ctrl+Z` 或 `↩️` 按钮 | 撤销上一步操作 |
| 重做 | `Ctrl+Y` 或 `↪️` 按钮 | 重做已撤销的操作 |
| 下载 SVG | `Ctrl+S` 或 `📥 SVG` 按钮 | 下载 SVG 矢量图 |
| 下载 PNG | `🖼️ PNG` 按钮 | 下载 PNG 图片 |
| 清空 | `🗑️ 清空` 按钮 | 清空编辑器内容 |

### 缩放控制

- `➕` - 放大 10%
- `➖` - 缩小 10%
- `100%` - 重置缩放
- 缩放范围：50% - 200%

### 加载示例

点击顶部示例按钮加载预设模板：

- 📋 **基础示例** - 简单的线性流程
- 🔀 **条件判断** - 包含分支判断
- 🔄 **循环流程** - 包含循环结构
- 🔗 **复杂流程** - 综合示例

## 配置选项

编辑器使用以下默认配置渲染流程图：

```javascript
{
  'x': 0,                    // 起始 x 坐标
  'y': 0,                    // 起始 y 坐标
  'line-width': 2,           // 线条宽度
  'line-length': 50,         // 线条长度
  'text-margin': 10,         // 文本边距
  'font-size': 14,           // 字体大小
  'font': 'sans-serif',      // 字体
  'font-weight': 'normal',   // 字体粗细
  'line-color': '#333',      // 线条颜色
  'element-color': '#667eea',// 元素颜色
  'fill': '#fff',            // 填充颜色
  'yes-text': '是',          // 是分支文本
  'no-text': '否',           // 否分支文本
  'arrow-end': 'block',      // 箭头样式
  'scale': 1                 // 缩放比例
}
```

### 自定义符号颜色

```
# 开始节点使用绿色
st=>start: 开始
# 结束节点使用红色
e=>end: 结束
# 条件节点使用橙色
cond=>condition: 条件？
```

## 语法详解

### 1. 符号定义

```
# 基本格式
symbolId=>symbolType: 显示文本

# 示例
st=>start: 开始流程
op1=>operation: 执行操作
cond1=>condition: 是否成功？
io1=>inputoutput: 输入数据
end1=>end: 结束
```

### 2. 符号连接

```
# 直线连接
st->op1->e

# 条件分支
cond1(yes)->op1
cond1(no)->e

# 带标签
op1->op2: 处理完成
```

### 3. 条件分支

条件符号可以有两个或多个输出：

```
cond=>condition: 条件？
cond(yes)->op1  # 是分支
cond(no)->op2   # 否分支
```

### 4. 并行处理

```
st=>start: 开始
par1=>parallel: 并行处理
op1=>operation: 任务 A
op2=>operation: 任务 B
e=>end: 结束

st->par1
par1->op1->e
par1->op2->e
```

## 常见问题

### Q: 流程图无法渲染？

A: 检查以下几点：
1. 符号定义格式是否正确（`id=>type: text`）
2. 连接符是否使用 `->`
3. 条件分支是否标注 `(yes)` / `(no)`
4. 查看错误提示信息

### Q: 如何调整流程图位置？

A: 流程图会自动布局，无需手动调整位置。如需调整，可以：
1. 修改符号定义的顺序
2. 修改连接的顺序
3. 使用缩放功能调整显示大小

### Q: 导出的图片模糊？

A: 建议：
1. 使用 SVG 格式（矢量图，无限缩放不失真）
2. PNG 下载时使用 2x 分辨率
3. 在浏览器中放大后再截图

### Q: 支持哪些浏览器？

A: 现代浏览器均支持：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 技术栈

- **核心库**：[flowchart.js](https://flowchart.js.org/) v1.18.0
- **CDN**：BootCDN
- **前端**：原生 JavaScript + CSS
- **后端**：Node.js + Express（静态文件服务）

## 相关资源

- [flowchart.js 官方文档](https://flowchart.js.org/)
- [flowchart.js GitHub](https://github.com/adrai/flowchart.js)
- [BootCDN flowchart](https://www.bootcdn.cn/flowchart/)

## 更新日志

### v1.0.0
- ✅ 初始版本发布
- ✅ 实时预览功能
- ✅ 撤销/重做功能
- ✅ SVG/PNG 导出
- ✅ 缩放控制
- ✅ 示例模板
- ✅ 快速插入面板
