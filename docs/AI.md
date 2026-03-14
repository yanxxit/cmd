# 参考  当前版本的 TODO，创建版本/todo-v2  页面，基于框架基于HTML + JS + Tailwind CSS (CDN) + Alpine.js 来实现，可以基于原版的样式，也可以按照自己的想法来实现

黄金组合：Shoelace (负责 UI 组件) + Alpine.js (负责业务逻辑) + Tailwind (负责布局排版)。
这是目前原生开发中最强大、最灵活、且 AI 最容易生成的“三剑客”。

| 特性 | Shoelace | Alpine.js | Bootstrap |
| :--- | :--- | :--- | :--- |
| 核心定位 | UI 组件库 (按钮、表格、弹窗) | 交互逻辑框架 (状态管理、事件绑定) | UI 框架 + 简单逻辑 |
| 你需要写什么 | 几乎只写 HTML 标签 `<sl-xxx>` | 写 HTML + `x-data` 逻辑 | 写 HTML + class 类名 |
| 样式定制 | 通过 CSS 变量 (Tokens) 全局定制 | 需自己写 CSS 或配合 Tailwind | 需覆盖 class 或编译 Sass |
| 交互逻辑 | 内置 (点击自动弹窗、自动校验) | 手写 (需自己写 `open = !open`) | 内置 (依赖 Bootstrap JS) |
| AI 生成难度 | 极低 (标签语义清晰) | 低 (逻辑需 AI 推理) | 低 (类名需记忆) |
| 最佳搭档 | 原生 JS 或 Alpine.js | Tailwind CSS | 无 (自带样式) |



## v3 版本
基于HTML + JS + Bootstrap 5 (CDN)，实现个 /todo-v3 版本


## v4版本

参考 /todo-v2版本，推荐使用HTML + JS + Tailwind CSS (CDN) + Shoelace + Petite-Vue + axios 实现 /todo-v4 版本

参考 /todo-v2版本，推荐使用HTML + JS + Tailwind CSS (CDN)  + Petite-Vue + axios 实现 /todo-v5 版本

## 

实现一个 网页版本的 chat ai 功能，基本代码参考 @bin/chat.js,支持历史消息作为上下文，仅支持最近 2 条消息（包含，问题及回答（最好是精简化的））

## 针对 html script type="module" 实现功能

```html
<!-- 方式1: 内联模块 -->
<script type="module">
  import { greet } from './utils.js';
  greet('World');
</script>

<!-- 方式2: 外部模块文件 -->
<script type="module" src="main.js"></script>
```
- [＜script type=“module“＞用法的基本介绍](https://hbiao68.blog.csdn.net/article/details/156541649)


## 使用 component 实现功能