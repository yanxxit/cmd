// 使用 lunar-javascript 验证农历转换结果
import { Lunar, Solar } from 'lunar-javascript';

console.log('=== 公历转农历测试 ===\n');

const solarTests = [
  { year: 1991, month: 9, day: 13 },
  { year: 1990, month: 6, day: 27 },
  { year: 2000, month: 2, day: 5 },
  { year: 2024, month: 2, day: 10 },
  { year: 1995, month: 10, day: 8 }
];

solarTests.forEach(test => {
  const solar = Solar.fromYmd(test.year, test.month, test.day);
  const lunar = solar.getLunar();
  console.log(`公历 ${test.year}-${test.month}-${test.day}`);
  console.log(`  → 农历：${lunar.getYear()}年${lunar.getMonth()}月${lunar.getDay()}日`);
  console.log(`  → 是否闰月：${lunar.isLeap()}`);
  console.log(`  → 干支：${lunar.getYearInGanZhi()}`);
  console.log(`  → 生肖：${lunar.getYearShengXiao()}`);
  console.log('');
});

console.log('\n=== 农历转公历测试 ===\n');

const lunarTests = [
  { year: 1991, month: 8, day: 6, isLeap: false },
  { year: 1990, month: 5, day: 5, isLeap: false },
  { year: 2000, month: 1, day: 1, isLeap: false },
  { year: 2024, month: 1, day: 1, isLeap: false },
  { year: 1995, month: 8, day: 15, isLeap: true }
];

lunarTests.forEach(test => {
  const lunar = Lunar.fromYmd(test.year, test.month, test.day, test.isLeap ? 1 : 0);
  const solar = lunar.getSolar();
  console.log(`农历 ${test.year}年${test.month}月${test.day}日 ${test.isLeap ? '(闰月)' : ''}`);
  console.log(`  → 公历：${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`);
  console.log('');
});

console.log('\n=== 闰月测试 ===\n');

const leapTests = [1990, 1991, 1995, 2000, 2001, 2024];
leapTests.forEach(year => {
  const lunar = Lunar.fromYmd(year, 1, 1);
  const leapMonth = lunar.getLeapMonth();
  console.log(`${year}年：闰月=${leapMonth || '无'}`);
});
