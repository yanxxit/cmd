# Claude Code / Trae 配置

## 模式
- 当前仓库采用 `Harness Engineering Repo Baseline`。
- 启动时优先读取：`AGENTS.md` -> `docs/design.md` -> `tasks/*.md` -> `harness/README.md`。
- 若需要仓库摘要，执行 `bash harness/scripts/generate_context.sh`。

## 执行约定
- 代码改动遵循 TDD：先补最小测试，再实现；文档/配置任务允许只做校验，但要说明原因。
- 交付前默认运行 `bash harness/scripts/verify.sh`。
- 修改 Node/CLI/HTTP 逻辑时，补充执行最接近改动面的 `npm run test:*`。
- 文档、任务、决策要同步更新，不允许只改代码不回写上下文。
- 当任务落在 `public/` 目录且属于新增页面或迭代重构时，优先调用 `native-esm-importmaps` skill，将页面拆成多文件原生 ESM 模块，而不是继续堆大体积单 HTML。

## 仓库现实约束
- 主工程是 Node.js ESM 仓库，测试框架为 Vitest。
- 实际测试目录是 `test/`，不是 `tests/`。
- `docs/test-case-manager/` 已经存在一套完整 spec/tasks，可作为后续新功能的参考模板。
- `harness/` 目录承载仓库级 Harness 配置、脚本、skills 模板和概念说明。
- `public/` 下的大多数工具页是零构建静态页面，后续新增或迭代时应优先朝 `type="module"` + ImportMaps + 多文件拆分方向演进。

## 推荐工作流
1. 读取协议与设计文档。
2. 运行 `bash harness/scripts/generate_context.sh` 获取最新仓库上下文。
3. 在 `tasks/` 中记录当前任务或更新对应任务单。
4. 先写/补测试，再实施改动。
5. 运行 `bash harness/scripts/verify.sh`。
6. 将新增约束写入 `docs/decisions/`。
