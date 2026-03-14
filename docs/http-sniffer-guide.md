# HTTP Sniffer - 浏览器请求监听工具使用指南

## 功能介绍

HTTP Sniffer 是一个基于 Node.js 的代理服务器，可以监听浏览器和系统的所有 HTTP/HTTPS 请求。

### 新功能（v2.0.0）

✨ **详细模式** - 显示完整的请求/响应头、请求体、响应体  
🔍 **实时搜索** - 搜索关键词并高亮显示匹配结果  
⏱️ **响应时间过滤** - 按最小/最大响应时间过滤请求  
📊 **状态码过滤** - 按单个状态码或范围过滤  
🐌 **慢请求识别** - 自动标记响应时间 >1s 的请求  
❌ **失败请求识别** - 自动标记 4xx/5xx 状态码的请求  
🎯 **智能指示器** - 请求前显示慢请求/失败请求图标  
📈 **增强统计** - 显示慢请求和失败请求的详细信息  

### 新功能（v1.1.0）

✨ **彩色输出** - 不同方法和状态码用不同颜色显示  
🎯 **过滤功能** - 按 HTTP 方法、域名过滤请求  
📊 **统计信息** - 显示请求数量、平均耗时、总流量等  
📦 **HAR 导出** - 导出为 HAR 格式，可在 Chrome DevTools 中打开  
📝 **JSON 输出** - 支持机器可读的 JSON 格式输出  

## 快速开始

### 1. 启动监听

```bash
# 使用默认端口 8080
x-http-sniffer

# 指定端口
x-http-sniffer -p 8888

# 保存请求记录到文件
x-http-sniffer -s

# 只监听 GET 请求
x-http-sniffer -m GET

# 只监听特定域名
x-http-sniffer -d example.com

# 显示详细信息（请求头、响应头、请求体、响应体）
x-http-sniffer -v

# 搜索特定关键词
x-http-sniffer --search api

# 只显示慢请求 (>500ms)
x-http-sniffer --min-time 500

# 只显示失败请求
x-http-sniffer --status-range 400-599

# 显示统计信息
x-http-sniffer -S

# 导出 HAR 格式
x-http-sniffer -H

# 组合使用：详细模式 + 搜索 + 统计
x-http-sniffer -v --search zhihu -S -H
```

### 2. 配置浏览器代理

#### Chrome / Edge

1. 打开设置
2. 搜索"代理"
3. 点击"打开计算机的代理设置"
4. 开启"使用代理服务器"
5. 设置：
   - 地址：`127.0.0.1`
   - 端口：`8080`（或你指定的端口）
6. 点击"保存"

#### Firefox

1. 打开设置
2. 搜索"网络"
3. 点击"设置"
4. 选择"手动配置代理"
5. 设置：
   - HTTP 代理：`127.0.0.1` 端口：`8080`
   - HTTPS 代理：`127.0.0.1` 端口：`8080`
6. 点击"确定"

#### Safari (macOS)

1. 打开 Safari 偏好设置
2. 点击"高级"
3. 点击"更改设置"
4. 选择"网页代理 (HTTP)"和"安全网页代理 (HTTPS)"
5. 设置：
   - 服务器：`127.0.0.1`
   - 端口：`8080`
6. 点击"好"

### 3. 配置 curl 使用代理

```bash
# 方法一：使用 --proxy 参数
curl --proxy http://127.0.0.1:8080 https://example.com

# 方法二：设置环境变量
export http_proxy=http://127.0.0.1:8080
export https_proxy=http://127.0.0.1:8080
curl https://example.com
```

### 4. 开始监听

配置好代理后，在浏览器中访问任何网页，你会在终端看到实时的请求日志！

## 命令行选项

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--port` | `-p` | 代理服务器端口 | `8080` |
| `--save` | `-s` | 保存请求记录到文件 | 关闭 |
| `--method` | `-m` | 按 HTTP 方法过滤 (GET/POST 等) | - |
| `--domain` | `-d` | 按域名过滤 | - |
| `--exclude` | `-e` | 排除特定域名 | - |
| `--format` | `-f` | 输出格式 (text/json) | `text` |
| `--har` | `-H` | 导出为 HAR 格式 | 关闭 |
| `--stats` | `-S` | 显示统计信息 | 关闭 |
| `--verbose` | `-v` | 显示请求详细信息（请求头、响应头等） | 关闭 |
| `--search` | - | 实时搜索关键词，匹配URL、方法、状态码等 | - |
| `--min-time` | - | 只显示响应时间大于指定毫秒的请求 | - |
| `--max-time` | - | 只显示响应时间小于指定毫秒的请求 | - |
| `--status` | - | 按状态码过滤 (例如: 200, 404, 500) | - |
| `--status-range` | - | 按状态码范围过滤 (例如: 200-299, 400-499) | - |
| `--help` | `-h` | 显示帮助信息 | - |
| `--version` | `-V` | 显示版本号 | - |

## 使用示例

### 基础使用

```bash
# 监听所有请求
x-http-sniffer
```

### 过滤请求

```bash
# 只监听 GET 请求
x-http-sniffer -m GET

# 只监听 POST 请求
x-http-sniffer -m POST

# 只监听 example.com 的请求
x-http-sniffer -d example.com

# 排除 google.com 的请求
x-http-sniffer -e google.com

# 组合过滤：只监听 example.com 的 GET 请求
x-http-sniffer -m GET -d example.com

# 按响应时间过滤：只显示慢请求 (>1s)
x-http-sniffer --min-time 1000

# 按响应时间过滤：只显示快速请求 (<100ms)
x-http-sniffer --max-time 100

# 按状态码过滤：只显示 404
x-http-sniffer --status 404

# 按状态码范围过滤：只显示错误请求 (4xx/5xx)
x-http-sniffer --status-range 400-599

# 实时搜索：只显示包含 "api" 的请求
x-http-sniffer --search api
```

### 详细模式

```bash
# 显示完整的请求/响应信息
x-http-sniffer -v

# 详细模式 + 搜索
x-http-sniffer -v --search zhihu
```

### 保存和导出

```bash
# 保存每个请求为 JSON 文件
x-http-sniffer -s

# 导出为 HAR 格式（可在 Chrome DevTools 中打开）
x-http-sniffer -H

# 同时保存 JSON 和 HAR
x-http-sniffer -s -H
```

### 统计信息

```bash
# 显示统计信息（停止时显示）
x-http-sniffer -S
```

### JSON 输出

```bash
# 输出 JSON 格式，适合机器处理
x-http-sniffer -f json
```

## 输出说明

### 文本格式（默认）

```
🐌 [2026-03-14 10:30:45] GET     example.com/api/users 200  1234ms   2.45 KB
   [2026-03-14 10:30:46] POST    example.com/api/data  201   123ms  10.20 KB
❌ [2026-03-14 10:30:47] GET     example.com/not-found 404    45ms    1.20 KB
```

| 字段 | 说明 | 颜色 |
|------|------|------|
| 指示器 | 🐌=慢请求(>1s), ❌=失败请求(4xx/5xx) | - |
| 时间 | 请求时间戳 | 灰色 |
| 方法 | HTTP 方法 | GET(蓝), POST(绿), PUT(黄), DELETE(红) |
| URL | 请求的 URL | 白色（搜索关键词高亮黄色背景） |
| 状态码 | HTTP 响应状态码 | 2xx(绿), 3xx(黄), 4xx/5xx(红) |
| 耗时 | 请求耗时（毫秒） | <500ms(洋红), 500-1000ms(黄), >1s(红) |
| 大小 | 响应大小 | 黄色 |

### 详细模式 (-v)

```
════════════════════════════════════════════════════════════════════════════
📋 请求详情
════════════════════════════════════════════════════════════════════════════
ID: 1
时间: 2026-03-14T10:30:45.123Z
方法: GET
URL: http://example.com/api/users
状态码: 200
响应时间: 123ms
响应大小: 2.45 KB

📤 请求头:
  host: example.com
  user-agent: curl/7.64.1
  accept: */*

📝 请求体:
  (空)

📥 响应头:
  content-type: application/json
  content-length: 2560
  date: Sat, 14 Mar 2026 10:30:45 GMT

📄 响应体:
  {
    "users": [...]
  }
════════════════════════════════════════════════════════════════════════════
```

### 统计信息

停止监听时（按 Ctrl+C）会显示：

```
════════════════════════════════════════════════════════════════════════════
📊 统计信息
════════════════════════════════════════════════════════════════════════════
运行时间: 125.3s
总请求数: 156
平均耗时: 87.45ms
总流量: 12.34 MB

🐌 慢请求 (>1s):
  1567ms - example.com/api/slow-endpoint
  1234ms - example.com/api/another-slow

❌ 失败请求 (4xx/5xx):
  404 - example.com/not-found
  500 - example.com/api/error

请求方法:
  GET: 120
  POST: 25
  OPTIONS: 11

状态码:
  2xx: 142
  3xx: 8
  4xx: 6

🌐 热门域名:
  example.com: 89
  api.example.com: 45
  cdn.example.com: 22
════════════════════════════════════════════════════════════════════════════
```

## 保存的文件

### JSON 单个文件

使用 `-s` 选项后，每个请求保存为一个 JSON 文件到 `.http-sniffer/` 文件夹：

```json
{
  "id": "请求ID",
  "method": "GET",
  "host": "example.com",
  "path": "/api/users",
  "url": "http://example.com/api/users",
  "headers": { ... },
  "timestamp": "2026-03-14T10:30:45.123Z",
  "startTime": 1234567890,
  "requestBody": "请求体内容",
  "statusCode": 200,
  "responseHeaders": { ... },
  "responseBody": "响应体内容",
  "responseTime": 123,
  "responseSize": 2560
}
```

### HAR 文件

使用 `-H` 选项后，停止时会导出一个 HAR 文件，可以在 Chrome DevTools 的 Network 面板中打开查看。

## 停止监听

在终端按 `Ctrl + C` 停止代理服务器。如果启用了 `-S` 或 `-H` 选项，会在停止时显示统计信息或导出 HAR 文件。

## 监听 curl 请求示例

### 示例：监听知乎 API 请求

1. 启动监听器：

```bash
x-http-sniffer -v -S -H
```

2. 在另一个终端运行 curl（使用代理）：

```bash
export http_proxy=http://127.0.0.1:8080
export https_proxy=http://127.0.0.1:8080

curl 'https://www.zhihu.com/api/v4/articles/2007894606273085515/relationship?desktop=true' \
   -H 'accept: */*' \
   -H 'accept-language: en,zh;q=0.9,zh-CN;q=0.8' \
   -H 'origin: https://zhuanlan.zhihu.com' \
   -H 'referer: https://zhuanlan.zhihu.com/p/2007894606273085515' \
   -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
```

3. 查看监听器终端，你会看到完整的请求/响应信息！

## 常见问题

### Q: 配置代理后无法上网？
A: 确保代理服务器正在运行，并且端口配置正确。

### Q: HTTPS 请求看不到内容？
A: HTTPS 请求是加密的，代理只能看到连接信息，无法看到请求/响应内容。要查看 HTTPS 内容，需要安装 SSL 证书。

### Q: 如何只监听特定网站？
A: 使用 `-d` 选项按域名过滤，例如：`x-http-sniffer -d example.com`

### Q: 端口被占用怎么办？
A: 使用 `-p` 选项指定其他端口，例如：`x-http-sniffer -p 8888`

### Q: 如何在 Chrome DevTools 中查看 HAR 文件？
A: 打开 Chrome DevTools → Network 面板 → 右键 → Import HAR file → 选择导出的 .har 文件

### Q: 如何只查看慢请求？
A: 使用 `--min-time` 选项，例如：`x-http-sniffer --min-time 1000` 只显示 >1s 的请求

### Q: 如何只查看失败请求？
A: 使用 `--status-range` 选项，例如：`x-http-sniffer --status-range 400-599`

### Q: 搜索关键词会高亮吗？
A: 是的，使用 `--search` 选项时，匹配的关键词会以黄色背景高亮显示

## 技术原理

HTTP Sniffer 使用 HTTP/HTTPS 代理服务器来拦截请求：
- HTTP 请求：直接拦截，可以看到完整的请求/响应内容
- HTTPS 请求：通过 CONNECT 方法建立隧道，只能看到连接信息

## 注意事项

1. 使用完毕后记得关闭浏览器代理设置
2. 不要在公共网络中使用此工具监听敏感信息
3. 保存的请求记录可能包含敏感数据，请妥善保管
4. HAR 文件可能包含敏感信息，请勿分享给他人
5. 详细模式 (-v) 会输出大量信息，建议配合搜索使用
