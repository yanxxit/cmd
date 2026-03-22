#!/bin/bash

echo "======================================"
echo "  Next.js 16 + React 19 升级验证"
echo "======================================"
echo ""

# 检查 Node.js 版本
echo "1. 检查 Node.js 版本..."
NODE_VERSION=$(node -v)
echo "   当前版本：$NODE_VERSION"
if [[ $(node -v | cut -d'.' -f1 | cut -d'v' -f2) -ge 20 ]]; then
    echo "   ✅ Node.js 版本符合要求 (>=20.0.0)"
else
    echo "   ❌ Node.js 版本不符合要求 (>=20.0.0)"
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

# 检查 package.json 版本
echo "3. 检查 package.json..."
NEXT_VERSION=$(node -e "console.log(require('./package.json').dependencies.next)")
REACT_VERSION=$(node -e "console.log(require('./package.json').dependencies.react)")
echo "   Next.js 版本：$NEXT_VERSION"
echo "   React 版本：$REACT_VERSION"

if [[ "$NEXT_VERSION" == "16"* ]]; then
    echo "   ✅ Next.js 16 已安装"
else
    echo "   ❌ Next.js 版本不正确"
    exit 1
fi

if [[ "$REACT_VERSION" == *"19"* ]]; then
    echo "   ✅ React 19 已安装"
else
    echo "   ❌ React 版本不正确"
    exit 1
fi
echo ""

# 检查依赖安装
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
        VERSION=$(node -e "console.log(require('./node_modules/$1/package.json').version)")
        echo "   ✅ $1@$VERSION"
    else
        echo "   ❌ $1 未安装"
        return 1
    fi
}

check_dep "next"
check_dep "react"
check_dep "react-dom"
check_dep "antd"
check_dep "@ant-design/icons"
echo ""

# 检查配置文件
echo "6. 检查配置文件..."
if [ -f "next.config.mjs" ]; then
    echo "   ✅ next.config.mjs 存在"
else
    echo "   ❌ next.config.mjs 不存在"
    exit 1
fi

if [ -f "tsconfig.json" ]; then
    echo "   ✅ tsconfig.json 存在"
else
    echo "   ❌ tsconfig.json 不存在"
    exit 1
fi

if [ -f "eslint.config.mjs" ]; then
    echo "   ✅ eslint.config.mjs 存在"
else
    echo "   ❌ eslint.config.mjs 不存在"
    exit 1
fi
echo ""

# 检查 TypeScript 配置
echo "7. 检查 TypeScript 配置..."
TSX_TARGET=$(node -e "console.log(require('./tsconfig.json').compilerOptions.target)")
echo "   TypeScript target: $TSX_TARGET"
if [[ "$TSX_TARGET" == "ES2022" ]]; then
    echo "   ✅ TypeScript 配置正确"
else
    echo "   ⚠️  TypeScript target 建议更新为 ES2022"
fi
echo ""

# 运行类型检查
echo "8. 运行 TypeScript 类型检查..."
if pnpm type-check >/dev/null 2>&1; then
    echo "   ✅ TypeScript 类型检查通过"
else
    echo "   ⚠️  TypeScript 类型检查未通过（可选）"
fi
echo ""

# 总结
echo "======================================"
echo "  升级验证完成"
echo "======================================"
echo ""
echo "项目信息:"
node -e "
const pkg = require('./package.json');
console.log('  项目名称:', pkg.name);
console.log('  版本:', pkg.version);
console.log('  Next.js:', pkg.dependencies.next);
console.log('  React:', pkg.dependencies.react);
console.log('  生产依赖:', Object.keys(pkg.dependencies).length);
console.log('  开发依赖:', Object.keys(pkg.devDependencies).length);
"
echo ""
echo "✅ Next.js 16 + React 19 升级成功！"
echo ""
echo "下一步:"
echo "  1. 运行 'pnpm dev' 启动开发服务器"
echo "  2. 运行 'pnpm build' 构建生产版本"
echo "  3. 查看 UPGRADE_TO_NEXTJS16.md 了解更多详情"
echo ""
