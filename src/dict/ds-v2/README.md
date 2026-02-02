# 屌丝词典 v2 (DS-V2)

一个由屌丝制作，为了屌丝的词典 - v2 版本，使用 LevelDB 存储数据

## 介绍

这是原始 Python "屌丝词典" 项目的 Node.js 实现的升级版。v2 版本使用 LevelDB 作为存储后端，提供更快的数据访问速度和更高效的存储机制。

词典包含超过 17 万个英汉词汇对，并提供快速搜索功能和拼写纠正能力。

## 新增特性

1. **LevelDB 存储**：使用 LevelDB 作为持久化存储，提供高性能读写操作
2. **持久化数据**：数据保存在磁盘上，重启后数据不会丢失
3. **保持原有功能**：继承了 v1 版本的所有功能，包括前缀搜索和拼写纠正

## 功能特性

1. **大词汇量**：包含超过 17 万个英汉词汇对
2. **快速搜索**：基于前缀的快速单词查找
3. **拼写纠正**：自动为拼错的单词推荐相似词
4. **双重界面**：同时提供命令行和网页界面
5. **跨平台**：可在 Windows、macOS 和 Linux 上运行

## 安装

确保已经安装了项目依赖：

```bash
cd /path/to/your/project
pnpm install  # 或 npm install
```

## 初始化

如果词典数据库尚不存在，请先导入数据：

```bash
node src/dict/ds-v2/import-data.js
```

## 使用方法

### 命令行界面

1. **单次查询**：
   ```bash
   node src/dict/ds-v2/src/index.js hello
   ```

2. **交互模式**：
   ```bash
   node src/dict/ds-v2/src/index.js
   ```
   然后可以交互式地输入要查询的单词。

### 网页界面

1. 启动 Web 服务器：
   ```bash
   node src/dict/ds-v2/src/server.js
   # 或使用 npm script (如果在模块目录下)
   npm run web
   ```

2. 在浏览器中打开 `http://localhost:3000`

## 项目结构

```
ds-v2/
├── package.json         # 项目元数据和依赖
├── import-data.js       # 数据导入脚本
├── performance-test.js  # 性能测试脚本
├── data/
│   └── dictionary-db/   # LevelDB 数据库目录
├── public/
│   └── index.html       # 网页界面
└── src/
    ├── dictionary.js    # 核心词典功能（基于 LevelDB）
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
- 从 LevelDB 加载和查询词典数据
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

- 应用程序使用 ES 模块，package.json 中设置 `"type": "module"`
- 使用 Node.js 的 `path` 和 `url` 模块处理跨平台的文件路径
- 使用 LevelDB 作为持久化存储解决方案，提供快速键值对访问