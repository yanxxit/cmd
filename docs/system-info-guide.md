# 系统信息监控页面使用指南

基于 Node.js 和 Socket.IO 实现的实时操作系统信息 Web 展示页面。

## 功能特性

- 🖥️ **系统信息** - 操作系统、主机名、运行时间、用户
- 🧠 **CPU 监控** - 型号、核心数、实时使用率（每核心）
- 💾 **内存监控** - 总计、已用、空闲、使用率
- 💿 **磁盘监控** - 总计、已用、空闲、使用率
- 🌐 **网络信息** - WiFi 状态、IP 地址、网络接口
- 🔋 **电池信息** - 电量百分比、充电状态（仅笔记本）
- ⚙️ **进程信息** - PID、Node 版本、内存使用

## 启动服务

```bash
# 方法 1: 使用 x-static 命令
x-static

# 方法 2: 使用 Node.js 直接启动
node -e "
import('./src/http-server/static.js').then(module => {
  const startServer = module.default;
  startServer({ port: 3000 });
});
"
```

## 访问页面

启动服务后，访问：

```
http://127.0.0.1:3000/system-info/
```

## 页面功能

### 实时数据更新

- 使用 **Socket.IO** 建立 WebSocket 连接
- 数据每 **2 秒** 自动刷新一次
- 实时显示连接状态（连接中/已断开）

### 深色模式

- 🌙 点击月亮图标切换到深色模式
- ☀️ 点击太阳图标切换到浅色模式
- 自动记住用户偏好

### 手动刷新

- 点击 "刷新" 按钮手动更新数据
- 如果 Socket 未连接，自动切换到 HTTP API

## API 接口

### HTTP API

```bash
# 获取所有系统信息
GET /api/system-info

# 获取 CPU 信息
GET /api/system-info/cpu

# 获取内存信息
GET /api/system-info/memory

# 获取磁盘信息
GET /api/system-info/disk

# 获取网络信息
GET /api/system-info/network

# 获取系统基本信息
GET /api/system-info/system
```

### Socket.IO

```javascript
// 连接到命名空间
const socket = io('/system-info');

// 监听系统信息更新
socket.on('system-info', (data) => {
  console.log('系统信息:', data);
});

// 请求刷新数据
socket.emit('request-info');

// 监听错误
socket.on('system-error', (error) => {
  console.error('错误:', error);
});
```

## 响应数据示例

```json
{
  "success": true,
  "data": {
    "system": {
      "platform": "darwin",
      "arch": "arm64",
      "release": "24.6.0",
      "hostname": "M56YGW3NC2",
      "uptime": "5 天 21 小时 3 分钟",
      "user": "bytedance",
      "nodeVersion": "v20.10.0"
    },
    "cpu": {
      "model": "Apple M4",
      "speed": 2400,
      "cores": 10,
      "avgUsage": 17.5,
      "usage": [
        {"core": "Apple M4", "usage": 40.4},
        {"core": "Apple M4", "usage": 31.1}
      ]
    },
    "memory": {
      "total": "16 GB",
      "used": "15.84 GB",
      "free": "166.67 MB",
      "usage": "99.0"
    },
    "disk": {
      "total": "460Gi",
      "used": "17Gi",
      "free": "285Gi",
      "usage": "6"
    },
    "network": {
      "interfaces": [...],
      "internalIPs": ["192.168.1.5"],
      "externalIP": "192.168.1.5"
    },
    "wifi": {
      "ssid": "已连接（SSID 被系统隐藏）",
      "platform": "macOS"
    },
    "battery": {
      "level": 53,
      "charging": true,
      "status": "充电中"
    }
  }
}
```

## 技术架构

### 后端

- **Express.js** - Web 服务器
- **Socket.IO** - WebSocket 实时通信
- **Node.js os 模块** - 获取系统信息
- **child_process** - 执行系统命令获取详细信息

### 前端

- **Vue 3** - 响应式框架
- **Tailwind CSS** - UI 样式
- **Socket.IO Client** - WebSocket 客户端
- **Chart.js** - 图表库（预留）

## 系统支持

| 系统 | CPU | 内存 | 磁盘 | WiFi | 电池 |
|------|-----|------|------|------|------|
| macOS | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Windows | ✅ | ✅ | ✅ | ✅ | ✅ |
| Linux | ✅ | ✅ | ✅ | ✅ | ✅ |

**注意：** 
- macOS 新版系统（macOS 12+）出于隐私保护会隐藏 WiFi SSID
- 电池信息仅在笔记本电脑上可用

## 文件结构

```
cmd/
├── src/
│   ├── system-info.js              # 系统信息收集模块
│   └── http-server/
│       ├── static.js               # 静态服务器（已集成）
│       └── system-info-api.js      # Socket.IO 和 HTTP API
├── public/
│   └── system-info/
│       └── index.html              # 前端页面
└── docs/
    └── system-info-guide.md        # 本文档
```

## 注意事项

1. **权限要求**
   - 某些系统信息可能需要管理员权限
   - macOS 获取 WiFi 密码需要钥匙串授权

2. **性能考虑**
   - 数据每 2 秒刷新一次，避免频繁请求
   - Socket.IO 连接会自动管理重连

3. **隐私保护**
   - 新版 macOS 会隐藏 WiFi SSID（系统限制）
   - 不建议在公共网络暴露此页面

## 扩展功能

如需添加更多监控项，可以：

1. 在 `src/system-info.js` 中添加新的信息收集函数
2. 在 `src/http-server/system-info-api.js` 中添加对应的 API
3. 在 `public/system-info/index.html` 中添加前端展示

## 常见问题

**Q: 为什么 WiFi 显示"已连接（SSID 被系统隐藏）"？**
A: 这是 macOS 的隐私保护机制，无法绕过。但实际已连接到 WiFi。

**Q: Socket 连接失败怎么办？**
A: 页面会自动切换到 HTTP API 轮询模式，数据仍然会更新。

**Q: 如何修改刷新频率？**
A: 修改 `system-info-api.js` 中的 `setInterval` 时间（默认 2000ms）。

**Q: 可以远程访问吗？**
A: 可以，启动时指定监听地址：
```javascript
startServer({ port: 3000, host: '0.0.0.0' });
```
