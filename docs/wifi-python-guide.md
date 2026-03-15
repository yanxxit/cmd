# Python WiFi 密码获取工具

使用 Python 实现的 WiFi 密码获取命令行工具。

## 使用方法

### 基本用法

```bash
# 获取当前连接的 WiFi 密码
python bin/wifi-py.py

# 或者显式指定
python bin/wifi-py.py --current
```

### 列出所有已保存的 WiFi

```bash
python bin/wifi-py.py --list
```

### 获取指定 WiFi 的密码

```bash
python bin/wifi-py.py --ssid "WiFi 名称"
```

### JSON 格式输出

```bash
# 当前 WiFi 信息
python bin/wifi-py.py --json

# 列出 WiFi
python bin/wifi-py.py --list --json

# 指定 WiFi
python bin/wifi-py.py --ssid "MyWiFi" --json
```

## 命令行选项

| 选项 | 简写 | 说明 |
|------|------|------|
| `--current` | `-c` | 获取当前连接的 WiFi 密码 |
| `--list` | `-l` | 列出所有已保存的 WiFi 网络 |
| `--ssid <name>` | `-s` | 获取指定 WiFi 的密码 |
| `--json` | `-j` | 以 JSON 格式输出 |
| `--help` | `-h` | 显示帮助信息 |

## 系统支持

### macOS
```bash
# 直接运行
python bin/wifi-py.py

# 获取密码时可能需要钥匙串授权（系统会弹出对话框）
python bin/wifi-py.py --ssid "MyWiFi"
```

### Windows
```bash
# 可能需要管理员权限
# 以管理员身份运行 PowerShell 或 CMD
python bin/wifi-py.py --current
```

### Linux
```bash
# 需要 sudo 权限
sudo python bin/wifi-py.py --current

# 或者只读 NetworkManager 配置
sudo python bin/wifi-py.py --list
```

## 输出示例

### 获取当前 WiFi
```
📶 当前 WiFi 信息:
  SSID:     MyHomeWiFi
  密码：     mypassword123
  系统：     macOS
```

### 列出已保存的 WiFi
```
📶 已保存的 WiFi 网络 (3 个):
  1. MyHomeWiFi
  2. Office5G
  3. Guest
```

### JSON 输出
```json
{
  "ssid": "MyHomeWiFi",
  "password": "mypassword123",
  "platform": "darwin"
}
```

## 技术实现

### macOS
- 使用 `airport` 命令获取当前 WiFi SSID
- 使用 `security find-generic-password` 从系统钥匙串获取密码

### Windows
- 使用 `netsh wlan show interfaces` 获取当前 WiFi
- 使用 `netsh wlan show profile name="SSID" key=clear` 获取密码

### Linux
- 使用 `iwgetid` 或 `nmcli` 获取当前 WiFi
- 从 `/etc/NetworkManager/system-connections/` 读取密码配置

## 依赖

仅需 Python 3.12+ 标准库，无需额外安装依赖：
- `subprocess` - 执行系统命令
- `platform` - 检测操作系统
- `re` - 正则表达式解析
- `argparse` - 命令行参数解析
- `json` - JSON 格式化输出

## 与 Node.js 版本对比

| 特性 | Python 版 | Node.js 版 |
|------|-----------|------------|
| 依赖 | 无（标准库） | commander, chalk |
| 启动速度 | 快 | 较快 |
| 跨平台 | ✅ | ✅ |
| 权限要求 | 相同 | 相同 |

## 常见问题

**Q: 为什么获取不到密码？**
A: 可能需要管理员权限：
- macOS: 授权钥匙串访问
- Windows: 以管理员身份运行
- Linux: 使用 sudo

**Q: 显示"未连接到任何 WiFi 网络"？**
A: 设备未连接 WiFi 或网卡被禁用。

**Q: Linux 提示命令不存在？**
A: 安装 wireless-tools 或 network-manager：
```bash
sudo apt install wireless-tools network-manager
```
