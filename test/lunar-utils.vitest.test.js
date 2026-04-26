import { describe, it, expect } from 'vitest';
import {
  leapMonth,
  leapDays,
  monthDays,
  getGanZhi,
  getZodiac,
  getConstellation,
  solarToLunar,
  lunarToSolar,
  formatLunarDate,
  formatSolarDate,
  calculateAge
} from '../src/util/lunar-utils.js';

describe('农历工具函数测试', () => {
  describe('leapMonth - 获取闰月月份', () => {
    it('1990 年闰五月', () => {
      expect(leapMonth(1990)).toBe(5);
    });

    it('1991 年没有闰月', () => {
      expect(leapMonth(1991)).toBe(0);
    });

    it('1995 年闰八月', () => {
      expect(leapMonth(1995)).toBe(8);
    });

    it('2001 年闰四月', () => {
      expect(leapMonth(2001)).toBe(4);
    });

    it('2024 年没有闰月', () => {
      expect(leapMonth(2024)).toBe(0);
    });
  });

  describe('leapDays - 获取闰月天数', () => {
    it('1991 年没有闰月，返回 0', () => {
      expect(leapDays(1991)).toBe(0);
    });

    it('1990 年闰五月有 29 天', () => {
      expect(leapDays(1990)).toBe(29);
    });

    it('1995 年闰八月有 29 天', () => {
      expect(leapDays(1995)).toBe(29);
    });

    it('2001 年闰四月有 29 天', () => {
      expect(leapDays(2001)).toBe(29);
    });
  });

  describe('monthDays - 获取农历月天数', () => {
    it('1991 年正月有 29 天', () => {
      expect(monthDays(1991, 1)).toBe(29);
    });

    it('1991 年二月有 30 天', () => {
      expect(monthDays(1991, 2)).toBe(30);
    });

    it('1991 年八月有 30 天', () => {
      expect(monthDays(1991, 8)).toBe(30);
    });
  });

  describe('getGanZhi - 获取干支纪年', () => {
    it('1990 年是庚午年', () => {
      expect(getGanZhi(1990)).toBe('庚午');
    });

    it('1991 年是辛未年', () => {
      expect(getGanZhi(1991)).toBe('辛未');
    });

    it('2000 年是庚辰年', () => {
      expect(getGanZhi(2000)).toBe('庚辰');
    });

    it('2024 年是甲辰年', () => {
      expect(getGanZhi(2024)).toBe('甲辰');
    });

    it('1900 年是庚子年', () => {
      expect(getGanZhi(1900)).toBe('庚子');
    });
  });

  describe('getZodiac - 获取生肖', () => {
    it('1990 年属马', () => {
      expect(getZodiac(1990)).toBe('马');
    });

    it('1991 年属羊', () => {
      expect(getZodiac(1991)).toBe('羊');
    });

    it('1992 年属猴', () => {
      expect(getZodiac(1992)).toBe('猴');
    });

    it('1993 年属鸡', () => {
      expect(getZodiac(1993)).toBe('鸡');
    });

    it('1994 年属狗', () => {
      expect(getZodiac(1994)).toBe('狗');
    });

    it('1995 年属猪', () => {
      expect(getZodiac(1995)).toBe('猪');
    });

    it('1996 年属鼠', () => {
      expect(getZodiac(1996)).toBe('鼠');
    });

    it('1997 年属牛', () => {
      expect(getZodiac(1997)).toBe('牛');
    });

    it('1998 年属虎', () => {
      expect(getZodiac(1998)).toBe('虎');
    });

    it('1999 年属兔', () => {
      expect(getZodiac(1999)).toBe('兔');
    });

    it('2000 年属龙', () => {
      expect(getZodiac(2000)).toBe('龙');
    });

    it('2001 年属蛇', () => {
      expect(getZodiac(2001)).toBe('蛇');
    });

    it('2024 年属龙', () => {
      expect(getZodiac(2024)).toBe('龙');
    });

    it('1900 年属鼠', () => {
      expect(getZodiac(1900)).toBe('鼠');
    });
  });

  describe('getConstellation - 获取星座', () => {
    it('1 月 1 日是摩羯座', () => {
      expect(getConstellation(1, 1)).toBe('摩羯座');
    });

    it('1 月 20 日是摩羯座', () => {
      expect(getConstellation(1, 20)).toBe('摩羯座');
    });

    it('1 月 21 日是水瓶座', () => {
      expect(getConstellation(1, 21)).toBe('水瓶座');
    });

    it('2 月 19 日是水瓶座', () => {
      expect(getConstellation(2, 19)).toBe('水瓶座');
    });

    it('2 月 20 日是双鱼座', () => {
      expect(getConstellation(2, 20)).toBe('双鱼座');
    });

    it('3 月 21 日是白羊座', () => {
      expect(getConstellation(3, 21)).toBe('白羊座');
    });

    it('9 月 13 日是处女座', () => {
      expect(getConstellation(9, 13)).toBe('处女座');
    });

    it('12 月 22 日是射手座', () => {
      expect(getConstellation(12, 22)).toBe('射手座');
    });

    it('12 月 23 日是摩羯座', () => {
      expect(getConstellation(12, 23)).toBe('摩羯座');
    });
  });

  describe('solarToLunar - 公历转农历', () => {
    it('1991 年 9 月 13 日是农历八月初六', () => {
      const lunar = solarToLunar(1991, 9, 13);
      expect(lunar.year).toBe(1991);
      expect(lunar.month).toBe(8);
      expect(lunar.day).toBe(6);
      expect(lunar.isLeap).toBe(false);
      expect(lunar.ganZhi).toBe('辛未');
      expect(lunar.animal).toBe('羊');
    });

    it('1990 年 6 月 27 日是农历五月初五（端午节）', () => {
      const lunar = solarToLunar(1990, 6, 27);
      expect(lunar.year).toBe(1990);
      expect(lunar.month).toBe(5);
      expect(lunar.day).toBe(5);
      expect(lunar.isLeap).toBe(false);
      expect(lunar.animal).toBe('马');
    });

    it('2000 年 2 月 5 日是农历正月初一（春节）', () => {
      const lunar = solarToLunar(2000, 2, 5);
      expect(lunar.year).toBe(2000);
      expect(lunar.month).toBe(1);
      expect(lunar.day).toBe(1);
      expect(lunar.isLeap).toBe(false);
      expect(lunar.animal).toBe('龙');
    });

    it('2024 年 2 月 10 日是农历正月初一（春节）', () => {
      const lunar = solarToLunar(2024, 2, 10);
      expect(lunar.year).toBe(2024);
      expect(lunar.month).toBe(1);
      expect(lunar.day).toBe(1);
      expect(lunar.isLeap).toBe(false);
      expect(lunar.animal).toBe('龙');
    });

    it('1995 年 10 月 8 日是农历闰八月十四', () => {
      const lunar = solarToLunar(1995, 10, 8);
      expect(lunar.year).toBe(1995);
      expect(lunar.month).toBe(8);
      expect(lunar.day).toBe(14);
      expect(lunar.isLeap).toBe(true);
      expect(lunar.animal).toBe('猪');
    });
  });

  describe('lunarToSolar - 农历转公历', () => {
    it('农历 1991 年八月初六是公历 1991 年 9 月 13 日', () => {
      const solar = lunarToSolar(1991, 8, 6, false);
      expect(solar.year).toBe(1991);
      expect(solar.month).toBe(9);
      expect(solar.day).toBe(13);
    });

    it('农历 1990 年五月初五是公历 1990 年 6 月 27 日', () => {
      const solar = lunarToSolar(1990, 5, 5, false);
      expect(solar.year).toBe(1990);
      expect(solar.month).toBe(6);
      expect(solar.day).toBe(27);
    });

    it('农历 2000 年正月初一是公历 2000 年 2 月 5 日', () => {
      const solar = lunarToSolar(2000, 1, 1, false);
      expect(solar.year).toBe(2000);
      expect(solar.month).toBe(2);
      expect(solar.day).toBe(5);
    });

    it('农历 2024 年正月初一是公历 2024 年 2 月 10 日', () => {
      const solar = lunarToSolar(2024, 1, 1, false);
      expect(solar.year).toBe(2024);
      expect(solar.month).toBe(2);
      expect(solar.day).toBe(10);
    });

    it('农历 1995 年闰八月十五是公历 1995 年 10 月 9 日', () => {
      const solar = lunarToSolar(1995, 8, 15, true);
      expect(solar.year).toBe(1995);
      expect(solar.month).toBe(10);
      expect(solar.day).toBe(9);
    });
  });

  describe('formatLunarDate - 格式化农历日期', () => {
    it('格式化 1991 年八月初六', () => {
      const lunar = {
        year: 1991,
        month: 8,
        day: 6,
        isLeap: false,
        ganZhi: '辛未',
        animal: '羊'
      };
      expect(formatLunarDate(lunar)).toBe('农历辛未年（羊年）八月初六');
    });

    it('格式化 1995 年闰八月', () => {
      const lunar = {
        year: 1995,
        month: 8,
        day: 15,
        isLeap: true,
        ganZhi: '乙亥',
        animal: '猪'
      };
      expect(formatLunarDate(lunar)).toBe('农历乙亥年（猪年）闰八月十五');
    });
  });

  describe('formatSolarDate - 格式化公历日期', () => {
    it('格式化 1991 年 9 月 13 日', () => {
      expect(formatSolarDate(1991, 9, 13)).toBe('1991 年 9 月 13 日');
    });

    it('格式化 2000 年 2 月 5 日', () => {
      expect(formatSolarDate(2000, 2, 5)).toBe('2000 年 2 月 5 日');
    });
  });

  describe('calculateAge - 计算年龄', () => {
    it('计算公历 1991 年 8 月 25 日出生的年龄', () => {
      const birthDate = { year: 1991, month: 8, day: 25 };
      const result = calculateAge(birthDate, false);
      
      expect(result.age).toBeGreaterThanOrEqual(0);
      expect(result.virtualAge).toBe(result.age + 1);
      expect(result.days).toBeGreaterThan(0);
      expect(result.zodiac).toBe('羊');
      expect(result.constellation).toBe('处女座');
      expect(result.nextBirthday).toBeGreaterThanOrEqual(0);
      expect(result.solarDate).toBeNull();
    });

    it('计算农历 1991 年八月初六出生的年龄', () => {
      const birthDate = { year: 1991, month: 8, day: 6, isLeap: false };
      const result = calculateAge(birthDate, true);
      
      expect(result.age).toBeGreaterThanOrEqual(0);
      expect(result.virtualAge).toBe(result.age + 1);
      expect(result.days).toBeGreaterThan(0);
      expect(result.zodiac).toBe('羊');
      expect(result.constellation).toBe('处女座');
      expect(result.nextBirthday).toBeGreaterThanOrEqual(0);
      expect(result.solarDate).toEqual({ year: 1991, month: 9, day: 13 });
    });

    it('计算农历 1995 年闰八月十五出生的年龄', () => {
      const birthDate = { year: 1995, month: 8, day: 15, isLeap: true };
      const result = calculateAge(birthDate, true);
      
      expect(result.age).toBeGreaterThanOrEqual(0);
      expect(result.virtualAge).toBe(result.age + 1);
      expect(result.days).toBeGreaterThan(0);
      expect(result.zodiac).toBe('猪');
      expect(result.solarDate).toEqual({ year: 1995, month: 10, day: 9 });
    });
  });

  describe('集成测试 - 农历公历互转', () => {
    it('农历转公历再转回农历，应该得到相同结果', () => {
      const lunar1 = { year: 1991, month: 8, day: 6, isLeap: false };
      const solar = lunarToSolar(lunar1.year, lunar1.month, lunar1.day, lunar1.isLeap);
      const lunar2 = solarToLunar(solar.year, solar.month, solar.day);
      
      expect(lunar2.year).toBe(lunar1.year);
      expect(lunar2.month).toBe(lunar1.month);
      expect(lunar2.day).toBe(lunar1.day);
      expect(lunar2.isLeap).toBe(lunar1.isLeap);
    });

    it('公历转农历再转回公历，应该得到相同结果', () => {
      const solar1 = { year: 1991, month: 9, day: 13 };
      const lunar = solarToLunar(solar1.year, solar1.month, solar1.day);
      const solar2 = lunarToSolar(lunar.year, lunar.month, lunar.day, lunar.isLeap);
      
      expect(solar2.year).toBe(solar1.year);
      expect(solar2.month).toBe(solar1.month);
      expect(solar2.day).toBe(solar1.day);
    });
  });

  describe('边界测试', () => {
    it('1900 年 1 月 31 日（农历基准日期）', () => {
      const lunar = solarToLunar(1900, 1, 31);
      expect(lunar.year).toBe(1900);
      expect(lunar.month).toBe(1);
      expect(lunar.day).toBe(1);
      expect(lunar.animal).toBe('鼠');
    });

    it('2100 年 12 月 31 日（范围边界）', () => {
      const lunar = solarToLunar(2100, 12, 31);
      expect(lunar.year).toBeGreaterThanOrEqual(2099);
      expect(lunar.year).toBeLessThanOrEqual(2101);
    });

    it('生肖计算跨 12 年周期', () => {
      expect(getZodiac(1990)).toBe(getZodiac(2002));
      expect(getZodiac(1991)).toBe(getZodiac(2003));
      expect(getZodiac(1992)).toBe(getZodiac(2004));
    });
  });
});
