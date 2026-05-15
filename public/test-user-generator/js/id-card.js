// 中国大陆 18 位身份证生成（仅供测试用，符合 GB 11643-1999 校验位算法）
import { randInt, pad, daysInMonth } from './random.js';

/** 简化的省级地区码（取部分常用） */
const REGION_CODES = [
  '110000', // 北京
  '310000', // 上海
  '440000', // 广东
  '330000', // 浙江
  '320000', // 江苏
  '500000', // 重庆
  '510000', // 四川
  '420000', // 湖北
  '370000', // 山东
  '410000', // 河南
  '610000', // 陕西
  '120000', // 天津
];

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

function pickRegion() {
  return REGION_CODES[randInt(0, REGION_CODES.length - 1)];
}

function checkCode(body17) {
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += parseInt(body17[i], 10) * WEIGHTS[i];
  return CHECK_CODES[sum % 11];
}

/**
 * 生成中国大陆 18 位身份证
 * @param {{ gender?: 'male'|'female', minAge?: number, maxAge?: number }} opt
 * @returns {{ id: string, year: number, month: string, day: string }}
 */
export function genCnIdCard({ gender, minAge = 18, maxAge = 70 } = {}) {
  const year = new Date().getFullYear() - randInt(minAge, maxAge);
  const month = pad(randInt(1, 12));
  const day = pad(randInt(1, daysInMonth(year, parseInt(month, 10))));
  // 顺序码奇数=男，偶数=女
  const isMale = gender === 'male' || (!gender && Math.random() < 0.5);
  const seq = pad(isMale ? randInt(0, 499) * 2 + 1 : randInt(0, 499) * 2, 3);
  const body = pickRegion() + year + month + day + seq;
  return { id: body + checkCode(body), year, month, day };
}

/**
 * 生成非中国大陆国籍的"护照号"（E + 8 位数字，仅占位用）
 */
export function genPassport() {
  return 'E' + String(randInt(10_000_000, 99_999_999));
}

/**
 * 根据国籍统一返回身份/证件号
 */
export function genIdByCountry(country, opt) {
  if (country === 'CN') return genCnIdCard(opt).id;
  return genPassport();
}
