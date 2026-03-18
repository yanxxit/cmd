# tailwindcss vs tailwindcss-browser



这两个概念虽然名字很像，但定位完全不同：

**`tailwindcss`** 是 Tailwind CSS 的**核心框架和完整生态**，而 **`tailwindcss-browser`**（通常指代 Play CDN 或浏览器端脚本）仅仅是核心框架为了在浏览器中**即时运行**而提供的一个轻量级、非生产环境的解决方案。

简单来说，前者是**造房子的全套工具（包括设计图、砖块、水泥）**，后者是**一个临时的展示样板间**。

以下是详细的对比分析：

### ⚔️ 核心区别对比表

| 特性维度 | Tailwind CSS (核心框架) | Tailwind CSS Browser (Play CDN) |
| :--- | :--- | :--- |
| **定位** | **生产级框架**。用于构建正式的商业项目。 | **开发/原型工具**。用于快速测试、学习或简单的静态页面。 |
| **使用方式** | 需要 **Node.js** 环境，通过 CLI 或 PostCSS 构建。 | 直接在 HTML 中通过 `<script>` 标签引入。 |
| **性能** | **极高**。通过 PurgeCSS 自动移除未使用的样式，生产包极小（<10KB）。 | **较低**。需要在浏览器端实时解析类名并生成 CSS，加载速度较慢。 |
| **定制能力** | **完全定制**。通过 `tailwind.config.js` 深度配置主题、插件等。 | **受限**。虽然支持基础配置，但无法利用完整的构建插件生态。 |
| **适用场景** | 正式网站、Web 应用、React/Vue 项目等。 | 快速原型、简单的 HTML 演示、不想配置环境的临时测试。 |
| **官方建议** | **强烈推荐**用于生产环境。 | **不推荐**用于生产环境。 |

### 🔍 深度解析

#### 1. Tailwind CSS (核心框架)
这是 Tailwind 的**完全体**。它不仅仅是一堆 CSS 类，而是一套完整的构建系统。
*   **工作流程**：你需要安装 Node.js 依赖，配置 `tailwind.config.js` 文件。它会扫描你的 HTML/JS 文件，识别你用了哪些类（如 `bg-red-500`），然后**编译**生成一个只包含你所用样式的 CSS 文件。
*   **优势**：
    *   **性能优化**：最终生成的 CSS 文件非常小，因为它剔除了所有你没用到的样式。
    *   **生态支持**：支持官方插件（如 `@tailwindcss/typography`, `@tailwindcss/forms`）和第三方工具。
    *   **智能提示**：配合 VS Code 插件，能提供完美的自动补全和语法高亮。

#### 2. Tailwind CSS Browser (Play CDN)
这通常指的是通过 CDN 链接引入的脚本（例如 `<script src="https://cdn.tailwindcss.com"></script>`）。
*   **工作原理**：它会在浏览器加载页面时，下载一个较大的 JavaScript 脚本。这个脚本会在浏览器内部实时扫描 DOM，根据你写的类名动态生成 CSS 样式并注入到页面中。
*   **劣势**：
    *   **性能损耗**：浏览器需要消耗资源去解析和生成样式，导致首屏加载变慢。
    *   **闪烁问题**：在网络较慢时，用户可能会先看到无样式的页面，然后瞬间“跳变”成有样式的页面（FOUC）。
    *   **功能阉割**：无法使用复杂的构建时指令（如 `@apply` 的某些高级用法）或自定义构建插件。

### 💡 我该如何选择？

*   **如果你在开发正式项目**（无论是简单的博客还是复杂的后台管理系统）：
    👉 **请务必使用 `tailwindcss` (核心框架)**。虽然配置稍微麻烦一点（需要 `npm install`），但它带来的性能优势和开发体验是 CDN 无法比拟的。

*   **如果你只是想快速验证一个想法**，或者正在学习 Tailwind 语法，不想安装 Node.js 环境：
    👉 **可以使用 `tailwindcss-browser` (CDN)**。它能让你在几秒钟内就在 HTML 文件中用上 Tailwind 的类名，非常适合做 Demo。

**总结：** 不要把 `tailwindcss-browser` (CDN) 用于生产环境，它只是官方提供的一个“游乐场”，真正的开发请使用标准的构建流程。



- https://cdn.bootcdn.net/ajax/libs/tailwindcss-browser/4.1.13/index.global.min.js
- https://cdn.bootcdn.net/ajax/libs/tailwindcss-browser/4.1.13/index.global.js
