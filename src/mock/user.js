import { faker } from '@faker-js/faker';

/**
 * 用户表模拟数据生成器
 */
export class UserMock {
  /**
   * 生成单个用户数据
   * @param {number} id - 用户 ID
   * @returns {object} 用户对象
   */
  static generateUser(id) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const gender = faker.person.sex();
    
    return {
      id,
      uuid: faker.string.uuid(),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      username: faker.internet.username(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      gender,
      birthDate: '1990-01-01',
      age: 34,
      avatar: '',
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
        latitude: 0,
        longitude: 0
      },
      company: faker.company.name(),
      jobTitle: faker.person.jobTitle(),
      website: faker.internet.url(),
      bio: faker.lorem.paragraph(),
      registeredAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: faker.datatype.boolean(),
      isVerified: faker.datatype.boolean(),
      status: faker.helpers.arrayElement(['active', 'inactive', 'suspended', 'pending']),
      role: faker.helpers.arrayElement(['user', 'moderator', 'admin', 'guest']),
      timezone: faker.location.timeZone(),
      language: faker.helpers.arrayElement(['en', 'zh-CN', 'es', 'fr', 'de', 'ja', 'ko']),
      currency: faker.finance.currencyCode(),
      preferences: {
        newsletter: faker.datatype.boolean(),
        notifications: faker.datatype.boolean(),
        darkMode: faker.datatype.boolean()
      },
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * 批量生成用户数据
   * @param {number} count - 生成数量
   * @param {number} [startId=1] - 起始 ID
   * @returns {Array<object>} 用户数组
   */
  static generateUsers(count, startId = 1) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(this.generateUser(startId + i));
    }
    return users;
  }

  /**
   * 获取用户表的列定义
   * @param {boolean} [flatten=false] - 是否扁平化嵌套对象
   * @returns {Array<string>} 列名数组
   */
  static getColumns(flatten = false) {
    if (flatten) {
      return [
        'id', 'uuid', 'firstName', 'lastName', 'fullName', 'username', 'email',
        'phone', 'gender', 'birthDate', 'age', 'avatar',
        'address.street', 'address.city', 'address.state', 'address.zipCode',
        'address.country', 'address.latitude', 'address.longitude',
        'company', 'jobTitle', 'website', 'bio',
        'registeredAt', 'lastLoginAt', 'isActive', 'isVerified', 'status', 'role',
        'timezone', 'language', 'currency',
        'preferences.newsletter', 'preferences.notifications', 'preferences.darkMode',
        'createdAt', 'updatedAt'
      ];
    }
    return [
      'id', 'uuid', 'firstName', 'lastName', 'fullName', 'username', 'email',
      'phone', 'gender', 'birthDate', 'age', 'avatar', 'address',
      'company', 'jobTitle', 'website', 'bio',
      'registeredAt', 'lastLoginAt', 'isActive', 'isVerified', 'status', 'role',
      'timezone', 'language', 'currency', 'preferences',
      'createdAt', 'updatedAt'
    ];
  }

  /**
   * 将用户对象转换为扁平对象（用于 CSV 等格式）
   * @param {object} user - 用户对象
   * @returns {object} 扁平对象
   */
  static flatten(user) {
    return {
      id: user.id,
      uuid: user.uuid,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      birthDate: user.birthDate,
      age: user.age,
      avatar: user.avatar,
      'address.street': user.address?.street || '',
      'address.city': user.address?.city || '',
      'address.state': user.address?.state || '',
      'address.zipCode': user.address?.zipCode || '',
      'address.country': user.address?.country || '',
      'address.latitude': user.address?.latitude || 0,
      'address.longitude': user.address?.longitude || 0,
      company: user.company,
      jobTitle: user.jobTitle,
      website: user.website,
      bio: user.bio,
      registeredAt: user.registeredAt,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
      isVerified: user.isVerified,
      status: user.status,
      role: user.role,
      timezone: user.timezone,
      language: user.language,
      currency: user.currency,
      'preferences.newsletter': user.preferences?.newsletter || false,
      'preferences.notifications': user.preferences?.notifications || false,
      'preferences.darkMode': user.preferences?.darkMode || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

export default UserMock;
