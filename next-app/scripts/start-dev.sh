#!/bin/bash

# 测试案例管理系统 - 快速启动脚本
# 自动启动后端 API 和 Next.js 前端

set -e

echo "🚀 启动测试案例管理系统..."
echo ""

# 检查端口占用
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    return 0  # 端口被占用
  else
    return 1  # 端口未被占用
  fi
}

# 获取项目根目录（脚本所在目录的父目录）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NEXT_APP_DIR="$PROJECT_ROOT/next-app"

echo "📁 项目根目录：$PROJECT_ROOT"
echo "📁 Next.js 目录：$NEXT_APP_DIR"
echo ""

# 检查后端服务（端口 3000）
echo "🔍 检查后端服务..."
if check_port 3000; then
  echo "✅ 后端服务已在端口 3000 运行"
  BACKEND_RUNNING=true
else
  echo "❌ 后端服务未运行"
  BACKEND_RUNNING=false
fi
echo ""

# 检查 Next.js 服务（端口 3030）
echo "🔍 检查 Next.js 服务..."
if check_port 3030; then
  echo "✅ Next.js 服务已在端口 3030 运行"
  FRONTEND_RUNNING=true
else
  echo "❌ Next.js 服务未运行"
  FRONTEND_RUNNING=false
fi
echo ""

# 启动服务
if [ "$BACKEND_RUNNING" = false ]; then
  echo "🚀 启动后端服务..."
  echo "   命令：node bin/dev.js -p 3000 -o"
  echo "   目录：$PROJECT_ROOT"
  echo ""
  
  # 在后台启动后端服务
  cd "$PROJECT_ROOT"
  node bin/dev.js -p 3000 -o &
  BACKEND_PID=$!
  echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
  echo ""
  
  # 等待后端服务启动
  echo "⏳ 等待后端服务就绪..."
  sleep 3
fi

if [ "$FRONTEND_RUNNING" = false ]; then
  echo "🚀 启动 Next.js 前端服务..."
  echo "   命令：pnpm dev"
  echo "   目录：$NEXT_APP_DIR"
  echo ""
  
  # 在后台启动 Next.js 服务
  cd "$NEXT_APP_DIR"
  pnpm dev &
  FRONTEND_PID=$!
  echo "✅ Next.js 服务已启动 (PID: $FRONTEND_PID)"
  echo ""
  
  # 等待 Next.js 服务启动
  echo "⏳ 等待 Next.js 服务就绪..."
  sleep 5
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 服务启动完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " 访问地址："
echo "   前端页面：http://localhost:3030/admin/test-cases"
echo "   后端 API：http://localhost:3000/api/test-cases"
echo ""
echo "📊 测试数据："
echo "   已预置 33 条测试数据（用户管理、订单管理、商品管理、权限管理）"
echo ""
echo "🛑 停止服务："
echo "   方式 1: 按 Ctrl+C 停止当前脚本（如果在前景运行）"
echo "   方式 2: 手动杀死进程："
echo "         kill $BACKEND_PID  # 后端服务"
echo "         kill $FRONTEND_PID # Next.js 服务"
echo "   方式 3: 使用命令："
echo "         lsof -ti:3000 | xargs kill -9"
echo "         lsof -ti:3030 | xargs kill -9"
echo ""
echo "📖 开发文档："
echo "   $NEXT_APP_DIR/docs/TEST_CASE_SETUP.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 如果是在后台启动的服务，提示用户如何查看日志
if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
  echo "💡 提示：服务已在后台启动，日志将输出到对应终端"
  echo ""
  echo "   查看后端日志：tail -f <后端日志文件>"
  echo "   查看前端日志：tail -f <前端日志文件>"
  echo ""
fi

# 保持脚本运行（如果在前景）
if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
  echo "📌 按 Ctrl+C 停止所有服务并退出..."
  echo ""
  
  # 捕获退出信号
  trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ 所有服务已停止'; exit 0" INT TERM EXIT
  
  # 等待用户中断
  wait
fi
