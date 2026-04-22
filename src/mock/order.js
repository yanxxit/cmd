import { faker } from '@faker-js/faker';

/**
 * 订单表模拟数据生成器
 */
export class OrderMock {
  static ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'];
  static PAYMENT_STATUSES = ['paid', 'unpaid', 'pending', 'failed', 'refunded', 'partial'];
  static PAYMENT_METHODS = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery', 'wallet', 'crypto'];
  static SHIPPING_METHODS = ['standard', 'express', 'next_day', 'same_day', 'pickup'];
  static CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'AUD', 'CAD', 'INR'];
  static CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty', 'Toys', 'Food'];

  /**
   * 生成订单项
   * @param {number} index - 项索引
   * @returns {object} 订单项对象
   */
  static generateOrderItem(index) {
    const quantity = Math.floor(Math.random() * 10) + 1;
    const unitPrice = parseFloat((Math.random() * 1000).toFixed(2));
    
    return {
      id: index + 1,
      productId: Math.floor(Math.random() * 99000) + 1000,
      productName: faker.commerce.productName(),
      sku: faker.commerce.isbn(),
      category: faker.helpers.arrayElement(this.CATEGORIES),
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      discount: parseFloat((Math.random() * 100).toFixed(2)),
      tax: parseFloat((Math.random() * 50).toFixed(2)),
      image: '',
      description: faker.commerce.productDescription(),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * 生成单个订单数据
   * @param {number} id - 订单 ID
   * @param {number} [userId] - 用户 ID（可选）
   * @returns {object} 订单对象
   */
  static generateOrder(id, userId) {
    const orderDate = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
    const itemCount = Math.floor(Math.random() * 10) + 1;
    const items = [];
    let subtotal = 0;
    
    for (let i = 0; i < itemCount; i++) {
      const item = this.generateOrderItem(i);
      items.push(item);
      subtotal += item.totalPrice;
    }
    
    const taxRate = parseFloat((Math.random() * 0.2).toFixed(2));
    const shippingCost = parseFloat((Math.random() * 50).toFixed(2));
    const discount = parseFloat((Math.random() * subtotal * 0.3).toFixed(2));
    const tax = subtotal * taxRate;
    const total = subtotal + tax + shippingCost - discount;
    
    const status = faker.helpers.arrayElement(this.ORDER_STATUSES);
    
    let deliveredAt = null;
    let cancelledAt = null;
    let refundedAt = null;
    
    if (status === 'delivered' || status === 'returned' || status === 'refunded') {
      deliveredAt = new Date(orderDate.getTime() + Math.random() * (Date.now() - orderDate.getTime())).toISOString();
    }
    if (status === 'cancelled' || status === 'returned') {
      cancelledAt = new Date(orderDate.getTime() + Math.random() * (Date.now() - orderDate.getTime())).toISOString();
    }
    if (status === 'refunded') {
      refundedAt = new Date(orderDate.getTime() + Math.random() * (Date.now() - orderDate.getTime())).toISOString();
    }

    return {
      id,
      orderNumber: `ORD-${new Date().getFullYear()}-${String(id).padStart(8, '0')}`,
      userId: userId || Math.floor(Math.random() * 10000) + 1,
      customerName: faker.person.fullName(),
      customerEmail: faker.internet.email(),
      customerPhone: faker.phone.number(),
      
      items,
      itemCount,
      
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      taxRate: parseFloat(taxRate.toFixed(2)),
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      currency: faker.helpers.arrayElement(this.CURRENCIES),
      
      status,
      paymentStatus: faker.helpers.arrayElement(this.PAYMENT_STATUSES),
      paymentMethod: faker.helpers.arrayElement(this.PAYMENT_METHODS),
      paymentId: faker.string.uuid(),
      transactionId: faker.finance.routingNumber(),
      
      shippingMethod: faker.helpers.arrayElement(this.SHIPPING_METHODS),
      shippingAddress: {
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        street: faker.location.streetAddress(),
        apartment: faker.location.secondaryAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country()
      },
      billingAddress: {
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        street: faker.location.streetAddress(),
        apartment: faker.location.secondaryAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country()
      },
      
      trackingNumber: faker.finance.routingNumber(),
      carrier: faker.helpers.arrayElement(['UPS', 'FedEx', 'DHL', 'USPS', 'Amazon Logistics', 'Local Courier']),
      
      notes: faker.lorem.sentence(),
      couponCode: Math.random() < 0.3 ? faker.string.alphanumeric(8).toUpperCase() : null,
      giftMessage: Math.random() < 0.2 ? faker.lorem.sentence() : null,
      isGift: faker.datatype.boolean(),
      
      orderedAt: orderDate.toISOString(),
      paidAt: Math.random() < 0.8 ? new Date(orderDate.getTime() + Math.random() * (Date.now() - orderDate.getTime())).toISOString() : null,
      shippedAt: Math.random() < 0.6 ? new Date(orderDate.getTime() + Math.random() * (Date.now() - orderDate.getTime())).toISOString() : null,
      deliveredAt,
      cancelledAt,
      refundedAt,
      
      createdAt: orderDate.toISOString(),
      updatedAt: new Date(orderDate.getTime() + Math.random() * (Date.now() - orderDate.getTime())).toISOString()
    };
  }

  /**
   * 批量生成订单数据
   * @param {number} count - 生成数量
   * @param {number} [startId=1] - 起始 ID
   * @param {Array<number>} [userIds] - 用户 ID 数组（可选）
   * @returns {Array<object>} 订单数组
   */
  static generateOrders(count, startId = 1, userIds) {
    const orders = [];
    for (let i = 0; i < count; i++) {
      const userId = userIds ? userIds[i % userIds.length] : undefined;
      orders.push(this.generateOrder(startId + i, userId));
    }
    return orders;
  }

  /**
   * 获取订单表的列定义
   * @param {boolean} [flatten=false] - 是否扁平化嵌套对象
   * @param {boolean} [includeItems=false] - 是否包含订单项
   * @returns {Array<string>} 列名数组
   */
  static getColumns(flatten = false, includeItems = false) {
    const baseColumns = flatten ? [
      'id', 'orderNumber', 'userId', 'customerName', 'customerEmail', 'customerPhone',
      'itemCount', 'subtotal', 'tax', 'taxRate', 'shippingCost', 'discount', 'total', 'currency',
      'status', 'paymentStatus', 'paymentMethod', 'paymentId', 'transactionId',
      'shippingMethod',
      'shippingAddress.name', 'shippingAddress.phone', 'shippingAddress.street',
      'shippingAddress.apartment', 'shippingAddress.city', 'shippingAddress.state',
      'shippingAddress.zipCode', 'shippingAddress.country',
      'billingAddress.name', 'billingAddress.phone', 'billingAddress.street',
      'billingAddress.apartment', 'billingAddress.city', 'billingAddress.state',
      'billingAddress.zipCode', 'billingAddress.country',
      'trackingNumber', 'carrier',
      'notes', 'couponCode', 'giftMessage', 'isGift',
      'orderedAt', 'paidAt', 'shippedAt', 'deliveredAt', 'cancelledAt', 'refundedAt',
      'createdAt', 'updatedAt'
    ] : [
      'id', 'orderNumber', 'userId', 'customerName', 'customerEmail', 'customerPhone',
      'items', 'itemCount',
      'subtotal', 'tax', 'taxRate', 'shippingCost', 'discount', 'total', 'currency',
      'status', 'paymentStatus', 'paymentMethod', 'paymentId', 'transactionId',
      'shippingMethod', 'shippingAddress', 'billingAddress',
      'trackingNumber', 'carrier',
      'notes', 'couponCode', 'giftMessage', 'isGift',
      'orderedAt', 'paidAt', 'shippedAt', 'deliveredAt', 'cancelledAt', 'refundedAt',
      'createdAt', 'updatedAt'
    ];
    
    return baseColumns;
  }

  /**
   * 将订单对象转换为扁平对象（用于 CSV 等格式）
   * @param {object} order - 订单对象
   * @returns {object} 扁平对象
   */
  static flatten(order) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      itemCount: order.itemCount,
      subtotal: order.subtotal,
      tax: order.tax,
      taxRate: order.taxRate,
      shippingCost: order.shippingCost,
      discount: order.discount,
      total: order.total,
      currency: order.currency,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId,
      transactionId: order.transactionId,
      shippingMethod: order.shippingMethod,
      'shippingAddress.name': order.shippingAddress?.name || '',
      'shippingAddress.phone': order.shippingAddress?.phone || '',
      'shippingAddress.street': order.shippingAddress?.street || '',
      'shippingAddress.apartment': order.shippingAddress?.apartment || '',
      'shippingAddress.city': order.shippingAddress?.city || '',
      'shippingAddress.state': order.shippingAddress?.state || '',
      'shippingAddress.zipCode': order.shippingAddress?.zipCode || '',
      'shippingAddress.country': order.shippingAddress?.country || '',
      'billingAddress.name': order.billingAddress?.name || '',
      'billingAddress.phone': order.billingAddress?.phone || '',
      'billingAddress.street': order.billingAddress?.street || '',
      'billingAddress.apartment': order.billingAddress?.apartment || '',
      'billingAddress.city': order.billingAddress?.city || '',
      'billingAddress.state': order.billingAddress?.state || '',
      'billingAddress.zipCode': order.billingAddress?.zipCode || '',
      'billingAddress.country': order.billingAddress?.country || '',
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      notes: order.notes,
      couponCode: order.couponCode || '',
      giftMessage: order.giftMessage || '',
      isGift: order.isGift,
      orderedAt: order.orderedAt,
      paidAt: order.paidAt || '',
      shippedAt: order.shippedAt || '',
      deliveredAt: order.deliveredAt || '',
      cancelledAt: order.cancelledAt || '',
      refundedAt: order.refundedAt || '',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }
}

export default OrderMock;
