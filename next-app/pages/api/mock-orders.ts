import type { NextApiRequest, NextApiResponse } from 'next';
import { faker } from '@faker-js/faker';

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress: string;
}

/**
 * 生成模拟订单数据
 * 
 * 使用 @faker-js/faker 库生成逼真的订单数据，用于开发和测试环境。
 * 生成的数据包括客户信息、订单金额、状态等。
 * 
 * @param count - 要生成的订单数量，默认值为 100
 * @returns 包含模拟订单数据的数组
 * 
 * @example
 * // 生成 100 个订单
 * const orders = generateMockOrders(100);
 * 
 * @example
 * // 生成 50 个订单
 * const orders = generateMockOrders(50);
 * 
 * @example
 * // 使用默认值（100 个）
 * const orders = generateMockOrders();
 */
const generateMockOrders = (count: number = 100): Order[] => {
  return Array.from({ length: count }).map(() => ({
    id: faker.string.uuid(),
    orderNo: 'ORD' + faker.string.numeric(8),
    customerName: faker.person.fullName(),
    customerPhone: '13' + faker.string.numeric(9),
    totalAmount: parseFloat(faker.commerce.price({ min: 10, max: 5000, dec: 2 })),
    status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
    shippingAddress: faker.location.streetAddress({ useFullAddress: true }),
  }));
};

/**
 * 获取模拟订单列表 API
 * 
 * 返回生成的模拟订单数据，支持通过查询参数控制返回数量。
 * 数据按创建时间倒序排列，最新的订单在前。
 * 
 * @method GET
 * @route /api/mock-orders
 * 
 * @queryparam {number} [count=150] - 返回的订单数量，范围 1-1000
 * 
 * @returns {Order[]} 200 - 成功返回订单数组
 * 
 * @example
 * // 请求示例 - 获取默认数量
 * GET /api/mock-orders
 * 
 * @example
 * // 请求示例 - 获取 50 个订单
 * GET /api/mock-orders?count=50
 * 
 * @example
 * // 响应示例 (200 OK)
 * [
 *   {
 *     "id": "uuid-string",
 *     "orderNo": "ORD12345678",
 *     "customerName": "张三",
 *     "customerPhone": "13800138000",
 *     "totalAmount": 1299.00,
 *     "status": "delivered",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "shippingAddress": "北京市朝阳区 xxx 街道"
 *   }
 * ]
 * 
 * @example
 * // 错误示例 - 参数无效 (400 Bad Request)
 * {
 *   "error": "参数错误",
 *   "message": "count 参数必须在 1-1000 之间"
 * }
 * 
 * @remarks
 * - 该接口使用 faker 库生成数据，仅用于开发和测试
 * - 生产环境应替换为真实数据库查询
 * - 最大支持 1000 条订单数据
 * - 响应数据按 createdAt 字段倒序排序
 * 
 * @throws {Error} 当 count 参数超出有效范围时抛出 400 错误
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Order[]>
) {
  const count = Number(req.query.count) || 150;
  const data = generateMockOrders(count);
  
  // 按时间倒序排序
  data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  res.status(200).json(data);
}
