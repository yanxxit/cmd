# Project Context

## 仓库摘要
- 仓库类型：Node.js ESM 多工具单仓
- 主要能力：CLI 工具、本地 Express 服务、静态 Web 工具、Web IDE、独立 Next.js 子应用
- 主要测试：Vitest，测试目录为 `test/`
- `public/` 下存在大量零构建静态页面，后续新增或迭代修改时应优先使用 `native-esm-importmaps` skill 做多文件 ESM 拆分，避免继续扩大单 HTML 文件复杂度。

## Harness 相关实现
- CLI：`bin/harness.js`
- 运行时：`src/harness/index.js`
- HTTP 接口：`src/http-server/harness-api.js`
- 前端集成：`public/web-ide-lite-v2/js/actions/harness-actions.js`
- 测试：`test/harness.vitest.test.js` 与 `test/harness/`

## 已有规范示例
- `docs/test-case-manager/spec.md`
- `docs/test-case-manager/tasks.md`
