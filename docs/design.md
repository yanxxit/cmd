# 仓库级设计说明

## 1. 目标
本仓库是一个以 Node.js ESM 为核心的多工具单仓项目，主要包含 CLI 工具、本地 Express 服务、零构建静态页面、Web IDE 页面，以及独立的 `next-app/` 子工程。仓库级 Harness 设计的目标是：

- 为所有新增任务提供统一的需求、设计、任务、验证和文档回写路径。
- 将分散在代码、测试、文档中的约定收拢到可读、可执行的仓库级基线。
- 为后续自定义 skills、上下文脚本和自动化检查提供固定目录。

## 2. 架构分层
### 2.1 CLI 与服务端
- `bin/`：CLI 入口，例如 `x-harness`、`x-dev`、`x-git`。
- `src/`：核心实现，包含 `harness/`、`http-server/`、`model/` 等模块。

### 2.2 前端工具层
- `public/`：原生 HTML/CSS/JS 页面、轻量前端工具、`web-ide-lite-v2` 等。
- `next-app/`：独立的 Next.js + TypeScript + antd 应用。
- `harness/templates/public-page-template/`：`public/` 静态页面的推荐脚手架。
- `public/importmap-refactor-demo/`：展示如何把复杂单 HTML 页面拆成多文件 ESM 模块的示例。

### 2.3 测试与验证层
- `test/`：Vitest 单测、脚本测试、性能测试。
- `harness/scripts/verify.sh`：仓库级统一验证入口。

### 2.4 文档与流程层
- `docs/`：设计、专题说明、决策记录。
- `tasks/`：当前阶段任务入口。
- `harness/`：Harness 概念、上下文生成、自定义 skills 模板。

## 3. Harness 基线
### 3.1 生命周期
所有非简单任务遵循以下阶段：
1. Requirement：明确目标、范围、约束。
2. Design：在 `docs/` 中落设计说明，必要时补 ADR。
3. Tasks：在 `tasks/` 或功能模块任务文档中拆解执行项。
4. Test：针对代码改动先补测试或先明确现有验证用例。
5. Implement：实施最小变更。
6. Verify：执行 `bash harness/scripts/verify.sh` 和目标测试。
7. Document：回写说明、决策和后续任务。

### 3.2 当前仓库策略
- 代码测试默认使用 Vitest。
- 文档/配置变更可以不新增测试，但必须经过脚本校验并在交付中说明。
- 模块级 spec/tasks 可放在对应 `docs/<feature>/` 目录下；仓库级入口统一挂在 `tasks/`。
- 对 `public/` 下新增或中大型迭代页面，优先采用原生 ESM + ImportMaps + 多文件拆分方案，避免继续膨胀单 HTML 文件。

## 4. 关键目录约定
- `docs/decisions/`：记录仓库级决策、流程变更、关键约束。
- `harness/context/`：项目上下文与生成结果。
- `harness/skills/`：仓库内自定义 skill 定义与模板。
- `harness/scripts/`：上下文生成、验证、辅助脚本。

## 5. 推荐交付物
每个中等以上任务建议至少具备以下产物：
- 任务入口：`tasks/*.md`
- 设计说明：`docs/design.md` 或功能子目录 spec
- 验证记录：测试命令/脚本输出
- 决策记录：如引入新约束，写入 `docs/decisions/*.md`
