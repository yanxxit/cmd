# Repo Context Scan Flow

1. 读取 `AGENTS.md`、`CLAUDE.md`、`docs/design.md`、`tasks/*.md`。
2. 执行 `bash harness/scripts/generate_context.sh`。
3. 扫描目标模块的源码、测试和文档。
4. 输出结构化摘要：范围、关键文件、验证建议、风险点。
5. 若发现仓库级新约束，提醒补充 ADR。
