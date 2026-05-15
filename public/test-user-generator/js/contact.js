// 各国手机号 / 邮箱 生成
import { randInt, pad, pick } from './random.js';

/** 中国大陆有效号段（截取一部分常用值，覆盖运营商主流号段） */
const CN_PREFIX = [
  '130','131','132','133','134','135','136','137','138','139',
  '150','151','152','153','155','156','157','158','159',
  '170','171','173','175','176','177','178','180','181','182',
  '183','184','185','186','187','188','189','198','199'
];

/** 按国籍生成手机号（含国家区号） */
export function genPhoneByCountry(country) {
  switch (country) {
    case 'CN': {
      const prefix = pick(CN_PREFIX);
      const tail = String(randInt(0, 99_999_999)).padStart(8, '0');
      return `+86 ${prefix}${tail}`;
    }
    case 'US':
    case 'CA': {
      // 北美：3 位 area + 3 位 + 4 位
      return `+1 ${randInt(200, 999)}-${randInt(200, 999)}-${pad(randInt(0, 9999), 4)}`;
    }
    case 'GB': {
      return `+44 7${randInt(100, 999)} ${randInt(100, 999)} ${pad(randInt(0, 999), 3)}`;
    }
    case 'JP': {
      return `+81 90-${pad(randInt(0, 9999), 4)}-${pad(randInt(0, 9999), 4)}`;
    }
    case 'KR': {
      return `+82 10-${pad(randInt(0, 9999), 4)}-${pad(randInt(0, 9999), 4)}`;
    }
    case 'SG': {
      return `+65 ${randInt(8, 9)}${pad(randInt(0, 999), 3)}-${pad(randInt(0, 9999), 4)}`;
    }
    case 'MY': {
      return `+60 1${randInt(0, 9)}-${pad(randInt(0, 999), 3)} ${pad(randInt(0, 9999), 4)}`;
    }
    case 'AU': {
      return `+61 4${pad(randInt(0, 99), 2)} ${pad(randInt(0, 999), 3)} ${pad(randInt(0, 999), 3)}`;
    }
    case 'DE': {
      return `+49 1${randInt(50, 79)} ${pad(randInt(0, 9999999), 7)}`;
    }
    case 'FR': {
      return `+33 6 ${pad(randInt(0, 99), 2)} ${pad(randInt(0, 99), 2)} ${pad(randInt(0, 99), 2)} ${pad(randInt(0, 99), 2)}`;
    }
    default:
      return `+1 ${randInt(200, 999)}-${randInt(200, 999)}-${pad(randInt(0, 9999), 4)}`;
  }
}

/** 常用邮箱后缀（按国家给一些本地偏好，但允许混用） */
const COMMON_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com', 'protonmail.com'];
const CN_DOMAINS = ['qq.com', '163.com', '126.com', 'sina.com', 'foxmail.com', ...COMMON_DOMAINS];
const JP_DOMAINS = ['yahoo.co.jp', 'docomo.ne.jp', 'softbank.jp', ...COMMON_DOMAINS];
const KR_DOMAINS = ['naver.com', 'daum.net', 'hanmail.net', ...COMMON_DOMAINS];

const DOMAIN_BY_COUNTRY = {
  CN: CN_DOMAINS,
  JP: JP_DOMAINS,
  KR: KR_DOMAINS,
};

/**
 * 用姓名 + 国籍生成邮箱
 * - 中文姓名取拼音风格的代号（用 base36 替代，避免引入 pinyin 库）
 * - 英/日/韩名取小写 + 去空格
 */
export function genEmail(name, country) {
  const domains = DOMAIN_BY_COUNTRY[country] || COMMON_DOMAINS;
  let local = name
    .normalize('NFKD')
    .replace(/[\s·.]+/g, '.')
    .replace(/[^a-zA-Z0-9.]/g, '')
    .replace(/^\.+|\.+$/g, '') // 去掉首尾点
    .replace(/\.{2,}/g, '.')   // 合并连续点
    .toLowerCase();
  if (!local) {
    // 中文 / 日文 / 韩文等非 ASCII：退化为随机字符串
    local = 'user' + Math.random().toString(36).slice(2, 8);
  }
  // 加点小尾巴避免重名碰撞（适合批量生成）
  if (Math.random() < 0.6) local += randInt(1, 9999);
  return `${local}@${pick(domains)}`;
}
