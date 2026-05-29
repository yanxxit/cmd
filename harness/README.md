# Harness 目录说明

`harness/` 用于承载仓库级 Harness 资产，避免把流程约束散落在根目录文档中。

## 目录结构
- `concepts.md`：常用 Harness 概念与术语。
- `context/`：项目上下文快照与说明。
- `scripts/`：上下文生成、验证、辅助脚本。
- `skills/`：仓库自定义 skills 的模板与示例。
- `templates/`：仓库级页面脚手架与可复制模板。

## public/ 页面开发约定
- 对 `public/` 下新增的静态工具页，默认优先使用 `native-esm-importmaps` skill。
- 对 `public/` 下已有页面的中大型迭代，优先将单文件 HTML 重构为多文件原生 ESM 模块，使用 ImportMaps 或清晰的模块路径组织代码。
- 目标不是机械套用某种目录结构，而是避免“所有逻辑都塞进一个 HTML 文件”导致的阅读、调试和局部修改成本失控。
- 若页面已处于独立框架子工程中，例如 `next-app/`，则不强制使用该策略。
- 可复制模板位于 `harness/templates/public-page-template/`。
- 真实示例页面位于 `public/importmap-refactor-demo/`，用于演示复杂 HTML 的拆分方式。

## 推荐使用方式
1. 开始任务前先读 `AGENTS.md`、`CLAUDE.md`、`docs/design.md`。
2. 执行 `bash harness/scripts/generate_context.sh` 获取最新上下文。
3. 需要 repo 内技能时，从 `harness/skills/` 模板复制并定制。
4. 提交前执行 `bash harness/scripts/verify.sh`。
