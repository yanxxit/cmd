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