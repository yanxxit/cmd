/**
 * Service Worker for PWA
 * 支持离线缓存和数据持久化
 */

const CACHE_NAME = 'web-toolbox-v1';
const STATIC_CACHE = 'static-v1';
const DATA_CACHE = 'data-v1';

// 静态资源缓存
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/libs/vue/dist/vue.global.prod.js',
  '/libs/marked/marked.min.js',
];

// 动态缓存配置
const CACHE_STRATEGIES = {
  // 缓存优先
  'cache-first': ['GET'],
  // 网络优先
  'network-first': ['POST', 'PUT', 'DELETE'],
  // 仅缓存
  'cache-only': [],
  // 仅网络
  'network-only': ['API'],
};

// 安装事件
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch(err => {
      console.error('[SW] Cache install error:', err);
    })
  );
  self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE && cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activated');
      return self.clients.claim();
    })
  );
});

// 获取事件
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过外部资源
  if (url.origin !== location.origin) {
    return;
  }

  // API 请求：网络优先，失败时返回缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // 静态资源：缓存优先
  event.respondWith(cacheFirstStrategy(request));
});

// 缓存优先策略
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // 后台更新缓存
    fetch(request).then(response => {
      if (response && response.status === 200) {
        caches.open(STATIC_CACHE).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {
      // 网络失败，使用缓存
    });
    return cachedResponse;
  }

  // 缓存未命中，从网络获取
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const clone = response.clone();
      caches.open(STATIC_CACHE).then(cache => {
        cache.put(request, clone);
      });
    }
    return response;
  } catch (err) {
    console.error('[SW] Fetch error:', err);
    // 返回离线页面
    return caches.match('/index.html');
  }
}

// 网络优先策略
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const clone = response.clone();
      caches.open(DATA_CACHE).then(cache => {
        cache.put(request, clone);
      });
    }
    return response;
  } catch (err) {
    console.log('[SW] Network failed, using cache');
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response(
      JSON.stringify({ success: false, error: 'Offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 消息处理
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const { urls } = event.data;
    caches.open(STATIC_CACHE).then(cache => {
      cache.addAll(urls);
    });
  }
});

// 后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // 获取待同步的数据
  const pendingData = await getPendingSyncData();
  
  // 逐个同步
  for (const item of pendingData) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      // 同步成功后移除
      await removePendingSync(item.id);
    } catch (err) {
      console.error('[SW] Sync failed:', err);
    }
  }
}

async function getPendingSyncData() {
  // 从 IndexedDB 获取
  return [];
}

async function removePendingSync(id) {
  // 从 IndexedDB 移除
}

// 推送通知
self.addEventListener('push', event => {
  const { title, body, icon } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/favicon.ico',
    })
  );
});

// 通知点击
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[SW] Service Worker loaded');
