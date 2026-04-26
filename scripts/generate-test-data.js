#!/usr/bin/env node

/**
 * 测试案例数据生成脚本
 * 用于生成 30+ 条测试数据，验证列表分组、搜索和分页功能
 */

import { execSync } from 'child_process';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000/api/test-cases';

// 测试数据模板
const testCases = [
  // 用户管理相关 (10 条)
  {
    apiName: '/api/users',
    title: '查询用户列表 - 正常场景',
    requestParams: { page: 1, size: 10, status: 'active' },
    responseData: { code: 200, data: { list: [], total: 100 } },
    remark: '验证用户列表查询功能正常',
    tags: ['用户管理', '查询', '列表'],
    requestTime: '2024-01-15T10:00:00Z'
  },
  {
    apiName: '/api/users',
    title: '查询用户列表 - 分页参数',
    requestParams: { page: 2, size: 20 },
    responseData: { code: 200, data: { list: [], total: 150 } },
    remark: '验证分页功能',
    tags: ['用户管理', '查询', '分页'],
    requestTime: '2024-01-15T11:00:00Z'
  },
  {
    apiName: '/api/users',
    title: '查询用户列表 - 搜索条件',
    requestParams: { keyword: '张三', email: 'zhangsan@example.com' },
    responseData: { code: 200, data: { list: [{ id: 1, name: '张三' }], total: 1 } },
    remark: '验证搜索功能',
    tags: ['用户管理', '查询', '搜索'],
    requestTime: '2024-01-15T14:00:00Z'
  },
  {
    apiName: '/api/users',
    title: '创建用户 - 正常场景',
    requestParams: { name: '李四', email: 'lisi@example.com', role: 'user' },
    responseData: { code: 200, data: { id: 101, name: '李四' } },
    remark: '验证用户创建功能',
    tags: ['用户管理', '创建'],
    requestTime: '2024-01-16T09:00:00Z'
  },
  {
    apiName: '/api/users',
    title: '创建用户 - 邮箱重复',
    requestParams: { name: '王五', email: 'zhangsan@example.com', role: 'user' },
    responseData: { code: 400, message: '邮箱已被使用' },
    remark: '验证邮箱唯一性校验',
    tags: ['用户管理', '创建', '异常'],
    requestTime: '2024-01-16T10:00:00Z'
  },
  {
    apiName: '/api/users/:id',
    title: '获取用户详情 - 正常场景',
    requestParams: { id: 1 },
    responseData: { code: 200, data: { id: 1, name: '张三', email: 'zhangsan@example.com' } },
    remark: '验证用户详情查询',
    tags: ['用户管理', '查询', '详情'],
    requestTime: '2024-01-16T11:00:00Z'
  },
  {
    apiName: '/api/users/:id',
    title: '获取用户详情 - 用户不存在',
    requestParams: { id: 999 },
    responseData: { code: 404, message: '用户不存在' },
    remark: '验证 404 处理',
    tags: ['用户管理', '查询', '异常'],
    requestTime: '2024-01-16T14:00:00Z'
  },
  {
    apiName: '/api/users/:id',
    title: '更新用户信息 - 正常场景',
    requestParams: { id: 1, name: '张三三', phone: '13800138000' },
    responseData: { code: 200, data: { id: 1, name: '张三三' } },
    remark: '验证用户信息更新',
    tags: ['用户管理', '更新'],
    requestTime: '2024-01-17T09:00:00Z'
  },
  {
    apiName: '/api/users/:id',
    title: '删除用户 - 正常场景',
    requestParams: { id: 100 },
    responseData: { code: 200, data: { success: true } },
    remark: '验证用户删除功能',
    tags: ['用户管理', '删除'],
    requestTime: '2024-01-17T10:00:00Z'
  },
  {
    apiName: '/api/users/batch',
    title: '批量删除用户',
    requestParams: { ids: [101, 102, 103] },
    responseData: { code: 200, data: { deleted: 3 } },
    remark: '验证批量删除功能',
    tags: ['用户管理', '删除', '批量'],
    requestTime: '2024-01-17T11:00:00Z'
  },

  // 订单管理相关 (10 条)
  {
    apiName: '/api/orders',
    title: '查询订单列表 - 全部订单',
    requestParams: { page: 1, size: 10 },
    responseData: { code: 200, data: { list: [], total: 500 } },
    remark: '验证订单列表查询',
    tags: ['订单管理', '查询', '列表'],
    requestTime: '2024-01-18T09:00:00Z'
  },
  {
    apiName: '/api/orders',
    title: '查询订单列表 - 按状态筛选',
    requestParams: { status: 'pending', page: 1 },
    responseData: { code: 200, data: { list: [], total: 50 } },
    remark: '验证订单状态筛选',
    tags: ['订单管理', '查询', '筛选'],
    requestTime: '2024-01-18T10:00:00Z'
  },
  {
    apiName: '/api/orders',
    title: '查询订单列表 - 按时间范围',
    requestParams: { startTime: '2024-01-01', endTime: '2024-01-31' },
    responseData: { code: 200, data: { list: [], total: 200 } },
    remark: '验证时间范围查询',
    tags: ['订单管理', '查询', '时间筛选'],
    requestTime: '2024-01-18T11:00:00Z'
  },
  {
    apiName: '/api/orders',
    title: '创建订单 - 正常场景',
    requestParams: { userId: 1, items: [{ productId: 1, quantity: 2 }], address: '北京市朝阳区' },
    responseData: { code: 200, data: { orderId: 'ORD20240118001', totalAmount: 299.00 } },
    remark: '验证订单创建流程',
    tags: ['订单管理', '创建'],
    requestTime: '2024-01-18T14:00:00Z'
  },
  {
    apiName: '/api/orders',
    title: '创建订单 - 库存不足',
    requestParams: { userId: 1, items: [{ productId: 1, quantity: 999 }] },
    responseData: { code: 400, message: '库存不足' },
    remark: '验证库存校验',
    tags: ['订单管理', '创建', '异常'],
    requestTime: '2024-01-18T15:00:00Z'
  },
  {
    apiName: '/api/orders/:id',
    title: '获取订单详情',
    requestParams: { id: 'ORD20240118001' },
    responseData: { code: 200, data: { orderId: 'ORD20240118001', status: 'pending', items: [] } },
    remark: '验证订单详情查询',
    tags: ['订单管理', '查询', '详情'],
    requestTime: '2024-01-19T09:00:00Z'
  },
  {
    apiName: '/api/orders/:id/cancel',
    title: '取消订单 - 待支付状态',
    requestParams: { id: 'ORD20240118001', reason: '用户主动取消' },
    responseData: { code: 200, data: { success: true } },
    remark: '验证订单取消功能',
    tags: ['订单管理', '更新', '取消'],
    requestTime: '2024-01-19T10:00:00Z'
  },
  {
    apiName: '/api/orders/:id/cancel',
    title: '取消订单 - 已发货状态',
    requestParams: { id: 'ORD20240118002', reason: '用户主动取消' },
    responseData: { code: 400, message: '已发货订单不能取消' },
    remark: '验证订单状态限制',
    tags: ['订单管理', '更新', '异常'],
    requestTime: '2024-01-19T11:00:00Z'
  },
  {
    apiName: '/api/orders/:id/refund',
    title: '申请退款 - 正常场景',
    requestParams: { id: 'ORD20240118003', amount: 299.00, reason: '商品质量问题' },
    responseData: { code: 200, data: { refundId: 'REF20240119001' } },
    remark: '验证退款申请流程',
    tags: ['订单管理', '售后', '退款'],
    requestTime: '2024-01-19T14:00:00Z'
  },
  {
    apiName: '/api/orders/export',
    title: '导出订单数据',
    requestParams: { startTime: '2024-01-01', endTime: '2024-01-31', format: 'excel' },
    responseData: { code: 200, data: { downloadUrl: 'http://xxx/orders.xlsx' } },
    remark: '验证订单导出功能',
    tags: ['订单管理', '导出'],
    requestTime: '2024-01-19T15:00:00Z'
  },

  // 商品管理相关 (8 条)
  {
    apiName: '/api/products',
    title: '查询商品列表 - 全部商品',
    requestParams: { page: 1, size: 20 },
    responseData: { code: 200, data: { list: [], total: 1000 } },
    remark: '验证商品列表查询',
    tags: ['商品管理', '查询', '列表'],
    requestTime: '2024-01-20T09:00:00Z'
  },
  {
    apiName: '/api/products',
    title: '查询商品列表 - 按分类筛选',
    requestParams: { categoryId: 10, page: 1 },
    responseData: { code: 200, data: { list: [], total: 100 } },
    remark: '验证商品分类筛选',
    tags: ['商品管理', '查询', '分类'],
    requestTime: '2024-01-20T10:00:00Z'
  },
  {
    apiName: '/api/products',
    title: '查询商品列表 - 价格区间',
    requestParams: { minPrice: 100, maxPrice: 500 },
    responseData: { code: 200, data: { list: [], total: 50 } },
    remark: '验证价格区间筛选',
    tags: ['商品管理', '查询', '价格'],
    requestTime: '2024-01-20T11:00:00Z'
  },
  {
    apiName: '/api/products',
    title: '创建商品 - 正常场景',
    requestParams: { name: '测试商品', price: 299.00, stock: 100, categoryId: 10 },
    responseData: { code: 200, data: { productId: 'PROD20240120001' } },
    remark: '验证商品创建功能',
    tags: ['商品管理', '创建'],
    requestTime: '2024-01-20T14:00:00Z'
  },
  {
    apiName: '/api/products/:id',
    title: '更新商品信息',
    requestParams: { id: 'PROD20240120001', price: 199.00, stock: 150 },
    responseData: { code: 200, data: { success: true } },
    remark: '验证商品信息更新',
    tags: ['商品管理', '更新'],
    requestTime: '2024-01-21T09:00:00Z'
  },
  {
    apiName: '/api/products/:id',
    title: '删除商品',
    requestParams: { id: 'PROD20240120002' },
    responseData: { code: 200, data: { success: true } },
    remark: '验证商品删除功能',
    tags: ['商品管理', '删除'],
    requestTime: '2024-01-21T10:00:00Z'
  },
  {
    apiName: '/api/products/:id/stock',
    title: '更新商品库存',
    requestParams: { id: 'PROD20240120001', stock: 200, operation: 'add' },
    responseData: { code: 200, data: { newStock: 350 } },
    remark: '验证库存更新功能',
    tags: ['商品管理', '更新', '库存'],
    requestTime: '2024-01-21T11:00:00Z'
  },
  {
    apiName: '/api/products/search',
    title: '商品搜索 - 关键词匹配',
    requestParams: { keyword: '手机', page: 1 },
    responseData: { code: 200, data: { list: [], total: 30 } },
    remark: '验证商品搜索功能',
    tags: ['商品管理', '查询', '搜索'],
    requestTime: '2024-01-21T14:00:00Z'
  },

  // 权限管理相关 (5 条)
  {
    apiName: '/api/roles',
    title: '查询角色列表',
    requestParams: { page: 1, size: 10 },
    responseData: { code: 200, data: { list: [], total: 5 } },
    remark: '验证角色列表查询',
    tags: ['权限管理', '查询', '角色'],
    requestTime: '2024-01-22T09:00:00Z'
  },
  {
    apiName: '/api/roles',
    title: '创建角色',
    requestParams: { name: '测试角色', permissions: ['user.read', 'user.write'] },
    responseData: { code: 200, data: { roleId: 'ROLE001' } },
    remark: '验证角色创建功能',
    tags: ['权限管理', '创建', '角色'],
    requestTime: '2024-01-22T10:00:00Z'
  },
  {
    apiName: '/api/roles/:id/permissions',
    title: '更新角色权限',
    requestParams: { id: 'ROLE001', permissions: ['user.read', 'user.write', 'user.delete'] },
    responseData: { code: 200, data: { success: true } },
    remark: '验证权限更新功能',
    tags: ['权限管理', '更新', '权限'],
    requestTime: '2024-01-22T11:00:00Z'
  },
  {
    apiName: '/api/users/:id/roles',
    title: '分配用户角色',
    requestParams: { userId: 1, roleIds: ['ROLE001', 'ROLE002'] },
    responseData: { code: 200, data: { success: true } },
    remark: '验证角色分配功能',
    tags: ['权限管理', '更新', '用户角色'],
    requestTime: '2024-01-22T14:00:00Z'
  },
  {
    apiName: '/api/permissions',
    title: '查询权限列表',
    requestParams: { type: 'menu' },
    responseData: { code: 200, data: { list: [], total: 20 } },
    remark: '验证权限列表查询',
    tags: ['权限管理', '查询', '权限'],
    requestTime: '2024-01-22T15:00:00Z'
  }
];

/**
 * 发送请求创建测试案例
 */
async function createTestCase(testCase) {
  try {
    const jsonData = JSON.stringify(testCase).replace(/'/g, "'\"'\"'");
    const command = `curl -s -X POST ${BASE_URL} -H "Content-Type: application/json" -d '${jsonData}'`;
    const result = execSync(command, { encoding: 'utf8' });
    const parsed = JSON.parse(result);

    if (parsed.success) {
      console.log(`✅ 创建成功：${testCase.title}`);
      return true;
    } else {
      console.error(`❌ 创建失败：${testCase.title} - ${parsed.error}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ 请求错误：${testCase.title} - ${err.message}`);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始生成测试数据...\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`[${i + 1}/${testCases.length}] 正在创建：${testCase.title}`);
    
    const success = await createTestCase(testCase);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // 添加短暂延迟，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ 测试数据生成完成！`);
  console.log(`📊 总计：${testCases.length} 条`);
  console.log(`✅ 成功：${successCount} 条`);
  console.log(`❌ 失败：${failCount} 条`);
  console.log('='.repeat(50));
  console.log('\n💡 提示：访问 http://localhost:3000/test-case-manager 查看测试数据');
  console.log('\n📋 测试建议:');
  console.log('  1. 验证分页功能 (共 33 条数据，每页 20 条)');
  console.log('  2. 验证搜索功能 (搜索 "用户"、"订单"、"商品" 等关键词)');
  console.log('  3. 验证接口名分组筛选 (共有 4 个接口分组)');
  console.log('  4. 验证标签过滤 (共有 20+ 个不同标签)');
  console.log('');
}

// 执行主函数
main().catch(err => {
  console.error('💥 执行出错:', err);
  process.exit(1);
});
