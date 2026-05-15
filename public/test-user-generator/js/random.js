// 通用随机工具：所有生成器共用，避免内联 Math.random 漫天散
export const randInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const pick = (arr) => arr[randInt(0, arr.length - 1)];

export const pickN = (arr, n) => {
  const copy = arr.slice();
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = randInt(0, copy.length - 1);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

export const pad = (n, len = 2) => String(n).padStart(len, '0');

/** 计算给定年月的最大天数 */
export const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

/** 生成短随机 ID（6 位字母数字），可用于关联用户记录 */
export const genShortId = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();
