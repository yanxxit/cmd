# 23 Paste Parser URL ESM

## 背景
`public/paste-parser/url.html` 与 `public/paste-parser/url-edit.html` 仍使用单文件 HTML、内联样式和 Vue 模板指令，不符合当前 `paste-parser` 子模块已经建立的原生 ESM 结构，也导致 URL 解析、测试案例和 URL 构建逻辑难以复用。

## 目标
- 保留现有 `url.html` 与 `url-edit.html` 访问路径。
- 将两页重构为轻壳 HTML + `css/` + `js/` 的原生 ESM 结构。
- 抽离共享 URL 服务层，复用测试案例、解析与组装逻辑。
- 不回退当前 URL 解析、测试案例加载、Query/Hash 参数编辑、复制结果等核心能力。

## 计划
- [ ] 抽离 URL 解析与 URL 构建纯逻辑
- [ ] 抽离 URL 工具共享测试案例数据
- [ ] 将 `url.html` 改为 ESM 入口并接入模块化渲染
- [ ] 将 `url-edit.html` 改为 ESM 入口并接入模块化渲染
- [ ] 完成定向单测、诊断与 `verify.sh` 验证
