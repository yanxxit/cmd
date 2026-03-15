#!/usr/bin/env python3
"""
WiFi 密码获取命令行工具 - Python 实现

使用方法：
    python bin/wifi-py.py                   - 获取当前连接的 WiFi 密码
    python bin/wifi-py.py --current         - 获取当前连接的 WiFi 密码
    python bin/wifi-py.py --list            - 列出所有已保存的 WiFi
    python bin/wifi-py.py --ssid <WiFi 名称> - 获取指定 WiFi 的密码
    python bin/wifi-py.py --json            - 以 JSON 格式输出
"""

import argparse
import json
import sys
from pathlib import Path

# 添加 src 目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from wifi_python import (
    get_current_wifi_info,
    get_saved_wifi_list,
    get_wifi_password
)


def get_platform_name(platform: str) -> str:
    """获取平台中文名称"""
    names = {
        "darwin": "macOS",
        "windows": "Windows",
        "linux": "Linux"
    }
    return names.get(platform, platform)


def handle_current(is_json: bool = False):
    """处理获取当前 WiFi 信息"""
    try:
        info = get_current_wifi_info()
        
        if is_json:
            print(json.dumps(info, indent=2, ensure_ascii=False))
        else:
            print("📶 当前 WiFi 信息:")
            print(f"  SSID:     {info['ssid']}")
            if info['password']:
                print(f"  密码：     {info['password']}")
            else:
                print(f"  密码：     无法获取")
                print("\n提示：可能需要管理员权限才能获取 WiFi 密码")
                if info['platform'] == 'linux':
                    print("尝试使用 sudo: sudo python bin/wifi-py.py --current")
            print(f"  系统：     {get_platform_name(info['platform'])}")
    except RuntimeError as e:
        if is_json:
            print(json.dumps({"error": str(e)}, indent=2, ensure_ascii=False))
        else:
            print(f"❌ 错误：{e}")
        sys.exit(1)


def handle_get_password(ssid: str, is_json: bool = False):
    """处理获取指定 WiFi 密码"""
    password = get_wifi_password(ssid)
    
    if is_json:
        print(json.dumps({
            "ssid": ssid,
            "password": password
        }, indent=2, ensure_ascii=False))
    else:
        if password:
            print("✅ 找到 WiFi 密码:")
            print(f"  SSID:     {ssid}")
            print(f"  密码：     {password}")
        else:
            print(f"❌ 未找到 WiFi \"{ssid}\" 的密码")
            print("提示：可能需要管理员权限")
            sys.exit(1)


def handle_list(is_json: bool = False):
    """处理列出所有 WiFi"""
    wifi_list = get_saved_wifi_list()
    
    if is_json:
        print(json.dumps({
            "count": len(wifi_list),
            "networks": wifi_list
        }, indent=2, ensure_ascii=False))
    else:
        print(f"📶 已保存的 WiFi 网络 ({len(wifi_list)} 个):")
        if len(wifi_list) == 0:
            print("  没有找到已保存的 WiFi 网络")
        else:
            for i, ssid in enumerate(wifi_list, 1):
                print(f"  {i}. {ssid}")


def main():
    parser = argparse.ArgumentParser(
        description="获取当前系统的 WiFi 密码",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python bin/wifi-py.py                    获取当前 WiFi 密码
  python bin/wifi-py.py -l                 列出所有已保存的 WiFi
  python bin/wifi-py.py -s "MyWiFi"        获取指定 WiFi 密码
  python bin/wifi-py.py -j                 以 JSON 格式输出
        """
    )
    
    parser.add_argument(
        "-c", "--current",
        action="store_true",
        help="获取当前连接的 WiFi 密码"
    )
    
    parser.add_argument(
        "-l", "--list",
        action="store_true",
        help="列出所有已保存的 WiFi 网络"
    )
    
    parser.add_argument(
        "-s", "--ssid",
        metavar="NAME",
        help="获取指定 WiFi 的密码"
    )
    
    parser.add_argument(
        "-j", "--json",
        action="store_true",
        help="以 JSON 格式输出"
    )
    
    args = parser.parse_args()
    
    # 如果没有指定任何选项，默认获取当前 WiFi 密码
    if not args.current and not args.list and not args.ssid:
        args.current = True
    
    if args.list:
        handle_list(args.json)
    elif args.ssid:
        handle_get_password(args.ssid, args.json)
    elif args.current:
        handle_current(args.json)


if __name__ == "__main__":
    main()
