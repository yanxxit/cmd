# pglite

## 安装

```bash
npm install @electric-sql/pglite
# 安装工具包，用于导出数据库结构
npm install @electric-sql/pglite-tools

import { pgDump } from '@electric-sql/pglite-tools';

// 假设 db 是你已经初始化的 PGlite 实例
const dump = await pgDump(db);
console.log(dump); // 输出 SQL 脚本，你可以复制到任何 PostgreSQL 客户端运行
```

## vscode 插件
- PGlite Explorer: 用于在 VSCode 中浏览 PGlite 数据库的插件，支持查询、执行 SQL 语句、查看表结构等功能。