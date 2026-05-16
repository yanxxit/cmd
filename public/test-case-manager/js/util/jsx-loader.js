// JSX descriptor 加载工具：Babel 编译 + Blob import
export function ensureBabel() {
  if (!window.Babel || typeof window.Babel.transform !== 'function') {
    throw new Error('Babel Standalone 未就绪，无法加载 JSX ESM 模块');
  }
}

export function transformToEsm(code, filename) {
  ensureBabel();

  const result = window.Babel.transform(code, {
    filename,
    presets: ['react'],
    sourceType: 'module',
  });

  return result.code;
}

export async function importBabelModule(modulePath, resolveUrl = (path) => window.getModuleUrl(path)) {
  ensureBabel();

  const requestUrl = resolveUrl(modulePath);
  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`模块加载失败: ${modulePath}`);
  }

  const source = await response.text();
  const compiled = transformToEsm(source, modulePath);
  const blob = new Blob([compiled], { type: 'text/javascript' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    return await import(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
