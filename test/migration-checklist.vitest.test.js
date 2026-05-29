import { describe, expect, it } from 'vitest';
import { antiPatterns, checklistSections, pitfallNotes } from '../src/harness/migration-checklist-data.js';
import { caseStudy } from '../src/harness/migration-case-study-data.js';

describe('public HTML -> ESM 迁移资产', () => {
  it('迁移清单应覆盖关键阶段', () => {
    const sectionIds = checklistSections.map((section) => section.id);
    expect(sectionIds).toEqual(['preflight', 'entry', 'styles', 'scripts', 'deps', 'verify']);
  });

  it('常见反模式应覆盖初始化顺序、内联事件和全局状态', () => {
    expect(antiPatterns.some((item) => item.includes('onclick'))).toBe(true);
    expect(antiPatterns.some((item) => item.includes('全局变量'))).toBe(true);
    expect(antiPatterns.some((item) => item.includes('初始化逻辑依赖脚本书写顺序'))).toBe(true);
  });

  it('踩坑说明应覆盖 ImportMaps、重复绑定和相对路径问题', () => {
    const titles = pitfallNotes.map((item) => item.title);
    expect(titles).toContain('ImportMaps 与版本号拼接');
    expect(titles).toContain('重复绑定事件');
    expect(titles).toContain('相对路径漂移');
  });

  it('实战案例应提供至少 6 个逐步拆分步骤', () => {
    expect(caseStudy.steps.length).toBeGreaterThanOrEqual(6);
    expect(caseStudy.targetStructure.length).toBeGreaterThanOrEqual(10);
  });
});
