#!/bin/bash

# package.json 兼容性校验脚本

echo "======================================"
echo "  package.json 兼容性校验"
echo "======================================"
echo ""

# 检查 Node.js 版本
echo "1. 检查 Node.js 版本..."
NODE_VERSION=$(node -v)
echo "   当前版本：$NODE_VERSION"
if [[ $(node -v | cut -d'.' -f1 | cut -d'v' -f2) -ge 18 ]]; then
    echo "   ✅ Node.js 版本符合要求 (>=18.0.0)"
else
    echo "   ❌ Node.js 版本不符合要求 (>=18.0.0)"
    exit 1
fi
echo ""

# 检查 pnpm 版本
echo "2. 检查 pnpm 版本..."
PNPM_VERSION=$(pnpm -v)
echo "   当前版本：$PNPM_VERSION"
if [[ $(pnpm -v | cut -d'.' -f1) -ge 10 ]]; then
    echo "   ✅ pnpm 版本符合要求 (>=10.0.0)"
else
    echo "   ❌ pnpm 版本不符合要求 (>=10.0.0)"
    exit 1
fi
echo ""

# 检查 package.json 格式
echo "3. 检查 package.json 格式..."
if node -e "require('./package.json')" 2>/dev/null; then
    echo "   ✅ package.json 格式正确"
else
    echo "   ❌ package.json 格式错误"
    exit 1
fi
echo ""

# 检查依赖是否安装
echo "4. 检查依赖安装..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules 存在"
else
    echo "   ❌ node_modules 不存在"
    echo "   运行：pnpm install"
    exit 1
fi
echo ""

# 检查关键依赖
echo "5. 检查关键依赖..."
check_dep() {
    if [ -d "node_modules/$1" ]; then
        echo "   ✅ $1 已安装"
    else
        echo "   ❌ $1 未安装"
        return 1
    fi
}

check_dep "react"
check_dep "react-dom"
check_dep "next"
check_dep "antd"
check_dep "@ant-design/icons"
echo ""

# 检查 TypeScript 配置
echo "6. 检查 TypeScript 配置..."
if [ -f "tsconfig.json" ]; then
    echo "   ✅ tsconfig.json 存在"
else
    echo "   ❌ tsconfig.json 不存在"
    exit 1
fi
echo ""

# 检查 Next.js 配置
echo "7. 检查 Next.js 配置..."
if [ -f "next.config.mjs" ]; then
    echo "   ✅ next.config.mjs 存在"
elif [ -f "next.config.js" ]; then
    echo "   ✅ next.config.js 存在"
else
    echo "   ❌ Next.js 配置文件不存在"
    exit 1
fi
echo ""

# 运行类型检查（可选）
echo "8. 运行 TypeScript 类型检查..."
if pnpm type-check >/dev/null 2>&1; then
    echo "   ✅ TypeScript 类型检查通过"
else
    echo "   ⚠️  TypeScript 类型检查未通过（可选）"
fi
echo ""

# 运行 ESLint 检查（可选）
echo "9. 运行 ESLint 代码检查..."
if pnpm lint >/dev/null 2>&1; then
    echo "   ✅ ESLint 检查通过"
else
    echo "   ⚠️  ESLint 检查未通过（可选）"
fi
echo ""

# 总结
echo "======================================"
echo "  校验完成"
echo "======================================"
echo ""
echo "项目信息:"
node -e "
const pkg = require('./package.json');
console.log('  项目名称:', pkg.name);
console.log('  版本:', pkg.version);
console.log('  生产依赖:', Object.keys(pkg.dependencies).length);
console.log('  开发依赖:', Object.keys(pkg.devDependencies).length);
"
echo ""
echo "✅ 所有检查完成！"
