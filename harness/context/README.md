# Context 目录说明

本目录存放仓库级上下文文件。

## 文件约定
- `project-context.md`：人工维护的稳定摘要。
- `generated-context.md`：由 `bash harness/scripts/generate_context.sh` 自动生成。

## 使用建议
- 稳定规则放 `project-context.md`
- 目录、脚本、测试入口等易变信息放 `generated-context.md`
