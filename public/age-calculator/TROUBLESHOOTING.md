# 年龄计算器 - 问题排查完整指南

当你发现农历转换或年龄计算有偏差时，按照以下流程进行问题排查。

---

## 📋 快速诊断流程图

```
发现偏差
  ↓
1. 记录问题现象（使用问题记录模板）
  ↓
2. 访问调试工具 → http://127.0.0.1:3001/age-calculator/debugger.html
  ↓
3. 输入测试数据，查看逐步计算过程
  ↓
4. 根据偏差类型定位问题模块
  ↓
5. 使用调试代码深入分析
  ↓
6. 修复并验证
```

---

## 🔧 调试资源清单

### 资源 1：交互式调试器（首选）
- **访问**：http://127.0.0.1:3001/age-calculator/debugger.html
- **用途**：可视化展示每一步计算过程
- **特点**：
  - ✅ 逐步显示计算逻辑
  - ✅ 实时对比预期和实际结果
  - ✅ 控制台日志输出
  - ✅ 数据可视化验证
  - ✅ 预设关键测试点

**使用场景**：
- 首次发现问题，需要全面了解计算过程
- 需要向学生/同事展示算法逻辑
- 快速定位问题所在模块

---

### 资源 2：自动化测试平台
- **访问**：http://127.0.0.1:3001/age-calculator/test-runner.html
- **用途**：批量验证 28 个测试用例
- **特点**：
  - ✅ 一键运行所有测试
  - ✅ 自动统计通过率
  - ✅ 标记失败用例
  - ✅ 进度可视化

**使用场景**：
- 修复 bug 后回归测试
- 验证算法整体准确性
- 持续集成测试

---

### 资源 3：详细调试指南
- **文件**：[DEBUG-GUIDE.md](./DEBUG-GUIDE.md)
- **用途**：系统性调试方法论
- **内容**：
  - 偏差类型诊断树
  - 分模块调试代码
  - 常见 Bug 速查
  - 快速诊断脚本

**使用场景**：
- 深入理解算法原理
- 学习调试方法
- 查找特定问题的解决方案

---

### 资源 4：测试数据文档
- **文件**：[test-data.md](./test-data.md)
- **用途**：提供权威测试用例
- **内容**：
  - 6 大类测试用例
  - 预期结果对照表
  - 历史名人出生日期
  - 特殊日期验证

**使用场景**：
- 获取标准测试数据
- 验证修复结果
- 对比权威来源

---

## 🎯 根据偏差类型选择调试策略

### 类型 A：所有日期偏差固定天数

**症状**：
- 所有测试用例都差 1 天（或多天）
- 偏差方向一致（都早或都晚）

**可能原因**：
1. 基准日期错误
2. `offset` 计算错误
3. `lunarDay = offset + 1` 的 `+1` 逻辑错误

**调试步骤**：
1. 打开 [debugger.html](./debugger.html)
2. 输入任意日期（如 2024-02-10）
3. 查看"步骤 1: 计算日期差"
4. 验证基准日期是否为 1900-01-31
5. 在控制台运行：
   ```javascript
   const base = new Date(1900, 0, 31);
   console.log('基准日期:', base.toDateString());
   console.log('应该是：1900 年 1 月 31 日 周日');
   ```

**修复检查**：
```javascript
// ❌ 错误
const baseDate = new Date(1900, 0, 1); // 基准日错误
lunarDay = offset; // 缺少 +1

// ✅ 正确
const baseDate = new Date(1900, 0, 31); // 农历正月初一
lunarDay = offset + 1;
```

---

### 类型 B：春节前后生肖错误

**症状**：
- 2024-02-09 显示属龙（应该是兔）
- 2024-02-10 显示属兔（应该是龙）

**可能原因**：
1. 农历年份切换逻辑错误
2. 年份循环终止条件错误

**调试步骤**：
1. 打开 [debugger.html](./debugger.html)
2. 测试 2024-02-09 和 2024-02-10 两个日期
3. 对比"步骤 2: 确定农历年份"
4. 查看年份循环是否正确回退

**修复检查**：
```javascript
// ❌ 错误
if (offset < 0) {
  offset += 348 + leapDays(lunarYear); // 没有回退年份
}

// ✅ 正确
if (offset < 0) {
  offset += 348 + leapDays(--lunarYear); // 先回退年份
}
```

---

### 类型 C：闰月日期错误

**症状**：
- 2020 年闰四月的日期计算错误
- 闰月被当成普通月份

**调试步骤**：
1. 打开 [debugger.html](./debugger.html)
2. 输入 2020-05-23（闰四月初一）
3. 查看"步骤 3: 确定农历月份"
4. 检查闰月识别逻辑

**修复检查**：
```javascript
// 关键逻辑
const leap = leapMonth(lunarYear);

// 如果当前月大于闰月，月份 -1
if (leap && lunarMonth > leap) {
  lunarMonth--;
}

// 如果是闰月本身
if (leap && lunarMonth === leap && offset >= monthDays(lunarYear, leap)) {
  isLeap = true;
  lunarMonth++; // 标记为闰月
}
```

---

### 类型 D：特定年份数据错误

**症状**：
- 只有某些年份的农历转换错误
- 其他年份正常

**可能原因**：
- `lunarInfo` 数组中对应年份的数据错误

**调试步骤**：
1. 打开 [debugger.html](./debugger.html)
2. 切换到"数据验证"标签
3. 查看错误年份的 `lunarInfo` 数据
4. 对比权威来源

**验证代码**：
```javascript
function verifyLunarInfo(year) {
  const data = lunarInfo[year - 1900];
  console.log(`${year}年数据:`);
  console.log('  十六进制:', data.toString(16).toUpperCase());
  console.log('  闰月:', leapMonth(year));
  console.log('  闰月天数:', leapDays(year));
  console.log('  各月天数:');
  for (let m = 1; m <= 12; m++) {
    console.log(`    ${m}月：${monthDays(year, m)}天`);
  }
}

// 验证 2020 年（应该有闰四月）
verifyLunarInfo(2020);
```

---

### 类型 E：生肖/干支全部错误

**症状**：
- 所有年份的生肖都不对
- 干支纪年错误

**可能原因**：
1. 基准年错误
2. 取模运算错误
3. 数组索引错误

**调试步骤**：
1. 在控制台运行：
   ```javascript
   console.log('1900 年应该是庚子年（鼠）');
   console.log('实际:', getGanZhi(1900), getZodiac(1900));
   
   console.log('2000 年应该是庚辰年（龙）');
   console.log('实际:', getGanZhi(2000), getZodiac(2000));
   
   console.log('2024 年应该是甲辰年（龙）');
   console.log('实际:', getGanZhi(2024), getZodiac(2024));
   ```

**修复检查**：
```javascript
// ❌ 错误
const ganzhi = Gan[year % 10] + Zhi[year % 12]; // 基准错误
const zodiac = Animals[year % 12]; // 基准错误

// ✅ 正确
const ganzhi = Gan[(year - 4) % 10] + Zhi[(year - 4) % 12];
const zodiac = Animals[(year - 4) % 12];
```

---

## 📝 问题记录模板

复制以下模板记录你的问题：

```markdown
## 问题记录

**发现时间**: 2026-04-23
**发现方式**: □手动测试 □自动化测试 □用户反馈

### 问题描述
- 输入：公历 YYYY-MM-DD
- 预期输出：农历 XXXX 年 XX 月 XX 日（生肖 X）
- 实际输出：农历 XXXX 年 XX 月 XX 日（生肖 X）
- 偏差类型：□日期差  □月份错  □年份错  □生肖错  □干支错

### 复现步骤
1. 访问 http://127.0.0.1:3001/age-calculator/
2. 选择"公历生日"
3. 输入 YYYY-MM-DD
4. 点击"立即计算"

### 调试过程
- [ ] 已使用 debugger.html 查看逐步计算
- [ ] 已运行自动化测试
- [ ] 已查阅 DEBUG-GUIDE.md
- [ ] 已对比 test-data.md 中的预期结果

### 可能原因
根据调试，问题可能出在：
- □基准日期计算
- □年份循环逻辑
- □月份累加逻辑
- □闰月处理
- □干支生肖计算
- □lunarInfo 数据错误

### 修复方案
（填写具体修复代码）

### 验证结果
- [ ] 原测试用例通过
- [ ] 所有回归测试通过
- [ ] 边界条件验证通过
```

---

## 🚀 快速修复检查清单

修复问题后，确认以下测试全部通过：

### P0 级（必须通过）
- [ ] 2024-02-09 → 属兔
- [ ] 2024-02-10 → 属龙
- [ ] 2000-02-04 → 属兔
- [ ] 2000-02-05 → 属龙
- [ ] 3 月 20 日 → 双鱼座
- [ ] 3 月 21 日 → 白羊座

### P1 级（建议通过）
- [ ] 2020 年闰四月存在
- [ ] 1900-01-31 → 农历正月初一
- [ ] 年龄计算：2000-06-15 → 25 岁（2026 年）
- [ ] 干支纪年：2024 → 甲辰

### P2 级（优化项）
- [ ] 所有 28 个自动化测试通过
- [ ] 性能优化（无卡顿）
- [ ] UI 显示正常

---

## 📞 获取帮助

如果以上方法都无法解决问题：

1. **查看完整文档**：
   - [DEBUG-GUIDE.md](./DEBUG-GUIDE.md) - 详细调试指南
   - [test-data.md](./test-data.md) - 测试数据对照
   - [QUICK-TEST.md](./QUICK-TEST.md) - 快速测试指南

2. **使用调试工具**：
   - [debugger.html](./debugger.html) - 交互式调试器
   - [test-runner.html](./test-runner.html) - 自动化测试

3. **收集以下信息**：
   - 问题现象描述
   - 测试输入和输出
   - 调试器截图
   - 控制台日志
   - 已尝试的修复方法

---

**最后更新**: 2026-04-23  
**维护者**: Web 工具箱团队
