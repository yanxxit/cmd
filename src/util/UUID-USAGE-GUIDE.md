# UUID 工具使用指南

## 📦 模块导入

UUID 工具模块提供了 UUID v5 命名空间常量和一系列实用的 UUID 处理函数，位于 `/src/util/uuid-utils.js`。

### 基本导入方式

```javascript
// 导入所有工具
import uuidUtils from './src/util/uuid-utils.js';
// 或
import { UUID_NAMESPACES, isValidUUID, getUUIDVersion } from './src/util/uuid-utils.js';
```

### 命名空间常量导入

```javascript
import { UUID_NAMESPACES } from './src/util/uuid-utils.js';

// 使用预定义的命名空间
const dnsNamespace = UUID_NAMESPACES.DNS;   // '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
const urlNamespace = UUID_NAMESPACES.URL;   // '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
const oidNamespace = UUID_NAMESPACES.OID;   // '6ba7b812-9dad-11d1-80b4-00c04fd430c8'
const x500Namespace = UUID_NAMESPACES.X500; // '6ba7b813-9dad-11d1-80b4-00c04fd430c8'
```

## 🔧 工具函数

### 1. isValidUUID(uuid)

验证字符串是否为有效的 UUID 格式。

```javascript
import { isValidUUID } from './src/util/uuid-utils.js';

isValidUUID('550e8400-e29b-41d4-a716-446655440000'); // true
isValidUUID('550e8400e29b41d4a716446655440000');     // true
isValidUUID('invalid-uuid');                          // false
isValidUUID('');                                      // false
```

**支持格式：**
- 标准格式（带连字符）：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- 无连字符格式：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- 大小写不敏感

### 2. getUUIDVersion(uuid)

获取 UUID 的版本号（1-7）。

```javascript
import { getUUIDVersion } from './src/util/uuid-utils.js';

getUUIDVersion('c232ab00-9414-11ec-b3c7-0242ac130004'); // 1 (UUID v1)
getUUIDVersion('550e8400-e29b-41d4-a716-446655440000'); // 4 (UUID v4)
getUUIDVersion('886313e1-3b8a-5372-9b90-0c9aee199e5d'); // 5 (UUID v5)
getUUIDVersion('019db762-ae93-7050-ad37-8fe6cfaec5ab'); // 7 (UUID v7)
getUUIDVersion('invalid');                              // null
```

### 3. isUUIDv4(uuid) / isUUIDv5(uuid) / isUUIDv7(uuid)

快速判断 UUID 版本。

```javascript
import { isUUIDv4, isUUIDv5, isUUIDv7 } from './src/util/uuid-utils.js';

const uuid4 = '550e8400-e29b-41d4-a716-446655440000';
const uuid5 = '886313e1-3b8a-5372-9b90-0c9aee199e5d';
const uuid7 = '019db762-ae93-7050-ad37-8fe6cfaec5ab';

isUUIDv4(uuid4); // true
isUUIDv5(uuid4); // false
isUUIDv7(uuid4); // false

isUUIDv5(uuid5); // true
isUUIDv4(uuid5); // false

isUUIDv7(uuid7); // true
```

### 4. normalizeUUID(uuid)

标准化 UUID 格式（带连字符的小写格式）。

```javascript
import { normalizeUUID } from './src/util/uuid-utils.js';

normalizeUUID('550E8400-E29B-41D4-A716-446655440000'); // '550e8400-e29b-41d4-a716-446655440000'
normalizeUUID('550e8400e29b41d4a716446655440000');     // '550e8400-e29b-41d4-a716-446655440000'
normalizeUUID('invalid');                              // null
```

### 5. removeDashes(uuid)

移除 UUID 中的所有连字符。

```javascript
import { removeDashes } from './src/util/uuid-utils.js';

removeDashes('550e8400-e29b-41d4-a716-446655440000'); // '550e8400e29b41d4a716446655440000'
removeDashes('invalid');                               // null
```

### 6. getUUIDVariant(uuid)

获取 UUID 的变体类型（RFC 4122、Microsoft、Reserved）。

```javascript
import { getUUIDVariant } from './src/util/uuid-utils.js';

const uuid = '550e8400-e29b-41d4-a716-446655440000';
getUUIDVariant(uuid); // 'RFC 4122'
```

## 🎯 实际应用场景

### 场景 1：根据邮箱生成固定用户 ID

```javascript
import { v5 } from 'uuid';
import { UUID_NAMESPACES } from './src/util/uuid-utils.js';

function generateUserID(email) {
  // 使用 DNS 命名空间根据邮箱生成固定 ID
  return v5(email, UUID_NAMESPACES.DNS);
}

// 相同邮箱总是生成相同的 ID
const userId1 = generateUserID('user@example.com');
const userId2 = generateUserID('user@example.com');
console.log(userId1 === userId2); // true
```

### 场景 2：根据 URL 生成固定资源 ID

```javascript
import { v5 } from 'uuid';
import { UUID_NAMESPACES } from './src/util/uuid-utils.js';

function generateResourceID(url) {
  // 使用 URL 命名空间生成固定 ID
  return v5(url, UUID_NAMESPACES.URL);
}

const resourceId = generateResourceID('https://example.com/api/users');
// 总是生成：基于 URL 的确定性 UUID
```

### 场景 3：验证和标准化用户输入的 UUID

```javascript
import { isValidUUID, normalizeUUID, getUUIDVersion } from './src/util/uuid-utils.js';

function processUserUUID(input) {
  if (!isValidUUID(input)) {
    throw new Error('无效的 UUID 格式');
  }
  
  const normalized = normalizeUUID(input);
  const version = getUUIDVersion(input);
  
  return {
    original: input,
    normalized: normalized,
    version: version,
    isV5: version === 5
  };
}

// 示例
const result = processUserUUID('550E8400-E29B-41D4-A716-446655440000');
// {
//   original: '550E8400-E29B-41D4-A716-446655440000',
//   normalized: '550e8400-e29b-41d4-a716-446655440000',
//   version: 4,
//   isV5: false
// }
```

### 场景 4：批量验证 UUID 列表

```javascript
import { isValidUUID, getUUIDVersion } from './src/util/uuid-utils.js';

function validateUUIDList(uuidList) {
  return uuidList.map(uuid => ({
    uuid: uuid,
    valid: isValidUUID(uuid),
    version: isValidUUID(uuid) ? getUUIDVersion(uuid) : null
  }));
}

const uuids = [
  '550e8400-e29b-41d4-a716-446655440000',
  'invalid-uuid',
  '019db762-ae93-7050-ad37-8fe6cfaec5ab'
];

const results = validateUUIDList(uuids);
// [
//   { uuid: '550e8400...', valid: true, version: 4 },
//   { uuid: 'invalid-uuid', valid: false, version: null },
//   { uuid: '019db762...', valid: true, version: 7 }
// ]
```

### 场景 5：根据业务类型选择命名空间

```javascript
import { v5 } from 'uuid';
import { UUID_NAMESPACES } from './src/util/uuid-utils.js';

function generateBusinessID(type, value) {
  const namespaceMap = {
    'user': UUID_NAMESPACES.DNS,      // 用户相关
    'resource': UUID_NAMESPACES.URL,  // 资源链接
    'product': UUID_NAMESPACES.OID,   // 产品标识
    'org': UUID_NAMESPACES.X500       // 组织信息
  };
  
  const namespace = namespaceMap[type] || UUID_NAMESPACES.DNS;
  return v5(`${type}:${value}`, namespace);
}

// 使用示例
const userId = generateBusinessID('user', 'john@example.com');
const productId = generateBusinessID('product', 'SKU-12345');
```

## 📊 完整示例

```javascript
// 文件：src/services/user-service.js
import { v4, v5 } from 'uuid';
import { 
  UUID_NAMESPACES, 
  isValidUUID, 
  normalizeUUID,
  isUUIDv5 
} from '../util/uuid-utils.js';

class UserService {
  constructor() {
    // 使用 URL 命名空间作为用户服务的基础命名空间
    this.userNamespace = UUID_NAMESPACES.URL;
  }
  
  /**
   * 根据邮箱生成确定性用户 ID
   */
  generateUserID(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('邮箱必须是非空字符串');
    }
    
    // 标准化邮箱（转小写）
    const normalizedEmail = email.toLowerCase().trim();
    
    // 生成 UUID v5
    return v5(normalizedEmail, this.userNamespace);
  }
  
  /**
   * 验证用户 ID 是否有效
   */
  validateUserID(userID) {
    if (!isValidUUID(userID)) {
      return false;
    }
    
    // 可选：检查是否为 v5 版本
    return isUUIDv5(userID);
  }
  
  /**
   * 批量生成用户 ID
   */
  batchGenerateUserIDs(emails) {
    return emails.map(email => ({
      email: email,
      userID: this.generateUserID(email),
      normalized: normalizeUUID(this.generateUserID(email))
    }));
  }
}

// 使用示例
const userService = new UserService();

const userId = userService.generateUserID('user@example.com');
console.log('User ID:', userId);

const isValid = userService.validateUserID(userId);
console.log('Is valid:', isValid);

const batchResults = userService.batchGenerateUserIDs([
  'alice@example.com',
  'bob@example.com',
  'charlie@example.com'
]);
console.log('Batch results:', batchResults);
```

## 🧪 测试

UUID 工具函数已包含完整的单元测试，位于 `test/uuid-utils.vitest.test.js`。

运行测试：
```bash
npm test -- uuid-utils
```

测试覆盖：
- ✅ UUID_NAMESPACES 常量验证（5 个测试）
- ✅ isValidUUID 函数（11 个测试）
- ✅ getUUIDVersion 函数（8 个测试）
- ✅ isUUIDv4/isUUIDv5/isUUIDv7 函数（12 个测试）
- ✅ normalizeUUID 函数（5 个测试）
- ✅ removeDashes 函数（5 个测试）
- ✅ getUUIDVariant 函数（5 个测试）
- ✅ 集成测试（3 个测试）

**总计：54 个测试用例，100% 通过**

## 📝 注意事项

1. **命名空间选择**：
   - 使用 DNS 命名空间处理域名、邮箱等
   - 使用 URL 命名空间处理 Web 地址
   - 使用 OID 命名空间处理对象标识符
   - 使用 X.500 命名空间处理 LDAP 区分名

2. **确定性保证**：
   - UUID v5 是确定性的：相同命名空间 + 相同名称 = 相同 UUID
   - 确保命名空间和名称完全一致（包括大小写）

3. **性能考虑**：
   - 所有工具函数都是纯函数，无副作用
   - 可以安全地缓存结果
   - 适合在高频场景下使用

4. **错误处理**：
   - 验证函数返回 `false` 而不是抛出异常
   - 格式转换函数对无效输入返回 `null`
   - 建议在关键路径上进行输入验证

## 🔗 相关资源

- [RFC 4122 - UUID 规范](https://tools.ietf.org/html/rfc4122)
- [UUID npm 包文档](https://github.com/uuidjs/uuid)
- 项目实现：`/src/util/uuid-utils.js`
- 测试文件：`/test/uuid-utils.vitest.test.js`
