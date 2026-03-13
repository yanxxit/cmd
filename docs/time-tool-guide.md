# 时间工具使用文档

> 📅 创建时间：2026-03-13  
> 📋 技术栈：Vue 3 + Tailwind CSS

---

## 🎯 功能概述

基于 Vue 3 实现的时间工具页面，支持：
- ✅ 实时时钟显示（每秒更新）
- ✅ 多时区切换（19 个时区）
- ✅ 时间 → 时间戳转换
- ✅ 时间戳 → 时间转换
- ✅ 常用时间戳参考
- ✅ 明/暗主题切换
- ✅ 一键复制功能

---

## 📁 文件结构

```
public/time/
└── index.html          # 时间工具页面
```

---

## 🎨 页面布局

```
┌─────────────────────────────────────────────────┐
│           ⏰ 时间工具                            │
│     实时时钟 · 时区转换 · 时间戳转换             │
├─────────────────────────────────────────────────┤
│  🕐 实时时钟                                     │
│  12:34:56                                       │
│  2026 年 3 月 13 日 星期五                        │
│  时区：[北京时间 ▼]                              │
├─────────────────────┬───────────────────────────┤
│  📅 时间 → 时间戳    │  🔄 时间戳 → 时间          │
│  [日期选择器]        │  [输入时间戳]             │
│  毫秒：1234567890    │  结果：2026-03-13...      │
│  秒：1234567         │  [当前] [清空]            │
├─────────────────────────────────────────────────┤
│  📌 常用时间戳参考                               │
│  今天 00:00 | 本周开始 | 本月开始 | 今年开始     │
└─────────────────────────────────────────────────┘
```

---

## 🔧 功能详解

### 1. 实时时钟

**显示格式：** `YYYY-MM-DD HH:mm:ss`

**支持时区：**
| 时区 | 偏移 | 时区 | 偏移 |
|------|------|------|------|
| 北京时间 | +08:00 | 伦敦时间 | +00:00 |
| 东京时间 | +09:00 | 纽约时间 | -05:00 |
| 首尔时间 | +09:00 | 洛杉矶时间 | -08:00 |
| 香港时间 | +08:00 | 悉尼时间 | +11:00 |
| ... | ... | ... | ... |

**切换时区：**
- 点击时区下拉框
- 选择目标时区
- 时间自动更新

### 2. 时间 → 时间戳

**操作步骤：**
1. 点击日期时间选择器
2. 选择日期和时间
3. 自动生成毫秒和秒时间戳
4. 点击"复制"按钮复制

**输出格式：**
- 毫秒：`1710316800000`
- 秒：`1710316800`

### 3. 时间戳 → 时间

**操作步骤：**
1. 输入时间戳（毫秒或秒）
2. 自动识别时间戳类型
3. 显示多种格式的时间

**支持格式：**
- 格式 1：`2026-03-13 12:34:56`
- 格式 2：`2026/03/13 12:34:56`
- 格式 3：`13/03/2026 12:34:56`

**快捷操作：**
- **当前时间戳** - 一键填入当前时间戳
- **清空** - 清空输入和结果

### 4. 常用时间戳参考

| 参考点 | 说明 | 自动计算 |
|--------|------|----------|
| 今天 00:00:00 | 当日开始时间 | ✅ |
| 本周开始 (周一) | 当周周一 00:00 | ✅ |
| 本月开始 | 当月 1 日 00:00 | ✅ |
| 今年开始 | 当年 1 月 1 日 00:00 | ✅ |

---

## 💻 使用指南

### 访问页面

```bash
# 1. 启动服务
x-static

# 2. 访问时间工具
http://127.0.0.1:3000/time/
```

### 切换时区

1. 点击时区下拉框
2. 选择目标时区（如"纽约时间"）
3. 实时时钟自动更新为对应时区时间

### 时间转时间戳

1. 点击"选择日期时间"
2. 选择日期：2026-03-13
3. 选择时间：12:00:00
4. 查看生成的时间戳
5. 点击"复制"按钮

### 时间戳转时间

1. 输入时间戳：`1710316800000`
2. 自动显示转换结果
3. 支持三种时间格式

### 主题切换

点击右上角的 🌙/☀️ 按钮切换明/暗主题

---

## 🔧 技术实现

### Vue 3 Composition API

```javascript
const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

createApp({
  setup() {
    const isDark = ref(false);
    const currentTime = ref('');
    const selectedTimezone = ref('Asia/Shanghai');
    let timer = null;

    const updateTime = () => {
      const now = new Date();
      currentTime.value = now.toLocaleTimeString('zh-CN', {
        timeZone: selectedTimezone.value,
        hour12: false
      });
    };

    onMounted(() => {
      updateTime();
      timer = setInterval(updateTime, 1000);
    });

    onUnmounted(() => {
      if (timer) clearInterval(timer);
    });

    return { isDark, currentTime, selectedTimezone, updateTime };
  }
}).mount('#app');
```

### 时区处理

```javascript
const timezones = [
  { value: 'Asia/Shanghai', label: '北京时间', offset: '+08:00' },
  { value: 'America/New_York', label: '纽约时间', offset: '-05:00' },
  // ...
];

// 使用时区格式化时间
const options = { 
  timeZone: selectedTimezone.value,
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
};
currentTime.value = now.toLocaleTimeString('zh-CN', options);
```

### 时间戳转换

```javascript
// 时间 → 时间戳
const timestamp = new Date(dateTimeInput.value).getTime();

// 时间戳 → 时间
let timestamp = parseInt(input);
if (timestamp < 10000000000) {
  // 10 位数字，认为是秒
  timestamp = timestamp * 1000;
}
const date = new Date(timestamp);
```

---

## 📊 时区列表

| 地区 | 时区 | 偏移 |
|------|------|------|
| 世界协调时 | UTC | +00:00 |
| 北京时间 | Asia/Shanghai | +08:00 |
| 东京时间 | Asia/Tokyo | +09:00 |
| 首尔时间 | Asia/Seoul | +09:00 |
| 香港时间 | Asia/Hong_Kong | +08:00 |
| 台北时间 | Asia/Taipei | +08:00 |
| 新加坡时间 | Asia/Singapore | +08:00 |
| 曼谷时间 | Asia/Bangkok | +07:00 |
| 迪拜时间 | Asia/Dubai | +04:00 |
| 伦敦时间 | Europe/London | +00:00 |
| 巴黎时间 | Europe/Paris | +01:00 |
| 柏林时间 | Europe/Berlin | +01:00 |
| 莫斯科时间 | Europe/Moscow | +03:00 |
| 纽约时间 | America/New_York | -05:00 |
| 洛杉矶时间 | America/Los_Angeles | -08:00 |
| 芝加哥时间 | America/Chicago | -06:00 |
| 多伦多时间 | America/Toronto | -05:00 |
| 悉尼时间 | Australia/Sydney | +11:00 |
| 奥克兰时间 | Pacific/Auckland | +13:00 |

---

## 🎨 主题定制

### 浅色主题

```css
:root {
  --bg-color: #ffffff;
  --text-color: #111827;
  --border-color: #e5e7eb;
  --card-bg: #ffffff;
  --input-bg: #ffffff;
  --muted-text: #6b7280;
}
```

### 深色主题

```css
[data-theme="dark"] {
  --bg-color: #111827;
  --text-color: #f9fafb;
  --border-color: #374151;
  --card-bg: #1f2937;
  --input-bg: #374151;
  --muted-text: #9ca3af;
}
```

---

## 🐛 常见问题

### 1. 时间戳转换错误

**原因：** 时间戳单位混淆（秒 vs 毫秒）

**解决：** 自动识别，10 位数字按秒处理，13 位按毫秒处理

### 2. 时区不更新

**原因：** 浏览器不支持 Intl API

**解决：** 升级浏览器到最新版本

### 3. 复制功能无效

**原因：** 浏览器权限限制

**解决：** 允许网站访问剪贴板权限

---

## 🔗 相关资源

- [Vue 3 文档](https://vuejs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Intl.DateTimeFormat](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)

---

## 📝 更新日志

### v1.0.0 (2026-03-13)
- ✅ 初始版本发布
- ✅ 实时时钟显示
- ✅ 19 个时区支持
- ✅ 时间戳双向转换
- ✅ 常用时间戳参考
- ✅ 明/暗主题切换

---

*本文档基于 v1 版本编写，如有更新请参考最新代码。*
