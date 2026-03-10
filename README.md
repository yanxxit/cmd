# cmd xtools
node.js 开发常用的命令行工具，日常使用。

## 实现功能
- [x] 开启静态服务
- [x] 本地文件查看器（Web 页面）
- [x] 实现自定义代理
- [x] md5
- [x] 常用时间转换：tool time
- [x] cal 日历
- [x] say 命令
- [ ] 读书工具
- [x] 翻译 - 有道
    - [x] 记录到本地，避免重复请求
    - [x] 从本地数据库获取翻译
    - [x] 记录到本地 json 文件
    - [ ] 记录到本地数据库，MySQL 获取其他数据库
    - [ ] 请求日志：word,created
    - [ ] 提供一个页面，提供维护页面
- [ ] socke.io 测试页面
- [ ] 简单的 http 模块
- [ ] 图片压缩
- [ ] json 转换（非标准的转换为标准）
- [x] AI Ask 助手
- [x] git 稀疏克隆 下载指定目录
- [x] git 完整克隆 - 下载完整仓库
- [x] 将代码改成 module 模式 重构
- [ ] 将代码使用 typescript 重构
- [ ] skill 下载
- [ ] 是否要集成 python 相关脚本
- [ ] 校验网络，测试网速？
- [x] github 代码加速下载
    - [x] 使用 git clone --depth 1 只克隆最近的提交，而不是完整的历史记录。
    - [x] git clone 时，检查 github 网络，如果无法访问 github 时，则切换到其他镜像站点。
    - [x] 优先尝试 https://kgithub.com 和 https://ghproxy.com/github.com 方案
    - [x] 推荐方案：使用 giteee 或者 gitcode
    - [x] https://gitee.com/organizations/mirrors/projects
    - [x] https://gitee.com/mirrors/everything-claude-code
- [ ] github Release / ZIP / Raw 文件 文件下载
- [ ] 开发环境，下载并安装，并统一配置。先从配置入手。
- [x] 实现命令行的 markdown 查看器
- [x] 实现命令行使用浏览器方式打开 markdown 文件
- [x] 清理当前目录下所有的 node_modules 目录
- [ ] 实现目录下文件查询：类似 find 或者 rg 命令


## 使用
```sh
x-tool
$ node bin/git-clone.js https://gitee.com/yanxxit/conf.git
node bin/git-clone.js https://github.com/yanxxit/conf.git conf2
node bin/git-clone.js https://github.com/yanxxit/node-module-study.git

git clone https://github.com/yanxxit/node-module-study.git
```

### 新增功能：Git Clone

使用 `x-git-clone` 命令克隆 Git 仓库：

```sh
# 基本用法
x-git-clone <repository-url> [destination]

# 示例
x-git-clone https://github.com/user/repo.git
x-git-clone git@github.com:user/repo.git
x-git-clone user/repo  # GitHub 简写格式

# 克隆特定分支
x-git-clone <repository-url> -b <branch-name>

# 创建浅克隆（只克隆最近的提交）
x-git-clone <repository-url> --depth 1

# 克隆单一分支
x-git-clone <repository-url> --single-branch
```

### 本地文件查看器

使用 `x-static` 或 `x-file-viewer` 命令启动本地文件查看器服务：

```sh
# 启动静态文件服务（默认当前目录）
x-static

# 指定目录
x-static ./my-project

# 指定端口
x-static -p 8080

# 指定目录和端口
x-static ./my-project -p 8080
```

启动后访问 `http://127.0.0.1:3000/file-viewer/` 即可使用文件查看器。

**功能特性：**
- 📁 展示当前目录文件列表
- 📂 支持点击进入子目录
- 📄 查看文件内容（支持文本文件预览）
- ⬇️ 下载文件
- 🔙 返回上级目录
- 🌙 支持深色/浅色主题切换
- 📱 响应式设计，支持移动端

**安全特性：**
- 限制访问范围在启动目录及其子目录
- 防止路径遍历攻击
- 敏感文件过滤（.env 等）
- 大文件限制预览（>1MB）
- 二进制文件无法预览

### 本地开发

```js
npm link
```
接下来剩下的就是测试了，对于测试来说不需要把安装包推到 `npm` 中，`npm` 为了方便，提供了 `npm link` 命令，可以实现 `预发布`。在项目根目录中使用 `npm link` 没有报错的话，就说明推送成功了。现在就可以在全局中使用 `q-init` 了。

在全局中使用 `initP -h` 命令，能够输出所编译的 `help` 信息就说明可以初始化项目了。


### 初始化数据

- 拉取 github 资源
  - 离线词典
  - 离线古诗词
  - 离线的一些数据
- 开发常用：
  - 开启一个模拟服务器
    - 实现一个类似 http 测试接口
    - 实现一个类似 httpserver

