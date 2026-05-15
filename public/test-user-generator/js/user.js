// 顶层用户对象组装：聚合 name / id / phone / email / address
import { COUNTRIES, genName, genAddress } from './address.js';
import { genIdByCountry } from './id-card.js';
import { genPhoneByCountry, genEmail } from './contact.js';
import { genShortId, randInt, pick } from './random.js';

/**
 * 生成一个测试用户
 * @param {{ country?: string, gender?: 'male'|'female' }} opt
 */
export function genUser({ country, gender } = {}) {
  const c = country || pick(COUNTRIES).code;
  const g = gender || (Math.random() < 0.5 ? 'male' : 'female');
  const name = genName(c, g);
  return {
    key: genShortId(),
    name,
    gender: g === 'male' ? '男' : '女',
    country: c,
    countryLabel: COUNTRIES.find((x) => x.code === c)?.label || c,
    countryFlag: COUNTRIES.find((x) => x.code === c)?.flag || '🌐',
    idNumber: genIdByCountry(c, { gender: g }),
    phone: genPhoneByCountry(c),
    email: genEmail(name, c),
    address: genAddress(c),
    age: randInt(18, 70),
  };
}

/** 批量生成 */
export function genUsers(count, opt = {}) {
  const list = [];
  for (let i = 0; i < count; i++) list.push(genUser(opt));
  return list;
}

export { COUNTRIES };
