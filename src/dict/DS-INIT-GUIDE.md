# 屌丝字典初始化工具

## 概述

已成功为 `ds.js` 添加了初始化命令，可以从 GitHub 自动下载词典数据文件 `endict.txt`。

## 使用方法

### 1. 初始化词典数据

首次使用前需要下载词典数据：

```bash
# 基本用法
ds init

# 显示详细输出
ds init --verbose

# 使用别名
ds i
ds install
```

### 2. 查询单词

```bash
# 查询单词
ds lookup hello

# 使用别名
ds l hello
ds query hello
```

### 3. 启动交互式命令行

```bash
ds cli
```

### 4. 启动 Web 服务器

```bash
ds serve
ds serve -p 8080  # 指定端口
```

## 功能特性

### ✅ 自动下载
- 从 GitHub 仓库 `https://github.com/fxsjy/diaosi.git` 下载
- 文件大小：约 9.6 MB
- 包含 176,798 条词典记录

### ✅ 智能检测
- 自动检测文件是否已存在
- 避免重复下载
- 数据文件路径：`src/dict/ds/data/endict.txt`

### ✅ 数据验证
- 查询前自动检查数据文件
- 友好的错误提示
- 引导用户执行初始化

### ✅ 多种下载方式
1. **Git 克隆**（首选）- 使用 `git clone --depth 1`
2. **HTTP 下载**（备用）- 使用 `curl` 或 `PowerShell`

## 下载流程

```
1. 检查数据目录是否存在
   ↓
2. 检查文件是否已存在
   ↓
3. 创建临时目录
   ↓
4. Git 克隆仓库（浅克隆）
   ↓
5. 复制 endict.txt 文件
   ↓
6. 清理临时目录
   ↓
7. 显示统计信息
```

## 输出示例

### 成功初始化
```
📥 开始下载词典数据...
仓库：https://github.com/fxsjy/diaosi.git
目标：/Users/bytedance/github/cmd/src/dict/ds/data/endict.txt

- 正在克隆仓库...
✔ 词典数据下载完成

✅ 初始化完成！
──────────────────────────────────────────────────
文件路径：/Users/bytedance/github/cmd/src/dict/ds/data/endict.txt
文件大小：9.58 MB
最后修改：2026/4/7 07:31:07
──────────────────────────────────────────────────

使用方法:
  ds lookup <word>     - 查询单词
  ds cli               - 交互式命令行
  ds serve             - 启动 Web 服务器
```

### 文件已存在
```
⚠️  词典文件已存在
路径：/Users/bytedance/github/cmd/src/dict/ds/data/endict.txt
如需重新下载，请先删除现有文件
```

### 数据未初始化
```
⚠️  词典数据未初始化
请先运行：ds init
```

## 技术实现

### 文件结构
```
src/dict/
├── ds-init.js          # 初始化工具（新增）
└── ds/
    ├── data/
    │   └── endict.txt  # 词典数据（自动下载）
    └── src/
        └── dictionary.js
```

### 核心函数

#### initDictionary(options)
```javascript
// 初始化词典数据
await initDictionary({ verbose: true });
```

#### checkDictionaryExists()
```javascript
// 检查词典文件是否存在
const exists = checkDictionaryExists();
```

#### getDictionaryInfo()
```javascript
// 获取词典文件信息
const info = getDictionaryInfo();
// { path, size, sizeMB, modified }
```

## 命令集成

已将所有需要数据的命令集成初始化检查：

- ✅ `ds lookup` - 查询前检查
- ✅ `ds cli` - 启动前检查
- ✅ `ds serve` - 启动前检查
- ✅ `ds init` - 独立初始化命令

## 错误处理

### Git 未安装
```
提示:
  1. 确保已安装 Git
  2. 检查网络连接
  3. 使用 -v 参数查看详细错误信息
  4. 或手动下载文件到上述路径
```

### 网络错误
自动切换到备用下载方式（HTTP 直接下载）

### 文件损坏
删除现有文件后重新运行 `ds init`

## 性能优化

- **浅克隆**：使用 `--depth 1` 只下载最新版本
- **临时目录**：在数据目录中创建临时目录，下载完成后清理
- **智能检测**：避免重复下载

## 相关资源

- **原始仓库**: https://github.com/fxsjy/diaosi.git
- **词典大小**: ~9.6 MB
- **词条数量**: 176,798 条
- **支持语言**: 中英文互译

## 注意事项

1. **首次使用必须初始化**：运行任何查询命令前需要先初始化
2. **网络连接**：需要能够访问 GitHub
3. **磁盘空间**：需要约 10 MB 磁盘空间
4. **Git 依赖**：推荐安装 Git 以获得最佳下载体验

## 开发指南

### 添加新的数据源
```javascript
const DICT_REPO = 'https://github.com/your-repo/dictionary.git';
```

### 自定义下载路径
```javascript
const DATA_DIR = path.join(__dirname, 'custom', 'path');
```

### 添加数据验证
```javascript
function validateDictionary() {
  // 验证文件格式
}
```

## 更新词典

目前不支持直接更新，如需更新词典数据：

```bash
# 1. 删除现有文件
rm src/dict/ds/data/endict.txt

# 2. 重新下载
ds init
```

## 故障排除

### 下载速度慢
- 使用镜像站点或代理
- 或手动下载文件到指定路径

### 权限错误
确保对 `src/dict/ds/data` 目录有写权限

### 文件校验
```bash
# 查看文件信息
ls -lh src/dict/ds/data/endict.txt

# 查看行数
wc -l src/dict/ds/data/endict.txt
# 应该输出约 176798 行
```

## 总结

✅ **已完成**
- 添加 `init` 命令
- 自动下载词典数据
- 智能检测和错误处理
- 集成到所有相关命令
- 友好的用户提示

🎉 **使用简单**
```bash
ds init          # 初始化
ds lookup hello  # 查询
```
