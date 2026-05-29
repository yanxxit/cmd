# 00 Harness Foundation

## 背景
当前仓库已经具备 Harness 相关实现，但协议入口与实际目录不完全一致，需要补齐仓库级基础设施。

## 目标
- 对齐 `AGENTS.md`、`CLAUDE.md` 与真实目录结构。
- 建立 `harness/` 目录的基础骨架。
- 提供统一上下文生成脚本与验证脚本。
- 为后续自定义 skills 留出标准模板。

## 任务清单
- [x] 补齐 `docs/design.md`
- [x] 建立 `tasks/` 入口
- [x] 建立 `docs/decisions/` 决策记录
- [x] 创建 `harness/README.md`
- [x] 创建 `harness/concepts.md`
- [x] 创建 `harness/scripts/generate_context.sh`
- [x] 创建 `harness/scripts/verify.sh`
- [x] 创建 `harness/skills/` 模板与示例
- [x] 创建 `harness/templates/public-page-template/`
- [x] 创建 `public/importmap-refactor-demo/` 作为规则示例页面
- [ ] 后续根据实际自动化需要补充更细的 repo skill 与脚本

## 验收标准
- `AGENTS.md` 与 `CLAUDE.md` 引用的关键路径全部存在。
- `bash harness/scripts/generate_context.sh` 可生成上下文文件。
- `bash harness/scripts/verify.sh` 可完成基础校验。
