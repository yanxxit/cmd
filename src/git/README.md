# Git 稀疏检出工具集

这组脚本实现了 Git 稀疏检出（Sparse Clone）功能，可以只下载 Git 仓库中的特定文件或文件夹，从而节省带宽和时间。

## 脚本说明

### sparseClone.js

基础版稀疏克隆脚本，硬编码了仓库地址和目标路径：

```bash
node sparseClone.js
# 克隆目录
x-clone-dir
```

### sparseCloneWithArgs.js

增强版稀疏克隆脚本，支持命令行参数：

```bash
# x-tool.git clone --branch develop --target-path vim --local-dir temp
# x-git -u https://gitee.com/yanxxit/conf.git -b main -t vim
node sparseCloneWithArgs.js -u <仓库URL> -b <分支名> -t <目标路径> -d <本地目录> -o <输出目录> -v
```

参数说明：
- `-u, --repo-url <url>`: 远程仓库地址，默认为 `https://gitee.com/yanxxit/conf.git`
- `-b, --branch <branch>`: 分支名称，默认为 `main`
- `-t, --target-path <path>`: 想要拉取的特定文件或文件夹名，默认为 `vim`
- `-d, --local-dir <dir>`: 本地文件夹名称，如果不指定则使用临时目录
- `-o, --output-dir <dir>`: 最终输出目录，默认为当前脚本执行位置（即 `.`）
- `-v, --verbose`: 显示详细输出

### sparseCloneWithMinimist.js

使用 minimist 库解析命令行参数的版本：

```bash
node sparseCloneWithMinimist.js --repoUrl <仓库URL> --branch <分支名> --targetPath <目标路径>
```

### interactiveSparseClone.js

交互式稀疏克隆脚本，可浏览远程仓库目录结构并选择要下载的文件或目录：

```bash
node interactiveSparseClone.js -u <仓库URL> -b <分支名> -o <输出目录> -v
node interactiveSparseClone.js -u https://gitee.com/yanxxit/conf.git -o linux -v
```

参数说明：
- `-u, --repo-url <url>`: 远程仓库地址，默认为 `https://gitee.com/yanxxit/conf.git`
- `-b, --branch <branch>`: 分支名称，默认为 `main`
- `-o, --output-dir <dir>`: 最终输出目录，默认为当前脚本执行位置
- `-v, --verbose`: 显示详细输出

### sparse_clone.sh

Shell 脚本版本，实现相同功能：

```bash
bash sparse_clone.sh <仓库URL> <分支名> <目标路径>
```

## 使用示例

拉取远程仓库的 vim 配置到当前目录：

```bash
node sparseCloneWithArgs.js -t vim -o .
```

拉取特定分支的配置文件：

```bash
node sparseCloneWithArgs.js -u https://github.com/user/repo.git -b develop -t config -o ./output
```