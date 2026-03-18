# 本地 libs 访问

- `axios@1.13.6`: `/libs/axios/dist/axios.min.js`
- `dayjs@1.11.10`: `/libs/dayjs/dayjs.min.js`
- `antd@5.29.3`: `/libs/antd/dist/antd.min.js`
- `react@18.3.1`: `/libs/react/umd/react.production.min.js`
- `react-dom@18.3.1`: `/libs/react-dom/umd/react-dom.production.min.js`
- `babel@7.24.0`: `/libs/@babel/standalone/babel.min.js`
- `@picocss/pico@2.1.1`: `/libs/@picocss/pico/css/pico.min.css`

- `fullcalendar@6.1.20`: `/libs/fullcalendar/index.global.min.js`
- `vue@3.5.30`: `/libs/vue/dist/vue.global.prod.js`
- `xlsx@0.18.5`: `/libs/xlsx/dist/xlsx.full.min.js`
- `prismjs@1.30.0`: `/libs/prismjs/prism.js`
- `prismjs@1.30.0`: `/libs/prismjs/themes/prism-tomorrow.min.css`
- `prismjs@1.30.0`: `/libs/prismjs/themes/prism.min.css`
- `marked@15.0.12`: `/libs/marked/marked.min.js`

- `mermaid@10.9.1`: `/libs/mermaid/dist/mermaid.min.js`
- `mermaid@10.9.1`: `/libs/mermaid/dist/mermaid.esm.min.mjs`


- https://cdn.bootcdn.net/ajax/libs/marked/16.3.0/lib/marked.umd.min.js
- https://cdn.bootcdn.net/ajax/libs/marked/16.3.0/lib/marked.esm.min.js

## umd vs esm
简单来说，ESM 是现代 JavaScript 的官方标准，而 UMD 是一个为了兼容新旧环境而生的“万能”解决方案。

| 特性 | UMD (Universal Module Definition) | ESM (ECMAScript Module) |
| :--- | :--- | :--- |
| 模块规范 | 一种混合模式，兼容 CommonJS、AMD 和全局变量。 | JavaScript 语言的官方标准 (ES6+)，语法为 `import` / `export`。 |
| 语法 | 复杂的立即执行函数表达式 (IIFE)，内部包含环境判断逻辑。 | 简洁、声明式的 `import` 和 `export` 语句。 |
| 加载方式 | 同步加载。 | 静态分析，支持异步加载。 |
| Tree Shaking | 不支持。打包工具无法移除未使用的代码。 | 支持。可以移除未导出的代码，显著减小包体积。 |
| 适用环境 | 浏览器、Node.js，尤其擅长兼容老旧环境。 | 现代浏览器和 Node.js (v14+)。 |


## codemirror
https://www.bootcdn.cn/codemirror/