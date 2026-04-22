import { faker } from '@faker-js/faker';

/**
 * 产品表模拟数据生成器
 */
export class ProductMock {
  static CATEGORIES = ['电子产品', '服装', '家居', '食品', '图书', '运动', '美妆', '玩具', '汽车', '健康'];
  static STATUS = ['上架', '下架', '预售', '缺货'];
  
  /**
   * 生成单个产品数据
   * @param {number} id - 产品 ID
   * @returns {object} 产品对象
   */
  static generateProduct(id) {
    const price = parseFloat(faker.commerce.price({ min: 1, max: 10000, dec: 2 }));
    const cost = parseFloat((price * (0.3 + Math.random() * 0.4)).toFixed(2));
    
    return {
      id,
      uuid: faker.string.uuid(),
      name: faker.commerce.productName(),
      sku: faker.string.alphanumeric(10).toUpperCase(),
      category: faker.helpers.arrayElement(this.CATEGORIES),
      description: faker.commerce.productDescription(),
      price: price,
      cost: cost,
      discount: Math.random() < 0.3 ? parseFloat((Math.random() * 0.5).toFixed(2)) : 0,
      stock: Math.floor(Math.random() * 1000),
      minStock: Math.floor(Math.random() * 50),
      weight: parseFloat((Math.random() * 50).toFixed(2)),
      weightUnit: 'kg',
      dimensions: `${(Math.random() * 100).toFixed(1)}x${(Math.random() * 100).toFixed(1)}x${(Math.random() * 100).toFixed(1)} cm`,
      brand: faker.company.name(),
      model: faker.commerce.productMaterial() + '-' + faker.string.alphanumeric(8).toUpperCase(),
      status: faker.helpers.arrayElement(this.STATUS),
      isFeatured: faker.datatype.boolean(),
      isNew: faker.datatype.boolean(),
      rating: parseFloat((Math.random() * 5).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 5000),
      tags: faker.commerce.productAdjective() + ',' + faker.commerce.productMaterial(),
      releaseDate: faker.date.past({ years: 3 }).toISOString().split('T')[0],
      lastUpdate: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
      supplierId: Math.floor(Math.random() * 100) + 1,
      createdAt: faker.date.past({ years: 3 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString()
    };
  }

  /**
   * 批量生成产品数据
   * @param {number} count - 生成数量
   * @param {number} [startId=1] - 起始 ID
   * @returns {Array<object>} 产品数组
   */
  static generateProducts(count, startId = 1) {
    const products = [];
    for (let i = 0; i < count; i++) {
      products.push(this.generateProduct(startId + i));
    }
    return products;
  }

  /**
   * 获取产品表的列定义
   * @returns {Array<string>} 列名数组
   */
  static getColumns() {
    return [
      'id', 'uuid', 'name', 'sku', 'category', 'description',
      'price', 'cost', 'discount', 'stock', 'minStock',
      'weight', 'weightUnit', 'dimensions', 'brand', 'model',
      'status', 'isFeatured', 'isNew', 'rating', 'reviewCount',
      'tags', 'releaseDate', 'lastUpdate', 'supplierId',
      'createdAt', 'updatedAt'
    ];
  }

  /**
   * 将产品对象转换为扁平对象
   * @param {object} product - 产品对象
   * @returns {object} 扁平对象
   */
  static flatten(product) {
    return product;
  }
}

export default ProductMock;
