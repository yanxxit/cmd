/**
 * 自然语言解析工具测试
 */

import { parseNaturalLanguage, isNaturalLanguage, getDateSuggestions } from '../natural-language';

describe('parseNaturalLanguage', () => {
  it('应该正确解析优先级', () => {
    expect(parseNaturalLanguage('任务 🔴').priority).toBe(1);
    expect(parseNaturalLanguage('任务 🟡').priority).toBe(2);
    expect(parseNaturalLanguage('任务 🟢').priority).toBe(3);
    expect(parseNaturalLanguage('任务 !high').priority).toBe(1);
  });

  it('应该正确解析标签', () => {
    const result = parseNaturalLanguage('任务 #工作 #紧急');
    expect(result.tags).toEqual(['工作', '紧急']);
  });

  it('应该正确解析分类', () => {
    const result = parseNaturalLanguage('任务 @会议室');
    expect(result.category).toBe('会议室');
  });

  it('应该正确解析日期', () => {
    const result = parseNaturalLanguage('任务 明天');
    expect(result.due_date).toBeDefined();
  });

  it('应该正确解析时间', () => {
    const result = parseNaturalLanguage('任务 下午 3 点');
    expect(result.due_time).toBe('15:00');
  });

  it('应该正确解析完整输入', () => {
    const result = parseNaturalLanguage('明天下午 3 点开会 #工作 @会议室 🔴');
    expect(result.content).toBe('开会');
    expect(result.priority).toBe(1);
    expect(result.category).toBe('会议室');
    expect(result.tags).toEqual(['工作']);
    expect(result.due_date).toBeDefined();
    expect(result.due_time).toBe('15:00');
  });
});

describe('isNaturalLanguage', () => {
  it('应该识别自然语言', () => {
    expect(isNaturalLanguage('明天开会')).toBe(true);
    expect(isNaturalLanguage('任务 🔴')).toBe(true);
    expect(isNaturalLanguage('#工作')).toBe(true);
    expect(isNaturalLanguage('@会议')).toBe(true);
  });

  it('应该识别普通文本', () => {
    expect(isNaturalLanguage('普通任务内容')).toBe(false);
  });
});

describe('getDateSuggestions', () => {
  it('应该返回日期建议', () => {
    const suggestions = getDateSuggestions();
    expect(suggestions).toContain('今天');
    expect(suggestions).toContain('明天');
  });
});
