#!/bin/bash

# 验证代理配置是否正常工作

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 验证测试案例管理系统代理配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查端口
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    return 0
  else
    return 1
  fi
}

# 测试 1: 检查后端服务
echo "📌 测试 1: 检查后端服务（端口 3000）"
if check_port 3000; then
  echo -e "${GREEN}✅ 后端服务正在运行${NC}"
  
  # 测试 API 响应
  echo "   测试 API 响应..."
  BACKEND_RESPONSE=$(curl -s http://localhost:3000/api/test-cases 2>&1)
  
  if echo "$BACKEND_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 后端 API 响应正常${NC}"
  else
    echo -e "${YELLOW}⚠️  后端 API 响应异常，请检查日志${NC}"
  fi
else
  echo -e "${RED}❌ 后端服务未运行${NC}"
  echo "   请运行：node bin/dev.js -p 3000 -o"
fi
echo ""

# 测试 2: 检查 Next.js 服务
echo "📌 测试 2: 检查 Next.js 服务（端口 3030）"
if check_port 3030; then
  echo -e "${GREEN}✅ Next.js 服务正在运行${NC}"
  
  # 测试代理是否生效
  echo "   测试代理配置..."
  PROXY_RESPONSE=$(curl -s http://localhost:3030/api/test-cases 2>&1)
  
  if echo "$PROXY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 代理配置生效，请求已正确转发到后端${NC}"
  else
    echo -e "${YELLOW}⚠️  代理配置可能未生效，请检查 next.config.mjs${NC}"
  fi
else
  echo -e "${RED}❌ Next.js 服务未运行${NC}"
  echo "   请运行：cd next-app && pnpm dev"
fi
echo ""

# 测试 3: 检查配置文件
echo "📌 测试 3: 检查 next.config.mjs 配置"
CONFIG_FILE="next.config.mjs"

if [ -f "$CONFIG_FILE" ]; then
  echo -e "${GREEN}✅ 配置文件存在${NC}"
  
  # 检查 rewrites 配置
  if grep -q "rewrites" "$CONFIG_FILE" && grep -q "localhost:3000" "$CONFIG_FILE"; then
    echo -e "${GREEN}✅ 代理配置正确（目标端口：3000）${NC}"
  else
    echo -e "${RED}❌ 代理配置可能有误，请检查 next.config.mjs${NC}"
    echo ""
    echo "   期望配置："
    echo "   async rewrites() {"
    echo "     if (isDev) {"
    echo "       return ["
    echo "         {"
    echo "           source: '/api/:path*',"
    echo "           destination: 'http://localhost:3000/api/:path*',"
    echo "         },"
    echo "       ];"
    echo "     }"
    echo "     return [];"
    echo "   }"
  fi
else
  echo -e "${RED}❌ 配置文件不存在${NC}"
fi
echo ""

# 测试 4: 检查前端页面
echo "📌 测试 4: 检查前端页面文件"
PAGE_FILE="pages/admin/test-cases/index.tsx"

if [ -f "$PAGE_FILE" ]; then
  echo -e "${GREEN}✅ 前端页面文件存在${NC}"
  
  # 检查是否使用相对路径请求 API
  if grep -q "/api/test-cases" "$PAGE_FILE"; then
    echo -e "${GREEN}✅ 前端使用相对路径请求 API${NC}"
  else
    echo -e "${YELLOW}⚠️  前端可能使用了绝对路径，请检查代码${NC}"
  fi
else
  echo -e "${RED}❌ 前端页面文件不存在${NC}"
fi
echo ""

# 测试 5: 检查组件文件
echo "📌 测试 5: 检查组件文件完整性"
COMPONENTS=(
  "components/admin/test-case/TestCaseTable.tsx"
  "components/admin/test-case/TestCaseFilters.tsx"
  "components/admin/test-case/TestCaseModal.tsx"
  "components/admin/test-case/TestCaseDetailModal.tsx"
  "components/common/request.ts"
)

ALL_COMPONENTS_EXIST=true
for component in "${COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo -e "${GREEN}✅ $component${NC}"
  else
    echo -e "${RED}❌ $component (缺失)${NC}"
    ALL_COMPONENTS_EXIST=false
  fi
done
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 验证总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if check_port 3000 && check_port 3030 && [ -f "$CONFIG_FILE" ] && [ "$ALL_COMPONENTS_EXIST" = true ]; then
  echo -e "${GREEN}✨ 所有检查通过！系统已准备就绪${NC}"
  echo ""
  echo "🌐 访问地址："
  echo "   前端页面：http://localhost:3030/admin/test-cases"
  echo "   后端 API：http://localhost:3000/api/test-cases"
  echo ""
  echo "💡 提示："
  echo "   如果页面显示空白或无数据，请："
  echo "   1. 打开浏览器开发者工具"
  echo "   2. 查看 Network 标签"
  echo "   3. 检查 /api/test-cases 请求是否成功"
  echo ""
  exit 0
else
  echo -e "${YELLOW}⚠️  部分检查未通过，请先修复上述问题${NC}"
  echo ""
  
  if ! check_port 3000; then
    echo "❌ 后端服务未启动"
    echo "   解决方案：node bin/dev.js -p 3000 -o"
    echo ""
  fi
  
  if ! check_port 3030; then
    echo "❌ Next.js 服务未启动"
    echo "   解决方案：cd next-app && pnpm dev"
    echo ""
  fi
  
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ 配置文件不存在"
    echo "   解决方案：检查 next.config.mjs 文件"
    echo ""
  fi
  
  if [ "$ALL_COMPONENTS_EXIST" = false ]; then
    echo "❌ 部分组件文件缺失"
    echo "   解决方案：检查组件文件路径"
    echo ""
  fi
  
  exit 1
fi
