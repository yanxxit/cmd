# x-wifi 使用指南

获取当前操作系统的 WiFi 密码命令行工具。

## 安装

```bash
cd /path/to/cmd
npm link
```

## 使用方法

### 1. 获取当前连接的 WiFi 密码

```bash
# 默认获取当前 WiFi 信息
x-wifi

# 或者显式指定
x-wifi --current
```

输出示例：
```
📶 当前 WiFi 信息:
  SSID:     MyHomeWiFi
  密码：     mypassword123
  系统：     macOS
```

### 2. 列出所有已保存的 WiFi 网络

```bash
x-wifi --list
```

输出示例：
```
📶 已保存的 WiFi 网络 (3 个):
  1. MyHomeWiFi
  2. Office5G
  3. Guest
```

### 3. 获取指定 WiFi 的密码

```bash
x-wifi --ssid "WiFi 名称"
```

输出示例：
```
✅ 找到 WiFi 密码:
  SSID:     MyHomeWiFi
  密码：     mypassword123
```

### 4. JSON 格式输出

```bash
# 当前 WiFi 信息（JSON 格式）
x-wifi --current --json

# 列出 WiFi（JSON 格式）
x-wifi --list --json

# 指定 WiFi 密码（JSON 格式）
x-wifi --ssid "MyHomeWiFi" --json
```

输出示例：
```json
{
  "ssid": "MyHomeWiFi",
  "password": "mypassword123",
  "platform": "darwin"
}
```

## 命令行选项

| 选项 | 简写 | 说明 |
|------|------|------|
| `--current` | `-c` | 获取当前连接的 WiFi 密码 |
| `--list` | `-l` | 列出所有已保存的 WiFi 网络 |
| `--ssid <name>` | `-s` | 获取指定 WiFi 的密码 |
| `--json` | `-j` | 以 JSON 格式输出 |
| `--help` | `-h` | 显示帮助信息 |
| `--version` | `-V` | 显示版本号 |

## 系统支持

### macOS
- ✅ 获取当前 WiFi SSID
- ✅ 获取 WiFi 密码（可能需要钥匙串权限）
- ✅ 列出已保存的网络

### Windows
- ✅ 获取当前 WiFi SSID
- ✅ 获取 WiFi 密码（可能需要管理员权限）
- ✅ 列出已保存的网络

### Linux
- ✅ 获取当前 WiFi SSID（需要 wireless-tools 或 network-manager）
- ✅ 获取 WiFi 密码（需要 sudo 权限）
- ✅ 列出已保存的网络（需要 sudo 权限）

## 权限说明

### macOS
获取 WiFi 密码可能需要钥匙串访问权限，系统会弹出对话框请求授权。

### Windows
可能需要以管理员身份运行命令行：
```bash
# PowerShell（管理员）
x-wifi --current
```

### Linux
需要 sudo 权限读取 NetworkManager 配置：
```bash
sudo x-wifi --current
```

## 常见问题

### Q: 为什么获取不到 WiFi 密码？
A: 可能需要管理员权限。在 macOS 上需要授权钥匙串访问，在 Windows 上需要管理员权限，在 Linux 上需要 sudo。

### Q: 为什么显示"未连接到任何 WiFi 网络"？
A: 当前设备没有连接到任何 WiFi 网络，或者网卡被禁用。

### Q: Linux 系统提示命令不存在？
A: 需要安装 wireless-tools 或 network-manager：
```bash
# Debian/Ubuntu
sudo apt install wireless-tools network-manager

# CentOS/RHEL
sudo yum install wireless-tools NetworkManager
```

## 技术实现

- **macOS**: 使用 `airport` 命令获取 SSID，`security` 命令从钥匙串获取密码
- **Windows**: 使用 `netsh wlan` 命令获取 WiFi 信息
- **Linux**: 使用 `iwgetid`/`nmcli` 获取 SSID，从 `/etc/NetworkManager/` 读取密码

## 示例

```bash
# 查看当前连接的 WiFi 密码
x-wifi

# 查看所有保存的 WiFi
x-wifi -l

# 查看指定 WiFi 密码
x-wifi -s "Office5G"

# 导出为 JSON
x-wifi -l -j > wifi-list.json
```
