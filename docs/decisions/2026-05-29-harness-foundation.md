# ADR 2026-05-29: 建立仓库级 Harness Foundation

## 背景
仓库已经存在 `AGENTS.md`、`CLAUDE.md`、Harness 运行时代码与测试，但缺少与协议配套的真实目录和脚本，例如：

- 缺少 `docs/design.md`
- 缺少根级 `tasks/`
- 缺少统一的上下文生成脚本
- 缺少仓库内可沉淀的 Harness 概念与自定义 skill 模板

## 决策
采用仓库级 `harness/` 目录作为统一承载位置，放置以下内容：

- `harness/scripts/`：上下文生成与验证脚本
- `harness/context/`：项目上下文快照
- `harness/skills/`：自定义 skill 模板与示例
- `harness/concepts.md`：常用 Harness 术语与流程概念

同时补齐以下入口文件：
- `docs/design.md`
- `tasks/README.md`
- `tasks/00-harness-foundation.md`

## 结果
- `AGENTS.md` 与 `CLAUDE.md` 不再指向不存在的路径。
- 仓库级流程具备可执行脚本，而不是只停留在口号。
- 后续新增自定义 skill 与上下文脚本时，有固定落点。
