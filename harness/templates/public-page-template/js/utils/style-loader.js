// Style loader with de-duplication and versioned URLs.
const loaded = new Map();
const getVersion = () => window.G_VER || Date.now();

export function loadCSS(href) {
  if (loaded.has(href)) {
    return loaded.get(href);
  }

  const task = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${href}?v=${getVersion()}`;
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    document.head.appendChild(link);
  });

  loaded.set(href, task);
  return task;
}

export async function loadCSSBatch(hrefs) {
  for (const href of hrefs) {
    await loadCSS(href);
  }
}
