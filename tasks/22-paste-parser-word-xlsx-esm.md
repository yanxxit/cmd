# 22 Paste Parser Word XLSX ESM

## 背景
`public/paste-parser/word.html` 与 `public/paste-parser/xlsx.html` 仍使用单文件 HTML + 内联样式 + Vue 内联事件的旧模式，和当前 `paste-parser` 首页的原生 ESM 结构不一致，维护成本高，也不符合仓库对 `public/` 页面模块化的约束。

## 目标
- 保留现有 `word.html` 与 `xlsx.html` 访问路径。
- 将两页重构为轻壳 HTML + `css/` + `js/` 的原生 ESM 结构。
- 抽离可测试的纯逻辑模块，覆盖文件校验、统计和工作簿归一化。
- 不回退现有拖拽上传、文件信息、错误提示、统计卡片、工作表切换等核心能力。

## 计划
- [ ] 抽离 `word` 文件校验与统计模型
- [ ] 抽离 `xlsx` 文件校验、sheet 归一化与摘要模型
- [ ] 将 `word.html` 改为 ESM 入口并接入模块化渲染
- [ ] 将 `xlsx.html` 改为 ESM 入口并接入模块化渲染
- [ ] 完成定向单测、诊断与 `verify.sh` 验证
