# Templates

本目录用于沉淀仓库级可复制模板，优先服务 `public/` 下的零构建静态页面开发。

## 当前模板
- `public-page-template/`：标准的 `public/` 页面脚手架，包含目录结构、ImportMaps 入口、样式拆分、模块入口和服务层示例。

## 使用建议
1. 复制 `public-page-template/` 到 `public/<new-page>/`。
2. 修改 `index.html` 标题、页面文案和 `js/services/` 里的业务数据源。
3. 保留 `G_VER`、动态样式加载和多文件 ESM 结构，不要回退到超大单 HTML。
4. 需要参考真实拆分案例时，查看 `public/importmap-refactor-demo/`。
