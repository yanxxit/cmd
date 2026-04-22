# 农历转换算法调试指南

## 🔍 调试流程总览

```
发现偏差 → 记录现象 → 定位模块 → 添加日志 → 分析原因 → 修复验证
```

---

## 步骤 1：记录和复现问题

### 1.1 填写问题记录表

当发现农历转换有偏差时，首先记录以下信息：

```markdown
## 问题记录

**测试日期**: 2026-04-23
**测试工具**: 年龄计算器 / 自动化测试平台

### 问题现象
- 输入公历：YYYY-MM-DD
- 预期农历：XXXX 年 XX 月 XX 日（干支 XX，生肖 X）
- 实际显示：XXXX 年 XX 月 XX 日（干支 XX，生肖 X）
- 偏差类型：□日期差 1 天  □月份错误  □年份错误  □生肖错误  □干支错误

### 偏差详情
- 日期偏差：实际比预期 □早 1 天  □晚 1 天  □其他 ____
- 月份偏差：实际月份 ____ vs 预期月份 ____
- 年份偏差：实际年份 ____ vs 预期年份 ____
```

### 1.2 确认问题可复现

在浏览器控制台运行：

```javascript
// 替换为你的测试数据
const testDate = { year: 2024, month: 2, day: 10 };
const result = solarToLunar(testDate.year, testDate.month, testDate.day);
console.log('输入:', testDate);
console.log('实际输出:', result);
console.log('预期：农历正月初一，甲辰年，龙');
```

---

## 步骤 2：根据偏差类型定位问题模块

### 偏差类型诊断树

```
农历转换偏差
├── 年份错误 (lunarYear 不对)
│   ├── 偏差固定年数 → 基准日期计算问题
│   └── 偏差随机 → 闰年计算逻辑问题
│
├── 月份错误 (lunarMonth 不对)
│   ├── 偏差 1 个月 → 月天数累加问题
│   └── 闰月识别错误 → leapMonth() 逻辑问题
│
├── 日期错误 (lunarDay 不对)
│   ├── 偏差 1 天 → 基准日或时区问题
│   └── 偏差多天 → 日计算逻辑问题
│
└── 生肖/干支错误
    ├── 生肖错 → 年份取模运算问题
    └── 干支错 → 干支表索引问题
```

---

## 步骤 3：分模块调试

### 3.1 年份错误调试

**症状**：`lunarYear` 与预期不符

**调试代码**：

```javascript
function debugSolarToLunarYear(solarYear, solarMonth, solarDay) {
  const baseDate = new Date(1900, 0, 31); // 基准：1900-01-31
  const objDate = new Date(solarYear, solarMonth - 1, solarDay);
  const offset = Math.floor((objDate - baseDate) / 86400000);
  
  console.group('年份计算调试');
  console.log('基准日期:', baseDate.toDateString());
  console.log('目标日期:', objDate.toDateString());
  console.log('相差天数:', offset);
  
  let testYear = 1900;
  let remainingDays = offset;
  
  while (testYear <= solarYear && remainingDays > 0) {
    const daysInYear = 348 + leapDays(testYear);
    console.log(`${testYear}年: 全年${daysInYear}天 (闰${leapMonth(testYear)}月), 剩余${remainingDays}天`);
    remainingDays -= daysInYear;
    testYear++;
  }
  
  if (remainingDays < 0) {
    testYear--;
    remainingDays += 348 + leapDays(testYear);
    console.log(`回退到${testYear}年，剩余天数修正为：${remainingDays}`);
  }
  
  console.log('计算得到的农历年:', testYear);
  console.groupEnd();
  
  return testYear;
}

// 使用示例
debugSolarToLunarYear(2024, 2, 10);
```

**检查点**：
- [ ] 基准日期是否正确（1900-01-31）
- [ ] `offset` 天数计算是否正确
- [ ] `leapDays()` 返回值是否正确
- [ ] 年份循环是否正确终止

---

### 3.2 月份错误调试

**症状**：`lunarMonth` 与预期不符，特别是闰月

**调试代码**：

```javascript
function debugLunarMonth(lunarYear, remainingDays) {
  console.group(`农历${lunarYear}年月份计算`);
  console.log('年初剩余天数:', remainingDays);
  
  const leap = leapMonth(lunarYear);
  console.log('闰月:', leap ? `闰${leap}月` : '无');
  
  let testMonth = 1;
  let testRemaining = remainingDays;
  
  while (testMonth < 13 && testRemaining > 0) {
    const daysInMonth = monthDays(lunarYear, testMonth);
    console.log(`${testMonth}月：${daysInMonth}天，剩余${testRemaining}天`);
    
    testRemaining -= daysInMonth;
    if (testRemaining < 0) {
      console.log(`在${testMonth}月回退，实际应为${testMonth}月`);
      break;
    }
    testMonth++;
    
    // 检查闰月
    if (leap === testMonth) {
      const leapDaysCount = leapDays(lunarYear);
      console.log(`闰${testMonth}月：${leapDaysCount}天，剩余${testRemaining}天`);
      testRemaining -= leapDaysCount;
      if (testRemaining < 0) {
        console.log(`在闰${testMonth}月回退，实际应为闰${testMonth}月`);
        break;
      }
    }
  }
  
  console.log('计算得到的农历月:', testMonth);
  console.groupEnd();
  
  return testMonth;
}

// 使用示例
const lunar = solarToLunar(2020, 5, 23); // 2020 闰四月初一
debugLunarMonth(lunar.year, 10); // 假设年初剩余 10 天
```

**检查点**：
- [ ] `leapMonth()` 返回值是否正确
- [ ] 闰月是否被正确处理
- [ ] `monthDays()` 返回值是否正确
- [ ] 月份循环逻辑是否正确

---

### 3.3 日期错误调试

**症状**：`lunarDay` 偏差 1 天或多天

**调试代码**：

```javascript
function debugLunarDay(solarYear, solarMonth, solarDay) {
  console.group('日期计算调试');
  
  const baseDate = new Date(1900, 0, 31);
  const objDate = new Date(solarYear, solarMonth - 1, solarDay);
  const offset = Math.floor((objDate - baseDate) / 86400000);
  
  console.log('公历输入:', `${solarYear}-${solarMonth}-${solarDay}`);
  console.log('基准日期:', baseDate.toISOString());
  console.log('目标日期:', objDate.toISOString());
  console.log('时间戳差:', objDate - baseDate, '毫秒');
  console.log('计算天数:', offset, '天');
  
  // 检查时区问题
  const timezoneOffset = new Date().getTimezoneOffset();
  console.log('本地时区偏移:', timezoneOffset, '分钟');
  
  // 验证基准日是否正确
  console.log('基准日农历：应该是 1900 年正月初一');
  const baseLunar = solarToLunar(1900, 1, 31);
  console.log('实际计算:', baseLunar);
  
  console.groupEnd();
}

// 使用示例
debugLunarDay(2024, 2, 10);
```

**检查点**：
- [ ] 基准日期 `1900-01-31` 是否对应农历正月初一
- [ ] 时区是否影响计算（特别是跨天时）
- [ ] `Math.floor()` 是否正确处理小数
- [ ] `lunarDay = offset + 1` 的 `+1` 是否正确

---

### 3.4 生肖/干支错误调试

**症状**：生肖或干支与年份不匹配

**调试代码**：

```javascript
function debugGanZhiAndZodiac(lunarYear) {
  const Gan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const Zhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const Animals = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
  
  console.group(`年份${lunarYear}的干支生肖计算`);
  
  // 干支计算
  const ganIndex = (lunarYear - 4) % 10;
  const zhiIndex = (lunarYear - 4) % 12;
  const ganzhi = Gan[ganIndex] + Zhi[zhiIndex];
  
  console.log('天干索引:', ganIndex, '→', Gan[ganIndex]);
  console.log('地支索引:', zhiIndex, '→', Zhi[zhiIndex]);
  console.log('干支:', ganzhi);
  
  // 生肖计算
  const animalIndex = (lunarYear - 4) % 12;
  const animal = Animals[animalIndex];
  
  console.log('生肖索引:', animalIndex, '→', animal);
  
  // 验证基准年
  console.log('\n基准年验证:');
  console.log('1900 年：应该是庚子年（鼠）');
  console.log('1900 年实际:', Gan[(1900-4)%10] + Zhi[(1900-4)%12], Animals[(1900-4)%12]);
  
  console.log('2000 年：应该是庚辰年（龙）');
  console.log('2000 年实际:', Gan[(2000-4)%10] + Zhi[(2000-4)%12], Animals[(2000-4)%12]);
  
  console.log('2024 年：应该是甲辰年（龙）');
  console.log('2024 年实际:', Gan[(2024-4)%10] + Zhi[(2024-4)%12], Animals[(2024-4)%12]);
  
  console.groupEnd();
}

// 使用示例
debugGanZhiAndZodiac(2024);
```

**检查点**：
- [ ] 基准年（1900 年）的干支生肖是否正确
- [ ] 取模运算的索引起始是否正确（-4 的原因）
- [ ] 数组索引是否越界

---

## 步骤 4：使用 test-data.md 进行对比调试

### 4.1 选择对比测试组

从 `test-data.md` 中选择**相邻的测试用例**进行对比：

```javascript
// 测试用例组：春节前后
const testCases = [
  { solar: '2024-02-09', expected: '2023 年腊月三十', animal: '兔' },
  { solar: '2024-02-10', expected: '2024 年正月初一', animal: '龙' },
  { solar: '2024-02-11', expected: '2024 年正月初二', animal: '龙' },
];

testCases.forEach((tc, i) => {
  const [y, m, d] = tc.solar.split('-').map(Number);
  const result = solarToLunar(y, m, d);
  console.group(`测试${i+1}: ${tc.solar}`);
  console.log('预期:', tc.expected, tc.animal);
  console.log('实际:', `${result.year}年${result.month}月${result.day}日`, result.animal);
  console.log('偏差:', {
    year: result.year - (tc.expected.includes('2024') ? 2024 : 2023),
    month: '需要手动对比',
    day: '需要手动对比',
    animal: result.animal === tc.animal ? '✅' : '❌'
  });
  console.groupEnd();
});
```

### 4.2 偏差模式分析

根据测试结果，识别偏差模式：

| 偏差模式 | 可能原因 | 检查代码位置 |
|---------|---------|-------------|
| 所有日期都差 1 天 | 基准日错误或 `+1` 逻辑 | `lunarDay = offset + 1` |
| 春节前的日期年份 -1 | 农历年切换逻辑 | 年份循环终止条件 |
| 闰月日期月份 -1 | 闰月识别逻辑 | `if (leap && lunarMonth > leap)` |
| 只有特定年份错误 | `lunarInfo` 数据错误 | 检查对应年份的十六进制数据 |
| 生肖全部错误 | 基准年或取模逻辑 | `Animals[(year - 4) % 12]` |

---

## 步骤 5：常见 bug 速查

### Bug 1: 所有日期差 1 天

**症状**：所有测试用例的农历日期都偏差 1 天

**原因**：基准日期错误或 `offset` 计算错误

**修复**：

```javascript
// 错误示例
const baseDate = new Date(1900, 0, 1); // ❌ 应该是 1 月 31 日

// 正确
const baseDate = new Date(1900, 0, 31); // ✅ 农历正月初一

// 或者 lunarDay 计算错误
lunarDay = offset; // ❌ 应该是 offset + 1
lunarDay = offset + 1; // ✅
```

---

### Bug 2: 春节前生肖错误

**症状**：2024-02-09 显示属龙（应该是兔）

**原因**：农历年份切换逻辑错误

**修复**：

```javascript
// 检查年份循环的终止条件
for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
  let daysInYear = 348 + leapDays(lunarYear);
  offset -= daysInYear;
}

// 如果 offset < 0，需要回退一年
if (offset < 0) {
  offset += 348 + leapDays(--lunarYear); // ✅ 先--再使用
}
```

---

### Bug 3: 闰月日期错误

**症状**：2020 年闰四月的日期计算错误

**原因**：闰月处理逻辑错误

**修复**：

```javascript
// 检查闰月逻辑
let leap = leapMonth(lunarYear);

// 如果当前月大于闰月，月份 -1
if (leap && lunarMonth > leap) {
  lunarMonth--;
  isLeap = false;
}

// 如果是闰月本身
if (leap && lunarMonth === leap && offset >= monthDays(lunarYear, leap)) {
  isLeap = true;
  lunarMonth++; // ✅ 标记为闰月
}
```

---

### Bug 4: 特定年份数据错误

**症状**：只有某些年份的农历转换错误

**原因**：`lunarInfo` 数组中对应年份的数据错误

**调试**：

```javascript
// 验证 lunarInfo 数据
function verifyLunarInfoData(year) {
  const data = lunarInfo[year - 1900];
  console.log(`${year}年数据: 0x${data.toString(16)}`);
  console.log('闰月:', leapMonth(year));
  console.log('闰月天数:', leapDays(year));
  
  for (let m = 1; m <= 12; m++) {
    console.log(`${m}月天数:`, monthDays(year, m));
  }
}

// 对比权威数据
verifyLunarInfoData(2020); // 应该有闰四月
verifyLunarInfoData(2024); // 应该无闰月
```

**修复**：对照《中国天文年历》修正 `lunarInfo` 数组

---

## 步骤 6：使用自动化测试定位

在 [`test-runner.html`](./test-runner.html) 中：

1. 打开浏览器开发者工具（F12）
2. 运行失败的测试用例
3. 在 Console 中查看详细偏差
4. 根据偏差类型参考上述调试方法

---

## 调试检查清单

完成调试后，确认以下项目：

- [ ] 基准日期验证：1900-01-31 = 农历 1900 年正月初一
- [ ] 春节边界验证：2024-02-09 属兔，2024-02-10 属龙
- [ ] 闰月验证：2020 年闰四月存在
- [ ] 干支验证：2024 年 = 甲辰年
- [ ] 生肖验证：2000 年 = 龙年
- [ ] 星座验证：3 月 21 日 = 白羊座
- [ ] 年龄计算验证：周岁和虚岁关系正确

---

## 快速调试脚本

复制以下代码到浏览器控制台，一键诊断：

```javascript
function quickDiagnose(solarYear, solarMonth, solarDay, expected) {
  console.group(`🔍 快速诊断：${solarYear}-${solarMonth}-${solarDay}`);
  
  const result = solarToLunar(solarYear, solarMonth, solarDay);
  console.log('实际结果:', result);
  console.log('预期结果:', expected);
  
  // 检查各项偏差
  const issues = [];
  
  if (result.year !== expected.year) {
    issues.push(`❌ 年份错误：${result.year} vs ${expected.year}`);
  }
  if (result.month !== expected.month) {
    issues.push(`❌ 月份错误：${result.month} vs ${expected.month}`);
  }
  if (result.day !== expected.day) {
    issues.push(`❌ 日期错误：${result.day} vs ${expected.day}`);
  }
  if (result.animal !== expected.animal) {
    issues.push(`❌ 生肖错误：${result.animal} vs ${expected.animal}`);
  }
  if (result.ganZhi !== expected.ganZhi) {
    issues.push(`❌ 干支错误：${result.ganZhi} vs ${expected.ganZhi}`);
  }
  
  if (issues.length === 0) {
    console.log('✅ 所有检查通过');
  } else {
    console.log('发现问题:');
    issues.forEach(issue => console.log('  ' + issue));
  }
  
  console.groupEnd();
  return issues;
}

// 使用示例
quickDiagnose(2024, 2, 10, {
  year: 2024,
  month: 1,
  day: 1,
  animal: '龙',
  ganZhi: '甲辰'
});
```

---

**最后更新**: 2026-04-23  
**维护者**: Web 工具箱团队
