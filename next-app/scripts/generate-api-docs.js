#!/usr/bin/env node

/**
 * API 文档生成脚本
 *
 * 根据 Vercel Best Practices 的 bundle-analyzable-paths 规则，
 * 我们使用静态分析来自动生成 API 文档，避免手动维护。
 *
 * 使用方法：
 * pnpm generate-api-docs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const pagesApiDir = path.join(rootDir, 'pages/api');
// 输出到 public 目录，这样 Next.js 才能正确提供静态文件访问
const outputPath = path.join(rootDir, 'public/swagger-output.json');

// API 基础信息
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Next App API Documentation',
    description: '基于 Next.js 的后台管理系统 API 接口文档',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3030/next/api',
      description: '本地开发环境',
    },
  ],
  tags: [
    { name: 'Dashboard', description: '控制台相关接口' },
    { name: 'Orders', description: '订单管理相关接口' },
    { name: 'Mock', description: '模拟数据接口' },
  ],
  paths: {},
  components: {
    schemas: {},
  },
};

/**
 * 解析 API 文件，提取接口信息
 */
function parseApiFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.ts');

  // 跳过非 API 文件
  if (fileName.startsWith('_') || fileName === 'middleware') {
    return;
  }

  // 将文件路径转换为 API 路径
  const apiPath = relativePath
    .replace(/\\/g, '/')
    .replace('/pages/api', '')
    .replace('.ts', '')
    .replace('.js', '')
    .replace('/index', '') || '/';

  const fullPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;

  console.log(`📄 解析 API: ${fullPath}`);

  // 根据文件名和类型推断 API 信息
  let operation = {
    summary: fileName.replace(/-/g, ' ').replace(/_/g, ' '),
    description: `API endpoint for ${fileName}`,
    tags: ['General'],
    responses: {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
  };

  // 特殊处理已知的 API
  if (fileName === 'dashboard-stats') {
    operation = {
      summary: '获取控制台统计数据',
      description: '返回控制台的各类统计指标，包括订单数、销售额、用户数等',
      tags: ['Dashboard'],
      responses: {
        '200': {
          description: '成功返回统计数据',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DashboardStats',
              },
            },
          },
        },
      },
    };

    // 添加 DashboardStats schema
    swaggerSpec.components.schemas.DashboardStats = {
      type: 'object',
      properties: {
        totalOrders: { type: 'number', description: '总订单数', example: 1128 },
        totalSales: { type: 'number', description: '总销售额', example: 128936.00 },
        activeUsers: { type: 'number', description: '活跃用户数', example: 8932 },
        conversionRate: { type: 'number', description: '转化率', example: 23.8 },
        pendingOrders: { type: 'number', description: '待处理订单数', example: 12 },
        processingOrders: { type: 'number', description: '处理中订单数', example: 35 },
        deliveredOrders: { type: 'number', description: '已送达订单数', example: 45 },
        cancelledOrders: { type: 'number', description: '已取消订单数', example: 3 },
        orderGrowth: { type: 'number', description: '订单增长率 (%)', example: 12.5 },
        salesTarget: { type: 'number', description: '销售目标', example: 200000 },
        userGrowth: { type: 'number', description: '用户增长数', example: 256 },
        targetConversion: { type: 'number', description: '目标转化率 (%)', example: 30 },
      },
      required: ['totalOrders', 'totalSales', 'activeUsers', 'conversionRate'],
    };
  } else if (fileName === 'mock-orders') {
    operation = {
      summary: '获取模拟订单列表',
      description: '返回模拟的订单数据列表，支持分页和数量控制',
      tags: ['Orders', 'Mock'],
      parameters: [
        {
          name: 'count',
          in: 'query',
          description: '返回的订单数量',
          required: false,
          schema: {
            type: 'integer',
            default: 150,
            minimum: 1,
            maximum: 1000,
          },
        },
      ],
      responses: {
        '200': {
          description: '成功返回订单列表',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
        },
      },
    };

    // 添加 Order schema
    swaggerSpec.components.schemas.Order = {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: '订单 ID' },
        orderNo: { type: 'string', description: '订单编号', example: 'ORD12345678' },
        customerName: { type: 'string', description: '客户姓名' },
        customerPhone: { type: 'string', description: '客户电话', example: '13800138000' },
        totalAmount: { type: 'number', description: '订单金额', example: 1299.00 },
        status: {
          type: 'string',
          enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          description: '订单状态',
        },
        createdAt: { type: 'string', format: 'date-time', description: '创建时间' },
        shippingAddress: { type: 'string', description: '收货地址' },
      },
      required: ['id', 'orderNo', 'customerName', 'totalAmount', 'status', 'createdAt'],
    };
  }

  // 设置到 paths 中
  swaggerSpec.paths[fullPath] = {
    get: operation,
  };
}

/**
 * 递归扫描 API 目录
 */
function scanApiDir(dir, basePath = '') {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️  API 目录不存在：${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 递归扫描子目录
      scanApiDir(filePath, path.join(basePath, file));
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      // 解析 API 文件
      parseApiFile(filePath, path.join(basePath, file));
    }
  });
}

// 执行扫描
console.log('🚀 开始生成 API 文档...\n');
scanApiDir(pagesApiDir);

// 写入输出文件
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log('\n✅ API 文档生成完成！');
console.log(`📄 输出文件：${outputPath}`);
console.log(`🌐 访问地址：http://localhost:3030/next/api-docs\n`);
console.log('📊 生成的接口数量:', Object.keys(swaggerSpec.paths).length);
console.log('📦 生成的 Schema 数量:', Object.keys(swaggerSpec.components.schemas).length);
