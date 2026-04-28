import type { NextApiRequest, NextApiResponse } from 'next';

export interface DashboardStats {
  totalOrders: number;
  totalSales: number;
  activeUsers: number;
  conversionRate: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  orderGrowth: number;
  salesTarget: number;
  userGrowth: number;
  targetConversion: number;
}

/**
 * 获取控制台统计数据 API
 * 
 * 返回控制台的各类关键业务指标，包括订单统计、销售数据、用户活跃度等。
 * 这些数据通常用于仪表盘展示和数据分析。
 * 
 * @method GET
 * @route /api/dashboard-stats
 * 
 * @returns {DashboardStats} 200 - 成功返回统计数据对象
 * 
 * @example
 * // 请求示例
 * GET /api/dashboard-stats
 * 
 * @example
 * // 响应示例 (200 OK)
 * {
 *   "totalOrders": 1128,
 *   "totalSales": 128936.00,
 *   "activeUsers": 8932,
 *   "conversionRate": 23.8,
 *   "pendingOrders": 12,
 *   "processingOrders": 35,
 *   "deliveredOrders": 45,
 *   "cancelledOrders": 3,
 *   "orderGrowth": 12.5,
 *   "salesTarget": 200000,
 *   "userGrowth": 256,
 *   "targetConversion": 30
 * }
 * 
 * @example
 * // 错误示例 (500 Internal Server Error)
 * {
 *   "error": "数据库连接失败",
 *   "message": "无法获取统计数据"
 * }
 * 
 * @remarks
 * - 该接口模拟从数据库查询数据，实际项目中应替换为真实查询
 * - 响应时间约为 300ms（模拟数据库延迟）
 * - 所有数值均为实时计算，无缓存
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardStats>
) {
  // 模拟从数据库获取真实数据
  // 在实际项目中，这里应该查询数据库
  
  const stats: DashboardStats = {
    totalOrders: 1128,
    totalSales: 128936.00,
    activeUsers: 8932,
    conversionRate: 23.8,
    pendingOrders: 12,
    processingOrders: 35,
    deliveredOrders: 45,
    cancelledOrders: 3,
    orderGrowth: 12.5,
    salesTarget: 200000,
    userGrowth: 256,
    targetConversion: 30,
  };

  // 模拟数据库查询延迟
  setTimeout(() => {
    res.status(200).json(stats);
  }, 300);
}
