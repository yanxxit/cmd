# HTTP 测试平台使用文档

> 📅 创建时间：2026-03-13  
> 📋 参考：https://httpbin.org/  
> 🌐 技术栈：Express.js + Vue 3

---

## 🎯 功能概述

参考 httpbin.org 实现的 HTTP 请求测试平台，提供：
- ✅ HTTP 方法测试（GET/POST/PUT/DELETE/PATCH）
- ✅ 请求头查看
- ✅ IP 地址返回
- ✅ 状态码测试
- ✅ 延迟响应
- ✅ 重定向测试
- ✅ 流式响应
- ✅ 缓存测试
- ✅ 压缩测试
- ✅ Cookies 管理
- ✅ 前端测试界面（Vue 3）

---

## 📁 文件结构

```
public/httpbin/
└── index.html              # 前端测试页面

src/http-server/
└── httpbin-api.js          # HTTP 测试 API 路由
```

---

## 🎨 页面布局

```
┌─────────────────────────────────────────────────┐
│  🌐 HTTP 请求测试平台                            │
│  参考 httpbin.org · 方便测试 HTTP 客户端          │
├───────────────────┬─────────────────────────────┤
│  ⚡ 快速端点       │  请求配置                    │
│  - GET /get       │  [方法] [URL]     [发送]    │
│  - POST /post     │  Query 参数：+添加           │
│  - GET /ip        │  Headers: +添加              │
│  - GET /delay/2   │  Body: [JSON] [Form]         │
├───────────────────┴─────────────────────────────┤
│  📤 响应                                         │
│  [200] 123ms  [复制]                            │
│  {                                              │
│    "args": {},                                  │
│    "headers": {...},                            │
│    "origin": "...",                             │
│    "url": "..."                                 │
│  }                                              │
└─────────────────────────────────────────────────┘
```

---

## 📡 API 端点

### 基础请求

#### GET /api/httpbin/get
返回 GET 请求信息

```bash
curl http://127.0.0.1:3000/api/httpbin/get?name=test
```

**响应：**
```json
{
  "args": { "name": "test" },
  "headers": { ... },
  "origin": "127.0.0.1",
  "url": "https://127.0.0.1:3000/api/httpbin/get?name=test"
}
```

#### POST /api/httpbin/post
返回 POST 请求信息

```bash
curl -X POST http://127.0.0.1:3000/api/httpbin/post \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
```

#### PUT /api/httpbin/put
返回 PUT 请求信息

#### DELETE /api/httpbin/delete
返回 DELETE 请求信息

#### PATCH /api/httpbin/patch
返回 PATCH 请求信息

#### GET|POST|PUT|DELETE|PATCH /api/httpbin/anything
返回任何请求的完整信息

### 请求信息

#### GET /api/httpbin/headers
返回请求头信息

```bash
curl http://127.0.0.1:3000/api/httpbin/headers
```

#### GET /api/httpbin/ip
返回客户端 IP 地址

```bash
curl http://127.0.0.1:3000/api/httpbin/ip
```

#### GET /api/httpbin/user-agent
返回 User-Agent

```bash
curl http://127.0.0.1:3000/api/httpbin/user-agent
```

### 状态码

#### GET /api/httpbin/status/:code
返回指定状态码

```bash
# 返回 200
curl http://127.0.0.1:3000/api/httpbin/status/200

# 返回 404
curl http://127.0.0.1:3000/api/httpbin/status/404

# 返回 500
curl http://127.0.0.1:3000/api/httpbin/status/500
```

### 延迟和超时

#### GET /api/httpbin/delay/:seconds
延迟指定秒数后响应

```bash
# 延迟 2 秒
curl http://127.0.0.1:3000/api/httpbin/delay/2
```

**响应：**
```json
{
  "delayed": true,
  "seconds": 2,
  "timestamp": "2026-03-13T12:00:00.000Z"
}
```

### 数据生成

#### GET /api/httpbin/bytes/:size
返回指定大小的随机字节

```bash
# 返回 1024 字节
curl http://127.0.0.1:3000/api/httpbin/bytes/1024 --output random.bin
```

#### GET /api/httpbin/html
返回示例 HTML 页面

```bash
curl http://127.0.0.1:3000/api/httpbin/html
```

#### GET /api/httpbin/json
返回示例 JSON

```bash
curl http://127.0.0.1:3000/api/httpbin/json
```

#### GET /api/httpbin/xml
返回示例 XML

```bash
curl http://127.0.0.1:3000/api/httpbin/xml
```

### Cookies

#### GET /api/httpbin/cookies
返回 Cookies

```bash
curl http://127.0.0.1:3000/api/httpbin/cookies \
  -H "Cookie: session=abc123"
```

#### GET /api/httpbin/cookies/set
设置 Cookies

```bash
curl "http://127.0.0.1:3000/api/httpbin/cookies/set?name=test&value=hello"
```

#### GET /api/httpbin/cookies/delete
删除 Cookies

```bash
curl "http://127.0.0.1:3000/api/httpbin/cookies/delete?keys=session"
```

### 重定向

#### GET /api/httpbin/redirect/:times
重定向指定次数

```bash
# 重定向 3 次
curl -L http://127.0.0.1:3000/api/httpbin/redirect/3
```

### 流式响应

#### GET /api/httpbin/stream/:lines
流式响应指定行数

```bash
# 流式输出 10 行
curl http://127.0.0.1:3000/api/httpbin/stream/10
```

#### GET /api/httpbin/drip
滴漏式响应

```bash
# 2 秒内输出 10 个字节
curl "http://127.0.0.1:3000/api/httpbin/drip?duration=2&numbytes=10"
```

### Range 请求

#### GET /api/httpbin/range/:numbytes
支持 Range 头的响应

```bash
# 请求前 100 字节
curl -H "Range: bytes=0-99" http://127.0.0.1:3000/api/httpbin/range/1000
```

### 缓存

#### GET /api/httpbin/cache
测试缓存（24 小时）

```bash
curl -v http://127.0.0.1:3000/api/httpbin/cache
```

#### GET /api/httpbin/cache/:numhours
测试缓存（指定小时数）

```bash
# 缓存 6 小时
curl -v http://127.0.0.1:3000/api/httpbin/cache/6
```

#### GET /api/httpbin/etag/:etag
测试 ETag

```bash
# 第一次请求
curl -v http://127.0.0.1:3000/api/httpbin/etag/abc123

# 第二次请求（带 If-None-Match）
curl -v -H "If-None-Match: abc123" http://127.0.0.1:3000/api/httpbin/etag/abc123
```

### 压缩

#### GET /api/httpbin/gzip
返回 Gzip 压缩响应

```bash
curl -H "Accept-Encoding: gzip" http://127.0.0.1:3000/api/httpbin/gzip
```

#### GET /api/httpbin/deflate
返回 Deflate 压缩响应

```bash
curl -H "Accept-Encoding: deflate" http://127.0.0.1:3000/api/httpbin/deflate
```

### 响应头

#### GET /api/httpbin/response-headers
自定义响应头

```bash
curl "http://127.0.0.1:3000/api/httpbin/response-headers?X-Custom-Header=test&Content-Type=application/json"
```

### 编码

#### GET /api/httpbin/base64/:value
Base64 编解码

```bash
# 解码
curl http://127.0.0.1:3000/api/httpbin/base64/aGVsbG8gd29ybGQ=
```

#### GET /api/httpbin/encoding/utf8
UTF-8 编码测试

```bash
curl http://127.0.0.1:3000/api/httpbin/encoding/utf8
```

---

## 💻 前端测试界面

### 访问方式

```bash
# 启动服务
x-static

# 访问前端界面
http://127.0.0.1:3000/httpbin/
```

### 功能特性

**请求配置：**
- 选择 HTTP 方法（GET/POST/PUT/DELETE/PATCH）
- 输入或选择 URL
- 添加 Query 参数
- 添加 Headers
- 设置 Body（JSON 或 Form）

**快速端点：**
- 点击快速端点卡片自动填充
- 查看所有可用端点列表

**响应显示：**
- 状态码显示（颜色区分）
- 响应时间
- JSON 格式化显示
- 一键复制响应

**主题切换：**
- 明/暗主题切换
- 本地存储偏好

---

## 🔧 使用场景

### 1. 测试 HTTP 客户端

```javascript
// 测试 fetch
fetch('http://127.0.0.1:3000/api/httpbin/get?name=test')
  .then(res => res.json())
  .then(data => console.log(data));

// 测试 axios
axios.post('http://127.0.0.1:3000/api/httpbin/post', { name: 'test' })
  .then(res => console.log(res.data));
```

### 2. 测试错误处理

```javascript
// 测试 404
fetch('http://127.0.0.1:3000/api/httpbin/status/404')
  .then(res => {
    if (!res.ok) throw new Error('Not found');
  });

// 测试超时
fetch('http://127.0.0.1:3000/api/httpbin/delay/5', { signal: AbortSignal.timeout(3000) })
  .catch(err => console.error('Timeout:', err));
```

### 3. 测试重定向

```javascript
// 测试自动跟随重定向
fetch('http://127.0.0.1:3000/api/httpbin/redirect/3')
  .then(res => console.log('Final URL:', res.url));
```

### 4. 测试缓存

```javascript
// 测试缓存头
fetch('http://127.0.0.1:3000/api/httpbin/cache')
  .then(res => {
    console.log('Cache-Control:', res.headers.get('Cache-Control'));
    console.log('ETag:', res.headers.get('ETag'));
  });
```

---

## 📊 响应格式说明

### 通用响应字段

| 字段 | 说明 |
|------|------|
| args | URL Query 参数 |
| data | 请求体数据（JSON/原始数据） |
| form | 表单数据 |
| files | 上传的文件 |
| headers | 请求头 |
| json | 解析后的 JSON 数据 |
| origin | 客户端 IP |
| url | 请求 URL |

### 状态码含义

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 206 | 部分内容（Range 请求） |
| 302 | 重定向 |
| 304 | 未修改（缓存） |
| 400 | 请求错误 |
| 404 | 未找到 |
| 500 | 服务器错误 |

---

## 🐛 常见问题

### 1. CORS 错误

**问题：** 前端访问时出现 CORS 错误

**解决：** 服务器需要添加 CORS 头
```javascript
res.set('Access-Control-Allow-Origin', '*');
```

### 2. 大响应慢

**问题：** /bytes/:size 请求大文件时响应慢

**解决：** 使用流式响应或限制大小

### 3. 延迟请求无响应

**问题：** /delay/:seconds 长时间无响应

**解决：** 检查服务器日志，确认请求已接收

---

## 🔗 相关资源

- [httpbin.org](https://httpbin.org/) - 原版 httpbin
- [Express.js](https://expressjs.com/) - Web 框架
- [Vue 3](https://vuejs.org/) - 前端框架

---

## 📝 更新日志

### v1.0.0 (2026-03-13)
- ✅ 初始版本发布
- ✅ 基础 HTTP 方法支持
- ✅ 请求信息查看
- ✅ 状态码测试
- ✅ 延迟响应
- ✅ 重定向测试
- ✅ 流式响应
- ✅ 缓存测试
- ✅ 前端测试界面

---

*本文档基于 v1 版本编写，如有更新请参考最新代码。*
