/**
 * 自然语言解析工具
 * 
 * 支持语法:
 * - 日期：明天、下周、2026-03-25
 * - 时间：下午 3 点、15:00
 * - 优先级：🔴、🟡、🟢 或 !high、!medium、!low
 * - 标签：#工作、#生活
 * - 分类：@会议、@家
 * - 重复：每天、每周一
 */

import type { Priority, ParsedResult } from '../types';

/**
 * 解析自然语言输入
 */
export function parseNaturalLanguage(input: string): ParsedResult {
  const result: ParsedResult = {
    content: input,
  };
  
  let content = input;
  
  // 解析优先级
  const priorityMatch = content.match(/(🔴|🟡|🟢|!high|!medium|!low|!高 |!中 |!低)/i);
  if (priorityMatch) {
    const priorityStr = priorityMatch[0].toLowerCase();
    if (priorityStr === '🔴' || priorityStr === '!high' || priorityStr === '!高') {
      result.priority = 1;
    } else if (priorityStr === '🟡' || priorityStr === '!medium' || priorityStr === '!中') {
      result.priority = 2;
    } else if (priorityStr === '🟢' || priorityStr === '!low' || priorityStr === '!低') {
      result.priority = 3;
    }
    content = content.replace(priorityMatch[0], '').trim();
  }
  
  // 解析标签 (#开头)
  const tagMatches = content.match(/#[^\s#]+/g);
  if (tagMatches) {
    result.tags = tagMatches.map(tag => tag.slice(1));
    content = content.replace(/#[^\s#]+/g, '').trim();
  }
  
  // 解析分类 (@开头)
  const categoryMatch = content.match(/@[^\s@]+/);
  if (categoryMatch) {
    result.category = categoryMatch[0].slice(1);
    content = content.replace(categoryMatch[0], '').trim();
  }
  
  // 解析日期
  const dateMatch = content.match(/(今天 | 明天 | 后天 | 下周 | 本月 |\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) {
    result.due_date = parseDate(dateMatch[0]);
    content = content.replace(dateMatch[0], '').trim();
  }
  
  // 解析时间
  const timeMatch = content.match(/(\d{1,2}[点时]:\d{2}|\d{1,2}[点时]|上午 \d{1,2}[点时]|下午 \d{1,2}[点时]|\d{2}:\d{2})/i);
  if (timeMatch) {
    result.due_time = parseTime(timeMatch[0]);
    content = content.replace(timeMatch[0], '').trim();
  }
  
  // 解析重复
  const repeatMatch = content.match(/(每天 | 每周 | 每月 | 每年 | 每周一 | 每周二 | 每周三 | 每周四 | 每周五 | 每周六 | 每周日)/i);
  if (repeatMatch) {
    result.repeat = parseRepeat(repeatMatch[0]);
    content = content.replace(repeatMatch[0], '').trim();
  }
  
  // 清理后的内容
  result.content = content.trim();
  
  return result;
}

/**
 * 解析日期
 */
function parseDate(dateStr: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (dateStr.toLowerCase()) {
    case '今天':
      return formatDate(today);
    case '明天':
      return formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
    case '后天':
      return formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000));
    case '下周':
      return formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
    case '本月':
      return formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    default:
      // 尝试解析 YYYY-MM-DD 格式
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      return formatDate(today);
  }
}

/**
 * 解析时间
 */
function parseTime(timeStr: string): string {
  // 处理中文时间表达
  const match = timeStr.match(/(上午 | 下午)?(\d{1,2})[点时]?(:\d{2})?/i);
  if (!match) return timeStr;
  
  const [, period, hourStr, minuteStr] = match;
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr ? parseInt(minuteStr.slice(1), 10) : 0;
  
  // 处理上午/下午
  if (period) {
    if (period.toLowerCase() === '下午' && hour < 12) {
      hour += 12;
    } else if (period.toLowerCase() === '上午' && hour === 12) {
      hour = 0;
    }
  }
  
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * 解析重复规则
 */
function parseRepeat(repeatStr: string): string {
  const repeatMap: Record<string, string> = {
    '每天': 'daily',
    '每周': 'weekly',
    '每月': 'monthly',
    '每年': 'yearly',
    '每周一': 'weekly_monday',
    '每周二': 'weekly_tuesday',
    '每周三': 'weekly_wednesday',
    '每周四': 'weekly_thursday',
    '每周五': 'weekly_friday',
    '每周六': 'weekly_saturday',
    '每周日': 'weekly_sunday',
  };
  
  return repeatMap[repeatStr.toLowerCase()] || repeatStr.toLowerCase();
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取日期建议
 */
export function getDateSuggestions(): string[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const suggestions: string[] = [];
  
  // 今天
  suggestions.push('今天');
  
  // 明天
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  suggestions.push(`明天 (${formatDate(tomorrow)})`);
  
  // 本周末
  const weekend = new Date(today.getTime() + (6 - today.getDay()) * 24 * 60 * 60 * 1000);
  if (weekend.getDay() !== 0 && weekend.getDay() !== 6) {
    suggestions.push(`本周末 (${formatDate(weekend)})`);
  }
  
  // 下周
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  suggestions.push(`下周 (${formatDate(nextWeek)})`);
  
  return suggestions;
}

/**
 * 测试输入是否为自然语言
 */
export function isNaturalLanguage(input: string): boolean {
  const patterns = [
    /(今天 | 明天 | 后天 | 下周 | 本月)/i,
    /(🔴|🟡|🟢|!high|!medium|!low)/i,
    /#[^\s#]+/,
    /@[^\s@]+/,
    /(\d{1,2}[点时]|上午 | 下午)/i,
    /(每天 | 每周 | 每月)/i,
  ];
  
  return patterns.some(pattern => pattern.test(input));
}
