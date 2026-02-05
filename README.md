# cmd xtools
node.js 开发常用的命令行工具，日常使用。

## 实现功能
- [x] 开启静态服务
- [x] 实现自定义代理
- [x] md5
- [x] 常用时间转换：tool time
- [x] cal 日历
- [x] say命令
- [ ] 读书工具
- [x] 翻译-有道
    - [x] 记录到本地，避免重复请求
    - [x] 从本地数据库获取翻译
    - [x] 记录到本地json 文件
    - [ ] 记录到本地数据库，MySQL 获取其他数据库
    - [ ] 请求日志：word,created
    - [ ] 提供一个页面，提供维护页面
- [ ] socke.io 测试页面
- [ ] 简单的http模块
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
- [ ] github 代码加速下载
- [ ] 开发环境，下载并安装，并统一配置。先从配置入手。
- [x] 实现命令行的 markdown 查看器
- [x] 实现命令行使用浏览器方式打开 markdown文件
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

### 本地开发

```js
npm link
```
接下来剩下的就是测试了，对于测试来说不需要把安装包推到`npm`中，`npm`为了方便，提供了`npm link`命令，可以实现`预发布`。在项目根目录中使用`npm link`没有报错的话，就说明推送成功了。现在就可以在全局中使用`q-init`了。

在全局中使用`initP -h`命令，能够输出所编译的`help`信息就说明可以初始化项目了。

