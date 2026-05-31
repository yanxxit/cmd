# 21 Paste Parser Rich Markdown Export

## 背景
`public/paste-parser/` 当前主页仍是单文件 HTML + 单文件脚本实现。富文本结果只支持 HTML 预览与复制，无法直接复制 Markdown，也无法把富文本里的图片和 Markdown 一并导出，导致从飞书、文档、网页内容粘贴后仍需手工整理。

## 目标
- 将 `public/paste-parser/index.html` 迁移为 `index.html + css/ + js/` 的原生 ESM 结构。
- 为富文本结果增加 Markdown 视图与“复制 Markdown”能力。
- 支持把富文本中的 Markdown 与图片资源一起导出为 ZIP 压缩包。
- 保持现有表格、JSON、XML、URL、JWT 等类型的识别与展示能力不回退。

## 计划
- [ ] 抽离富文本 Markdown 转换与图片资源收集逻辑，并补 Vitest 单测
- [ ] 将主页样式拆分到 `css/`，脚本拆分到 `js/` 模块
- [ ] 为富文本结果区新增 Markdown 源码面板、复制按钮和 ZIP 导出按钮
- [ ] 保留现有页面路径与导航入口
- [ ] 完成目标测试与仓库级验证
