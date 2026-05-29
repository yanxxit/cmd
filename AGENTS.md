# AGENTS.md - Harness Engineering 协议（Repo Baseline）

## 致命规则（必须遵守）
1. 所有非简单任务都按 Harness 流程推进：需求 -> 设计 -> 任务拆解 -> 测试 -> 实现 -> 验证 -> 文档。
2. 涉及代码变更时默认遵循 TDD：先补或先写最小可证明测试，再实现；仅文档/配置变更可不新增测试，但必须在交付说明中写明原因。
3. 每次开始任务前，先读取 `CLAUDE.md`、`docs/design.md`、`tasks/` 下全部任务文件，以及目标模块对应文档。
4. 每次交付前，至少执行 `bash harness/scripts/verify.sh`；若修改运行时代码，还要补充执行最相关的 `npm run test:*`。
5. 重要约束、目录规范、流程变更，必须记录到 `docs/decisions/`。

## 工作准则
- 用结构化输出，先说明结论、风险、下一步。
- 优先小步提交，按垂直切片推进，避免大爆炸式改动。
- 遇到不确定，先查文档、测试和现有实现，不猜测。
- 优先复用仓库已有模式：`test/` 为测试目录，`docs/test-case-manager/` 是现成的 spec/tasks 示例。
- 生成项目上下文时，使用 `bash harness/scripts/generate_context.sh`。

## 本仓库实际结构
- `src/`：Node.js/Express/CLI 核心源码。
- `public/`：零构建静态工具页面与 Web IDE 页面。
- `test/`：Vitest 与脚本测试；当前仓库使用 `test/`，不是 `tests/`。
- `docs/`：设计、专题文档、决策记录。
- `tasks/`：仓库级任务拆解，聚合当前阶段任务入口。
- `scripts/`：现有业务/数据脚本。
- `harness/`：Harness 规范、上下文脚本、自定义 skills、验证脚本。
- `next-app/`：独立的 Next.js 子工程。

## 任务启动清单
1. 阅读入口协议：`AGENTS.md`、`CLAUDE.md`。
2. 阅读仓库设计：`docs/design.md`。
3. 阅读任务清单：`tasks/*.md`。
4. 如需上下文摘要，执行 `bash harness/scripts/generate_context.sh`。
5. 确认本次变更的验证范围，并在实施前写清楚。

## 验证基线
- 默认验证：`bash harness/scripts/verify.sh`
- 全量测试：`npm test`
- 快速测试：`npm run test:fast`
- 覆盖率：`npm run test:coverage`
- Harness 相关测试：`npm run test:fast -- --run test/harness.vitest.test.js`
