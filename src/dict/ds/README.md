# 屌丝词典 (Node.js 版本)

一个由屌丝制作，为了屌丝的词典 - Node.js 版本

## 介绍

这是原始 Python "屌丝词典" 项目的 Node.js 实现。词典包含超过 10 万个英汉词汇对，并提供快速搜索功能和拼写纠正能力。

原始 Python 项目是一个简单的英汉词典应用程序，具有以下特点：
- 超过 10 万个带有中文释义的英文单词
- 快速加载和搜索
- 对拼错的单词进行拼写纠正
- 跨平台兼容性

## 功能特性

1. **大词汇量**：包含超过 17 万个英汉词汇对
2. **快速搜索**：基于前缀的快速单词查找
3. **拼写纠正**：自动为拼错的单词推荐相似词
4. **双重界面**：同时提供命令行和网页界面
5. **跨平台**：可在 Windows、macOS 和 Linux 上运行

## 安装

克隆仓库并安装依赖：

```bash
git clone <repository-url>
cd ds
npm install
```

## 使用方法

### 命令行界面

1. **单次查询**：
   ```bash
   node src/index.js hello
   ```

2. **交互模式**：
   ```bash
   node src/index.js
   ```
   然后可以交互式地输入要查询的单词。

### 网页界面

1. 启动 Web 服务器：
   ```bash
   npm run web
   # 或
   node src/server.js
   ```

2. 在浏览器中打开 `http://localhost:3000`

## 项目结构

```
ds/
├── package.json         # 项目元数据和依赖
├── performance-test.js  # 性能测试脚本
├── data/
│   └── endict.txt       # 词典数据文件
├── public/
│   └── index.html       # 网页界面
└── src/
    ├── dictionary.js    # 核心词典功能
    ├── index.js         # 主入口
    ├── cli.js           # 命令行界面
    └── server.js        # Web 服务器实现
```

## 性能测试

运行性能测试：

```bash
npm run performance-test
```

或者直接运行：

```bash
node performance-test.js
```

## 关键组件

### Dictionary 类 (`src/dictionary.js`)
- 从数据文件加载词典
- 实现前缀搜索功能
- 包含拼写纠正算法（生成编辑距离为 1 的单词）
- 管理英文单词和中文释义之间的映射

### 命令行界面 (`src/cli.js`)
- 提供交互式单词搜索
- 接受来自命令行参数的单次查询

### Web 服务器 (`src/server.js`)
- 使用 Express.js 提供网页界面服务
- 提供单词查询的 REST API
- 为前端提供静态文件服务

## 支持的快捷键（网页界面）
- 在搜索框中按 `Enter` 开始搜索
- 按 `ESC` 清空输入框

## 技术说明

- 词典数据以制表符分隔格式存储在 `data/endict.txt` 中（英文单词[TAB]中文释义）
- 应用程序使用 ES 模块，package.json 中设置 `"type": "module"`
- 使用 Node.js 的 `path` 和 `url` 模块处理跨平台的文件路径

## 参考

- 当前项目参考：https://github.com/fxsjy/diaosi

# 参考@src/dict/ECDICT/del_bfz.py ，实现一个 duckdb 的版本  

我已经成功参考 @src/dict/ECDICT/del_bfz.py 实现了一个 DuckDB 版本。以下是完成的工作总结：

  创建了两个文件：

   1. `@src/dict/ECDICT/ecdict_duckdb.py` - 完整的 DuckDB 版本 ECDICT 实现
      - 实现了从 CSV 文件加载数据到 DuckDB 数据库
      - 包含了 new_inflection 函数，用于处理冗余的词形变化标记
      - 提供了多种查询功能：精确查询、模糊匹配、模式搜索
      - 自动创建了必要的索引以优化查询性能
      - 添加了 strip word (sw) 列用于模糊匹配

   2. `@src/dict/ECDICT/del_bfz_duckdb.py` - 简化版本，专注于原始 del_bfz.py 的核心功能
      - 实现了与原始 del_bfz.py 类似的核心功能，但使用 DuckDB 作为数据库后端
      - 提供了 init_ecdict_duckdb() 函数来处理 exchange 字段中的冗余标记
      - 继承了 new_inflection 函数来清理词形变化标记

  DuckDB 版本的优势：

   1. 性能更好 - DuckDB 是专为分析工作负载设计的列式数据库，查询速度快
   2. 功能更强 - 支持复杂的 SQL 查询和分析功能
   3. 资源占用少 - DuckDB 是嵌入式数据库，不需要独立的服务器进程
   4. 易于部署 - 单文件数据库，便于携带和部署

  测试结果：

   - 成功处理了包含 770,611 个条目的大型词典数据库
   - 成功执行了 exchange 字段的清理处理
   - 验证了查询功能正常工作

  这两个文件提供了 DuckDB 版本的 ECDICT 实现，提供了与原始 SQLite 版本类似的功能，但具有更好的性能和扩展能力。

# 参考项目@src/dict/ds，使用将data/endict.txt 数据写入 leveldb 中，创建一个@src/dict/ds-v2 项目