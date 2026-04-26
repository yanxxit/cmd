/**
 * UUID 工具常量
 * 提供 UUID v5 的标准命名空间和常用工具函数
 */

/**
 * UUID v5 标准命名空间常量
 * 这些是 RFC 4122 定义的预定义命名空间 UUID
 */
export const UUID_NAMESPACES = {
  /** DNS 命名空间：用于域名 */
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  
  /** URL 命名空间：用于 Web 地址 */
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  
  /** OID 命名空间：用于对象标识符 */
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  
  /** X.500 命名空间：用于 X.500 区分名 */
  X500: '6ba7b813-9dad-11d1-80b4-00c04fd430c8'
};

/**
 * 验证 UUID 字符串格式是否有效
 * @param {string} uuid - 待验证的 UUID 字符串
 * @returns {boolean} - 如果是有效的 UUID 格式返回 true
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  // 支持带连字符的标准格式
  const standardRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // 支持不带连字符的格式
  const noDashRegex = /^[0-9a-f]{32}$/i;
  return standardRegex.test(uuid) || noDashRegex.test(uuid);
}

/**
 * 获取 UUID 的版本号
 * @param {string} uuid - UUID 字符串
 * @returns {number|null} - UUID 版本号（1-7），如果无效则返回 null
 */
export function getUUIDVersion(uuid) {
  if (!isValidUUID(uuid)) {
    return null;
  }
  
  // 清理格式，移除连字符
  const clean = uuid.toLowerCase().replace(/-/g, '');
  // 第 13 位字符（索引 12）表示版本号
  const version = parseInt(clean[12], 16);
  
  // 只返回有效的版本号（1-7）
  return version >= 1 && version <= 7 ? version : null;
}

/**
 * 判断是否为 UUID v5
 * @param {string} uuid - UUID 字符串
 * @returns {boolean} - 如果是 UUID v5 返回 true
 */
export function isUUIDv5(uuid) {
  return getUUIDVersion(uuid) === 5;
}

/**
 * 判断是否为 UUID v4
 * @param {string} uuid - UUID 字符串
 * @returns {boolean} - 如果是 UUID v4 返回 true
 */
export function isUUIDv4(uuid) {
  return getUUIDVersion(uuid) === 4;
}

/**
 * 判断是否为 UUID v7
 * @param {string} uuid - UUID 字符串
 * @returns {boolean} - 如果是 UUID v7 返回 true
 */
export function isUUIDv7(uuid) {
  return getUUIDVersion(uuid) === 7;
}

/**
 * 标准化 UUID 格式（带连字符的小写格式）
 * @param {string} uuid - UUID 字符串
 * @returns {string|null} - 标准化后的 UUID，如果无效则返回 null
 */
export function normalizeUUID(uuid) {
  if (!isValidUUID(uuid)) {
    return null;
  }
  
  // 清理格式，移除连字符并转小写
  const clean = uuid.toLowerCase().replace(/-/g, '');
  
  // 添加连字符：8-4-4-4-12
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}

/**
 * 移除 UUID 中的连字符
 * @param {string} uuid - UUID 字符串
 * @returns {string|null} - 移除连字符后的 UUID，如果无效则返回 null
 */
export function removeDashes(uuid) {
  if (!isValidUUID(uuid)) {
    return null;
  }
  
  return uuid.toLowerCase().replace(/-/g, '');
}

/**
 * 获取 UUID 的变体类型
 * @param {string} uuid - UUID 字符串
 * @returns {string|null} - 变体类型描述，如果无效则返回 null
 */
export function getUUIDVariant(uuid) {
  if (!isValidUUID(uuid)) {
    return null;
  }
  
  const clean = uuid.toLowerCase().replace(/-/g, '');
  // 第 17 位字符（索引 16）的高位表示变体
  const variant = parseInt(clean[16], 16);
  
  if (variant >= 8 && variant <= 11) {
    return 'RFC 4122';
  } else if (variant >= 4 && variant <= 7) {
    return 'Microsoft';
  } else {
    return 'Reserved';
  }
}

/**
 * 默认导出所有 UUID 工具
 */
export default {
  UUID_NAMESPACES,
  isValidUUID,
  getUUIDVersion,
  isUUIDv5,
  isUUIDv4,
  isUUIDv7,
  normalizeUUID,
  removeDashes,
  getUUIDVariant
};
