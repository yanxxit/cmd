# bun

## 使用 Bun 内置的开发服务器（推荐）
这是更正规的做法，利用 Bun 内置的 Bundler 功能，支持热更新（HMR）。
(Bun 会自动创建 package.json 和基础文件结构)

```sh
# 初始化项目
bun init --react

# 启动开发服务器
bun index.html

# 或者使用专门的开发命令：
bun run --hot index.html
# --hot 参数会开启 Bun 的原生热重载功能，修改代码后页面会瞬间刷新，速度极快。

```