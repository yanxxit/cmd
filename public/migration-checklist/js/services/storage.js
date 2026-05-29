// Persist checklist state in localStorage.
const STORAGE_KEY = 'migration-checklist-progress-v1';

export function loadChecklistProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { checkedMap: {}, note: '', lastUpdatedAt: '' };
    }
    const parsed = JSON.parse(raw);
    return {
      checkedMap: parsed.checkedMap || {},
      note: parsed.note || '',
      lastUpdatedAt: parsed.lastUpdatedAt || ''
    };
  } catch (error) {
    return { checkedMap: {}, note: '', lastUpdatedAt: '' };
  }
}

export function saveChecklistProgress(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetChecklistProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildSummaryText(sections, state) {
  const lines = ['HTML -> ESM 迁移进度摘要'];
  sections.forEach((section) => {
    const total = section.items.length;
    const done = section.items.filter((_, index) => state.checkedMap[`${section.id}:${index}`]).length;
    lines.push(`- ${section.title}: ${done}/${total}`);
  });
  if (state.note) {
    lines.push('', '备注:');
    lines.push(state.note);
  }
  return lines.join('\n');
}
