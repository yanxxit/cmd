/**
 * 农历工具函数（基于 dayjs 和 lunar-javascript）
 * 提供农历与公历转换、生肖计算、星座计算等功能
 */

// 浏览器环境使用全局变量，Node.js 环境使用 ES6 模块导入
let dayjs, Lunar, Solar;

// 检查是否在浏览器环境中
if (typeof window !== 'undefined') {
  // 浏览器环境：使用全局变量
  dayjs = window.dayjs;
  
  // lunar-javascript 库可能挂载在不同的位置
  // 1. 直接挂载到 window (UMD 模式)
  // 2. 通过 define 加载但暴露到 window
  // 3. 某些情况下可能被其他库拦截
  Lunar = window.Lunar;
  Solar = window.Solar;
  
  // 调试日志
  console.log('=== lunar-utils.js 初始化 ===');
  console.log('window 对象存在:', typeof window !== 'undefined');
  console.log('window.dayjs 存在:', !!window.dayjs);
  console.log('window.Lunar 存在:', !!window.Lunar);
  console.log('window.Solar 存在:', !!window.Solar);
  console.log('window.Lunar 类型:', typeof window.Lunar);
  console.log('window.Solar 类型:', typeof window.Solar);
  console.log('===========================');
  
  if (!Lunar || !Solar) {
    console.error('❌ lunar-javascript 未正确加载！');
    console.error('当前 window 对象:', window);
    throw new Error('lunar-javascript 未正确加载，请检查：1) 库文件路径是否正确 2) 是否在引入 lunar-utils.js 之前加载了 lunar.js 3) 是否有其他库干扰');
  }
} else {
  // Node.js 环境：使用 ES6 模块导入（动态导入）
  const dayjsModule = await import('dayjs');
  const lunarModule = await import('lunar-javascript');
  dayjs = dayjsModule.default;
  Lunar = lunarModule.Lunar;
  Solar = lunarModule.Solar;
}

/**
 * 十二生肖
 */
const Animals = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

/**
 * 星座名称
 */
const constellations = [
  '摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座',
  '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座'
];

/**
 * 星座日期分界点
 */
const constellationDates = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 22, 22];

/**
 * 农历月份名称
 */
const lunarMonths = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];

/**
 * 农历日期名称
 */
const lunarDays = [
  "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
  "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
];

/**
 * 获取干支纪年（使用 lunar-javascript）
 * @param {number} year - 农历年份
 * @returns {string} 干支纪年，如"甲子"
 */
export function getGanZhi(year) {
  const lunar = Lunar.fromYmd(year, 1, 1);
  return lunar.getYearInGanZhi();
}

/**
 * 获取闰月月份（使用 lunar-javascript）
 * @param {number} year - 农历年份
 * @returns {number} 闰月月份，无闰月返回 0
 */
export function leapMonth(year) {
  const lunar = Lunar.fromYmd(year, 1, 1);
  const leapMonth = lunar.getLeapMonth();
  return leapMonth || 0;
}

/**
 * 获取闰月天数（使用 lunar-javascript）
 * @param {number} year - 农历年份
 * @returns {number} 闰月天数，无闰月返回 0
 */
export function leapDays(year) {
  const lunar = Lunar.fromYmd(year, 1, 1);
  const leapMonth = lunar.getLeapMonth();
  if (!leapMonth) return 0;
  
  // 使用 LunarMonth 对象获取闰月天数
  const lunarYear = LunarYear.fromYear(year);
  const lunarMonth = lunarYear.getMonth(leapMonth);
  return lunarMonth ? lunarMonth.getDayCount() : 0;
}

/**
 * 获取农历月天数（使用 lunar-javascript）
 * @param {number} year - 农历年份
 * @param {number} month - 农历月份（1-12）
 * @returns {number} 该月的天数（29 或 30）
 */
export function monthDays(year, month) {
  // 使用 LunarMonth 对象来获取月份天数
  const lunarYear = LunarYear.fromYear(year);
  const lunarMonth = lunarYear.getMonth(month);
  return lunarMonth ? lunarMonth.getDayCount() : 30;
}

/**
 * 获取生肖（按农历年份计算）
 * @param {number} year - 农历年份
 * @returns {string} 生肖名称
 * 
 * @example
 * getZodiac(1990) // "马"
 * getZodiac(1991) // "羊"
 * getZodiac(2000) // "龙"
 */
export function getZodiac(year) {
  // 使用 lunar-javascript 获取生肖
  const lunar = Lunar.fromYmd(year, 1, 1);
  return lunar.getYearShengXiao();
}

/**
 * 获取星座（按公历日期计算）
 * @param {number} month - 公历月份（1-12）
 * @param {number} day - 公历日期
 * @returns {string} 星座名称
 * 
 * @example
 * getConstellation(9, 13) // "处女座"
 * getConstellation(1, 1) // "摩羯座"
 */
export function getConstellation(month, day) {
  return constellations[month - 1] < day 
    ? constellations[month] 
    : constellations[month - 1];
}

/**
 * 公历转农历
 * @param {number} year - 公历年份
 * @param {number} month - 公历月份（1-12）
 * @param {number} day - 公历日期
 * @returns {Object} 农历信息对象
 * @returns {number} return.year - 农历年份
 * @returns {number} return.month - 农历月份（1-12）
 * @returns {number} return.day - 农历日期
 * @returns {boolean} return.isLeap - 是否为闰月
 * @returns {string} return.ganZhi - 干支纪年
 * @returns {string} return.animal - 生肖
 * 
 * @example
 * solarToLunar(1991, 9, 13)
 * // { year: 1991, month: 8, day: 6, isLeap: false, ganZhi: "辛未", animal: "羊" }
 */
export function solarToLunar(year, month, day) {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  
  // lunar.isLeap 可能是函数也可能是属性，需要检查
  const isLeap = typeof lunar.isLeap === 'function' ? lunar.isLeap() : lunar.isLeap;
  
  return {
    year: lunar.getYear(),
    month: Math.abs(lunar.getMonth()),  // 取绝对值，闰月也是正数
    day: lunar.getDay(),
    isLeap: isLeap,  // lunar-javascript 返回布尔值
    ganZhi: lunar.getYearInGanZhi(),
    animal: lunar.getYearShengXiao()
  };
}

/**
 * 农历转公历
 * @param {number} year - 农历年份
 * @param {number} month - 农历月份（1-12）
 * @param {number} day - 农历日期
 * @param {boolean} isLeapMonth - 是否为闰月
 * @returns {Object} 公历信息对象
 * @returns {number} return.year - 公历年份
 * @returns {number} return.month - 公历月份（1-12）
 * @returns {number} return.day - 公历日期
 * 
 * @example
 * lunarToSolar(1991, 8, 6, false)
 * // { year: 1991, month: 9, day: 13 }
 */
export function lunarToSolar(year, month, day, isLeapMonth = false) {
  // lunar-javascript 使用负数月份表示闰月
  const actualMonth = isLeapMonth ? -month : month;
  const lunar = Lunar.fromYmd(year, actualMonth, day);
  const solar = lunar.getSolar();
  
  return {
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay()
  };
}

/**
 * 格式化农历日期为中文显示
 * @param {Object} lunar - 农历信息对象
 * @returns {string} 格式化后的农历日期字符串
 * 
 * @example
 * formatLunarDate({ year: 1991, month: 8, day: 6, isLeap: false, ganZhi: "辛未", animal: "羊" })
 * // "农历辛未年（羊年）八月初六"
 */
export function formatLunarDate(lunar) {
  // lunar.isLeap 可能是函数也可能是属性
  const isLeap = typeof lunar.isLeap === 'function' ? lunar.isLeap() : lunar.isLeap;
  return `农历${lunar.ganZhi}年（${lunar.animal}年）${isLeap ? '闰' : ''}${lunarMonths[lunar.month - 1]}月${lunarDays[lunar.day - 1]}`;
}

/**
 * 格式化公历日期（使用 dayjs）
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {number} day - 日期
 * @returns {string} 格式化后的公历日期字符串
 * 
 * @example
 * formatSolarDate(1991, 9, 13)
 * // "1991 年 9 月 13 日"
 */
export function formatSolarDate(year, month, day) {
  return dayjs(`${year}-${month}-${day}`).format('YYYY 年 M 月 D 日');
}

/**
 * 计算年龄信息
 * @param {Object} birthDate - 出生日期信息
 * @param {number} birthDate.year - 出生年份
 * @param {number} birthDate.month - 出生月份
 * @param {number} birthDate.day - 出生日期
 * @param {boolean} birthDate.isLeap - 是否为闰月（仅农历需要）
 * @param {boolean} isLunar - 是否为农历输入
 * @returns {Object} 年龄信息对象
 * @returns {number} return.age - 周岁
 * @returns {number} return.virtualAge - 虚岁
 * @returns {number} return.days - 总天数
 * @returns {string} return.zodiac - 生肖
 * @returns {string} return.constellation - 星座
 * @returns {number} return.nextBirthday - 距离下次生日的天数
 * @returns {Date} return.nextBirthdayDate - 下次生日的日期
 * @returns {Object|null} return.solarDate - 如果是农历输入，返回对应的公历日期
 * 
 * @example
 * calculateAge({ year: 1991, month: 8, day: 6, isLeap: false }, true)
 * // { age: 32, virtualAge: 33, days: 12000, zodiac: "羊", constellation: "处女座", ... }
 */
export function calculateAge(birthDate, isLunar = false) {
  let solarBirthDate;
  let actualSolarDate = null;
  
  if (isLunar) {
    const solar = lunarToSolar(birthDate.year, birthDate.month, birthDate.day, birthDate.isLeap);
    solarBirthDate = dayjs(`${solar.year}-${solar.month}-${solar.day}`);
    actualSolarDate = solar;
  } else {
    solarBirthDate = dayjs(`${birthDate.year}-${birthDate.month}-${birthDate.day}`);
  }

  const today = dayjs();
  const diff = today.diff(solarBirthDate, 'day');
  const days = diff;
  
  let age = today.year() - solarBirthDate.year();
  const monthDiff = today.month() - solarBirthDate.month();
  const dayDiff = today.date() - solarBirthDate.date();
  
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  const virtualAge = age + 1;

  // 计算下次生日（使用 dayjs）
  let nextBirthday = today.year(today.year()).month(solarBirthDate.month()).date(solarBirthDate.date());
  if (nextBirthday.isBefore(today, 'day')) {
    nextBirthday = nextBirthday.add(1, 'year');
  }
  const daysToNextBirthday = nextBirthday.diff(today, 'day');

  // 获取生肖（使用农历年份）
  const lunarYear = isLunar ? birthDate.year : solarToLunar(today.year(), today.month() + 1, today.date()).year;
  const zodiac = getZodiac(lunarYear);

  // 获取星座
  const constellation = getConstellation(solarBirthDate.month() + 1, solarBirthDate.date());

  return {
    age,
    virtualAge,
    days,
    zodiac,
    constellation,
    nextBirthday: daysToNextBirthday,
    nextBirthdayDate: nextBirthday.toDate(),
    solarDate: actualSolarDate
  };
}

/**
 * 默认导出所有农历工具
 */
export default {
  Animals,
  lunarMonths,
  lunarDays,
  getGanZhi,
  leapMonth,
  leapDays,
  monthDays,
  getZodiac,
  getConstellation,
  solarToLunar,
  lunarToSolar,
  formatLunarDate,
  formatSolarDate,
  calculateAge
};
