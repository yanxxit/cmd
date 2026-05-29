# Harness 目录说明

`harness/` 用于承载仓库级 Harness 资产，避免把流程约束散落在根目录文档中。

## 目录结构
- `concepts.md`：常用 Harness 概念与术语。
- `context/`：项目上下文快照与说明。
- `scripts/`：上下文生成、验证、辅助脚本。
- `skills/`：仓库自定义 skills 的模板与示例。

## 推荐使用方式
1. 开始任务前先读 `AGENTS.md`、`CLAUDE.md`、`docs/design.md`。
2. 执行 `bash harness/scripts/generate_context.sh` 获取最新上下文。
3. 需要 repo 内技能时，从 `harness/skills/` 模板复制并定制。
4. 提交前执行 `bash harness/scripts/verify.sh`。
