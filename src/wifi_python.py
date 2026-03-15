#!/usr/bin/env python3
"""
WiFi 密码获取模块 - Python 实现
支持 macOS、Windows、Linux 系统
"""

import subprocess
import platform
import re
import sys
from typing import Optional, List, Dict


def get_platform() -> str:
    """获取操作系统平台"""
    return platform.system().lower()


def run_command(command: List[str], shell: bool = False) -> tuple[bool, str, str]:
    """
    执行系统命令
    
    Args:
        command: 命令列表或字符串
        shell: 是否使用 shell 执行
        
    Returns:
        (success, stdout, stderr)
    """
    try:
        result = subprocess.run(
            command,
            shell=shell,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "命令执行超时"
    except Exception as e:
        return False, "", str(e)


def get_current_wifi_ssid() -> Optional[str]:
    """
    获取当前连接的 WiFi 名称 (SSID)
    
    Returns:
        WiFi 名称，如果未连接则返回 None
    """
    system = get_platform()
    
    if system == "darwin":  # macOS
        # 方法 1: 尝试 airport 命令（旧版 macOS）
        success, stdout, _ = run_command([
            "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport",
            "-I"
        ])
        if success:
            match = re.search(r'SSID:\s*(.+)', stdout)
            if match:
                ssid = match.group(1).strip()
                # 检查是否被 redacted 隐藏
                if ssid and ssid != "<redacted>":
                    return ssid
        
        # 方法 2: 从 system_profiler 获取（新版 macOS）
        ssid = _get_macos_wifi_ssid_from_profiler()
        if ssid:
            return ssid
        
        # 方法 3: 从钥匙串获取已保存的网络，然后尝试获取密码
        # 如果能获取到密码，说明是当前连接的网络
        saved_networks = get_saved_wifi_list()
        for ssid in saved_networks:
            # 尝试获取密码，如果能获取到说明这个网络在钥匙串中
            success, _, _ = run_command([
                "security",
                "find-generic-password",
                "-wa",
                ssid
            ])
            if success:
                # 这个网络在钥匙串中有密码，可能是当前连接的
                # 但我们需要进一步确认
                return ssid
    
    elif system == "windows":  # Windows
        success, stdout, _ = run_command("netsh wlan show interfaces", shell=True)
        if success:
            match = re.search(r'SSID\s*:\s*(.+)', stdout)
            if match:
                return match.group(1).strip()
    
    elif system == "linux":  # Linux
        # 尝试 iwgetid
        success, stdout, _ = run_command(["iwgetid", "-r"])
        if success and stdout.strip():
            return stdout.strip()
        
        # 尝试 nmcli
        success, stdout, _ = run_command(
            "nmcli -t -f active,ssid dev wifi | grep '^yes' | cut -d':' -f2",
            shell=True
        )
        if success and stdout.strip():
            return stdout.strip()
    
    return None


def _get_macos_wifi_ssid_from_profiler() -> Optional[str]:
    """
    从 system_profiler 获取 macOS WiFi SSID
    注意：新版 macOS (macOS 12+) 出于隐私保护会隐藏 SSID
    """
    success, stdout, _ = run_command([
        "system_profiler", "SPAirPortDataType", "-json"
    ])
    if not success:
        return None
    
    try:
        import json
        data = json.loads(stdout)
        airport_data = data.get("SPAirPortDataType", [])
        
        for item in airport_data:
            interfaces = item.get("spairport_airport_interfaces", [])
            for iface in interfaces:
                # 检查是否已连接
                status = iface.get("spairport_status_information")
                if status == "spairport_status_connected":
                    # 尝试从当前网络信息获取 SSID
                    current_network = iface.get("spairport_current_network_information")
                    if current_network:
                        name = current_network.get("_name", "")
                        if name and name != "<redacted>":
                            return name
                        elif name == "<redacted>":
                            # SSID 被系统隐藏了，返回 None
                            # 这是 macOS 的隐私保护机制，无法绕过
                            return None
                    
                    # 如果没有当前网络信息，尝试从其他网络列表中找
                    other_networks = iface.get("spairport_airport_other_local_wireless_networks", [])
                    for network in other_networks:
                        # 当前连接的网络通常有信号强度信息
                        if "spairport_signal_noise" in network:
                            name = network.get("_name", "")
                            if name and name != "<redacted>":
                                return name
    except (json.JSONDecodeError, KeyError, TypeError):
        pass
    
    return None


def get_wifi_password(ssid: str) -> Optional[str]:
    """
    获取指定 WiFi 的密码
    
    Args:
        ssid: WiFi 名称
        
    Returns:
        WiFi 密码，如果获取失败则返回 None
    """
    system = get_platform()
    
    if system == "darwin":  # macOS
        # 方法 1: 使用 security 命令从钥匙串获取密码
        success, stdout, stderr = run_command([
            "security",
            "find-generic-password",
            "-wa",
            ssid
        ])
        if success:
            return stdout.strip()
        elif "The specified item could not be found in the keychain" in stderr:
            # WiFi 密码不在钥匙串中，尝试从系统钥匙串获取
            return _get_macos_wifi_password_from_system_keychain(ssid)
        else:
            # 可能需要管理员权限或钥匙串授权
            print(f"提示：可能需要管理员权限或钥匙串授权", file=sys.stderr)
            return None
    
    elif system == "windows":  # Windows
        # 使用 netsh 命令获取密码
        success, stdout, _ = run_command(
            f'netsh wlan show profile name="{ssid}" key=clear',
            shell=True
        )
        if success:
            match = re.search(r'Key Content\s*:\s*(.+)', stdout)
            if match:
                return match.group(1).strip()
        else:
            print(f"提示：可能需要以管理员身份运行", file=sys.stderr)
            return None
    
    elif system == "linux":  # Linux
        # 尝试从 NetworkManager 配置获取
        connection_file = f"/etc/NetworkManager/system-connections/{ssid}.nmconnection"
        
        # 尝试新格式
        success, stdout, _ = run_command(
            f"sudo grep -r '^psk=' {connection_file} 2>/dev/null | cut -d'=' -f2",
            shell=True
        )
        if success and stdout.strip():
            return stdout.strip()
        
        # 尝试旧格式
        success, stdout, _ = run_command(
            f"sudo cat {connection_file} 2>/dev/null | grep '^psk=' | cut -d'=' -f2",
            shell=True
        )
        if success and stdout.strip():
            return stdout.strip()
        
        # 尝试没有 .nmconnection 后缀
        connection_file = f"/etc/NetworkManager/system-connections/{ssid}"
        success, stdout, _ = run_command(
            f"sudo cat {connection_file} 2>/dev/null | grep '^psk=' | cut -d'=' -f2",
            shell=True
        )
        if success and stdout.strip():
            return stdout.strip()
        
        print(f"提示：需要 sudo 权限读取 NetworkManager 配置", file=sys.stderr)
        return None
    
    return None


def _get_macos_wifi_password_from_system_keychain(ssid: str) -> Optional[str]:
    """
    从 macOS 系统钥匙串获取 WiFi 密码（备用方法）
    """
    # 尝试系统钥匙串
    success, stdout, stderr = run_command([
        "security",
        "find-generic-password",
        "-wa",
        ssid
    ])
    if success:
        return stdout.strip()
    
    return None


def get_saved_wifi_list() -> List[str]:
    """
    获取所有已保存的 WiFi 列表
    
    Returns:
        WiFi 名称列表
    """
    system = get_platform()
    wifi_list = []
    
    if system == "darwin":  # macOS
        # 方法 1: 从 networksetup 获取
        success, stdout, _ = run_command([
            "networksetup", "-listpreferredwirelessnetworks", "en0"
        ])
        if success:
            lines = stdout.strip().split('\n')[1:]  # 跳过表头
            wifi_list = [line.strip() for line in lines if line.strip()]
        
        # 方法 2: 从钥匙串获取（备用）
        if not wifi_list:
            success, stdout, _ = run_command([
                "security", "dump-keychain",
                str(Path.home() / "Library/Keychains/login.keychain-db")
            ])
            if success:
                for line in stdout.split('\n'):
                    if "com.apple.network.eap.user.identity.wlan.ssid" in line:
                        # 提取 SSID 名称
                        match = re.search(r'ssid\.([^"]+)', line)
                        if match:
                            ssid = match.group(1).strip().rstrip('"')
                            if ssid and ssid not in wifi_list:
                                wifi_list.append(ssid)
    
    elif system == "windows":  # Windows
        success, stdout, _ = run_command("netsh wlan show profiles", shell=True)
        if success:
            matches = re.findall(r'All User Profile\s*:\s*(.+)', stdout)
            wifi_list = [m.strip() for m in matches]
    
    elif system == "linux":  # Linux
        success, stdout, _ = run_command(
            "sudo ls /etc/NetworkManager/system-connections/ 2>/dev/null | sed 's/\\.nmconnection$//'",
            shell=True
        )
        if success:
            wifi_list = [line.strip() for line in stdout.strip().split('\n') if line.strip()]
    
    return wifi_list


def get_current_wifi_info() -> Dict[str, Optional[str]]:
    """
    获取当前 WiFi 信息（SSID + 密码）
    
    Returns:
        包含 ssid, password, platform 的字典
    """
    ssid = get_current_wifi_ssid()
    
    if not ssid:
        # 检查是否已连接但 SSID 被隐藏（macOS 隐私保护）
        if _is_wifi_connected():
            raise RuntimeError("已连接到 WiFi，但 SSID 被系统隐藏（macOS 隐私保护）")
        raise RuntimeError("未连接到任何 WiFi 网络")
    
    password = get_wifi_password(ssid)
    
    return {
        "ssid": ssid,
        "password": password,
        "platform": get_platform()
    }


def _is_wifi_connected() -> bool:
    """
    检查是否已连接到 WiFi 网络
    
    Returns:
        True 如果已连接，否则 False
    """
    system = get_platform()
    
    if system == "darwin":  # macOS
        # 使用 system_profiler 检查连接状态
        success, stdout, _ = run_command([
            "system_profiler", "SPAirPortDataType", "-json"
        ])
        if success:
            try:
                import json
                data = json.loads(stdout)
                airport_data = data.get("SPAirPortDataType", [])
                
                for item in airport_data:
                    interfaces = item.get("spairport_airport_interfaces", [])
                    for iface in interfaces:
                        status = iface.get("spairport_status_information")
                        if status == "spairport_status_connected":
                            return True
            except (json.JSONDecodeError, KeyError, TypeError):
                pass
        
        # 备用方法：检查 networksetup
        success, stdout, _ = run_command(["networksetup", "-getairportnetwork", "en0"])
        if success and "You are not associated" not in stdout:
            return True
    
    elif system == "windows":  # Windows
        success, stdout, _ = run_command("netsh wlan show interfaces", shell=True)
        if success and "State" in stdout and "connected" in stdout.lower():
            return True
    
    elif system == "linux":  # Linux
        success, stdout, _ = run_command(["iwgetid", "-r"])
        if success and stdout.strip():
            return True
    
    return False


def main():
    """主函数 - 用于测试"""
    import json
    
    print(f"操作系统：{get_platform()}")
    print()
    
    # 获取当前 WiFi
    try:
        info = get_current_wifi_info()
        print(f"当前 WiFi 信息:")
        print(f"  SSID:   {info['ssid']}")
        print(f"  密码：   {info['password'] or '无法获取'}")
        print(f"  系统：   {info['platform']}")
    except RuntimeError as e:
        print(f"错误：{e}")
    
    print()
    
    # 列出已保存的 WiFi
    wifi_list = get_saved_wifi_list()
    print(f"已保存的 WiFi 网络 ({len(wifi_list)} 个):")
    for i, ssid in enumerate(wifi_list, 1):
        print(f"  {i}. {ssid}")


if __name__ == "__main__":
    main()
