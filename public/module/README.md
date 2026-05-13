# 纯原生 ESM + ImportMaps 完整整套解决方案
（无编译、无Webpack/Vite、无RequireJS、纯HTML原生、支持**自定义JS+第三方CDN+自动版本号防缓存+依赖管理+全局别名**）
适配你需求：
- 全程 `type="module"`、`type="importmap"` 原生标准
- 管理第三方插件 + 自己写的自定义JS
- 自动给所有模块加**时间戳版本号**防浏览器缓存
- 统一别名、不用写长路径
- 模块隔离不污染全局、依赖自动加载

## 一、整体架构特点
1. 用 **ImportMaps** 统一管理所有模块别名（第三方库 + 本地自定义JS）
2. 全部脚本走 **type="module"** 原生模块化
3. 封装**自动拼接版本号**，解决ESM浏览器缓存
4. 自定义JS用 `export/import` 标准语法
5. 无需任何构建工具、直接开HTML就能跑

## 二、完整目录结构
```
index.html
js/
  utils.js      # 自定义工具模块
  api.js        # 接口请求模块
  business.js   # 业务逻辑模块
```

## 三、核心实现（可直接复制整套运行）
### 1. 入口页面 index.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>原生ESM完整方案</title>

  <!-- 1、全局版本号：时间戳，统一防缓存 -->
  <script>
    // 每次刷新生成全新时间戳
    const G_VER = Date.now();
    // 封装路径加版本号方法，全局可用
    window.getModuleUrl = (path) => `${path}?v=${G_VER}`;
  </script>

  <!-- 2、原生 ImportMaps：统一别名配置 -->
  <script type="importmap">
  {
    "imports": {
      // 第三方CDN库别名
      "jquery": "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js",
      "axios": "https://cdn.jsdelivr.net/npm/axios@1.7.2/dist/axios.min.js",

      // 本地自定义JS别名（后面用方法拼接版本号）
      "@utils": "./js/utils.js",
      "@api": "./js/api.js",
      "@business": "./js/business.js"
    }
  }
  </script>

  <!-- 3、业务入口模块 -->
  <script type="module">
    // 引入第三方库
    import $ from 'jquery';
    import axios from 'axios';

    // 引入本地自定义模块，并自动拼接版本号防缓存
    import { formatTime } from window.getModuleUrl("@utils");
    import { getUserInfo } from window.getModuleUrl("@api");
    import { initPage } from window.getModuleUrl("@business");

    // 业务调用
    console.log("当前时间：", formatTime());
    initPage();

    // 测试jQuery
    $(() => {
      document.body.innerHTML += "<div style='color:red'>原生ESM加载成功</div>";
    });
  </script>
</head>
<body>
</body>
</html>
```

### 2. 自定义模块示例
#### js/utils.js
```javascript
// 工具类模块
export function formatTime() {
  return new Date().toLocaleString();
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

#### js/api.js
```javascript
// 接口模块
export function getUserInfo() {
  return { id: 1001, name: "测试用户" };
}
```

#### js/business.js
```javascript
// 业务模块
import { formatTime } from "./utils.js?v=" + Date.now();

export function initPage() {
  console.log("页面初始化完成", formatTime());
}
```

## 四、关键规则 & 最佳实践
### 1. ImportMaps 使用规则
- 只配置**裸别名**：`jquery`、`@utils`
- 不要在importmap里写版本号，统一在 `getModuleUrl` 里动态加
- 支持绝对路径、相对路径、CDN地址

### 2. ESM 模块特点
- 所有 `type="module"` 脚本**默认隔离作用域**，不污染window
- 模块内变量不会泄露到全局
- 支持标准 `export / import`
- 支持顶层 `await`

### 3. 缓存解决方案原理
- 固定一个全局时间戳 `G_VER`
- 所有**本地自定义模块**通过 `getModuleUrl(别名)` 自动拼接 `?v=时间戳`
- 每次刷新版本号变，浏览器强制加载新JS，彻底清缓存
- CDN第三方库本身有缓存策略，可不加版本号

### 4. 模块之间互相引用
在自定义JS内部互相import，也要加版本号：
```js
// business.js 内部引用 utils
import { formatTime } from "./utils.js?v=" + Date.now();
```

## 五、替代 RequireJS 的核心优势
1. **浏览器原生标准**，不用引入任何库
2. 原生支持依赖解析、无需手动管理加载顺序
3. ImportMaps 等价于 RequireJS 的 `config` 路径配置
4. 自带模块化隔离，无全局变量污染
5. 可无缝加时间戳版本号，完美解决缓存
6. 写法是标准ES6，学习成本极低

## 六、扩展增强（可选）
我可以给你再加：
1. 支持**懒加载模块** `import()` 动态引入
2. 封装统一模块加载器，不用每次手写 getModuleUrl
3. 固定版本号（打包构建用固定版本，开发用时间戳）
4. 兼容低版本浏览器的降级方案

需要我给你升级成**懒加载+固定版本/时间戳双模式**完整版吗？