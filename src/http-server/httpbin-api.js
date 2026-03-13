/**
 * HTTP 请求测试平台 API Router
 * 参考：https://httpbin.org/
 * 提供 HTTP 请求测试接口
 */

import express from 'express';

const router = express.Router();

/**
 * 获取请求信息的辅助函数
 */
function getRequestInfo(req) {
  return {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    headers: req.headers,
    query: req.query,
    params: req.params,
    body: req.body,
    cookies: req.cookies,
    files: req.files,
    form: req.body, // 表单数据
    json: typeof req.body === 'object' ? req.body : null,
    data: req.body, // 原始数据
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
    origin: req.get('Origin'),
    host: req.get('Host'),
    protocol: req.protocol,
    secure: req.secure,
    xhr: req.xhr
  };
}

/**
 * GET /api/httpbin/get
 * 返回 GET 请求信息
 */
router.get('/get', (req, res) => {
  res.json({
    args: req.query,
    headers: getRequestInfo(req).headers,
    origin: getRequestInfo(req).origin,
    url: `https://${req.get('Host')}${req.originalUrl}`
  });
});

/**
 * POST /api/httpbin/post
 * 返回 POST 请求信息
 */
router.post('/post', (req, res) => {
  res.json({
    args: req.query,
    data: req.body,
    files: {},
    form: req.body,
    headers: getRequestInfo(req).headers,
    json: typeof req.body === 'object' ? req.body : null,
    origin: getRequestInfo(req).origin,
    url: `https://${req.get('Host')}${req.originalUrl}`
  });
});

/**
 * PUT /api/httpbin/put
 * 返回 PUT 请求信息
 */
router.put('/put', (req, res) => {
  res.json({
    args: req.query,
    data: req.body,
    files: {},
    form: req.body,
    headers: getRequestInfo(req).headers,
    json: typeof req.body === 'object' ? req.body : null,
    origin: getRequestInfo(req).origin,
    url: `https://${req.get('Host')}${req.originalUrl}`
  });
});

/**
 * DELETE /api/httpbin/delete
 * 返回 DELETE 请求信息
 */
router.delete('/delete', (req, res) => {
  res.json({
    args: req.query,
    data: req.body,
    files: {},
    form: req.body,
    headers: getRequestInfo(req).headers,
    json: typeof req.body === 'object' ? req.body : null,
    origin: getRequestInfo(req).origin,
    url: `https://${req.get('Host')}${req.originalUrl}`
  });
});

/**
 * PATCH /api/httpbin/patch
 * 返回 PATCH 请求信息
 */
router.patch('/patch', (req, res) => {
  res.json({
    args: req.query,
    data: req.body,
    files: {},
    form: req.body,
    headers: getRequestInfo(req).headers,
    json: typeof req.body === 'object' ? req.body : null,
    origin: getRequestInfo(req).origin,
    url: `https://${req.get('Host')}${req.originalUrl}`
  });
});

/**
 * GET /api/httpbin/headers
 * 返回请求头信息
 */
router.get('/headers', (req, res) => {
  res.json({
    headers: req.headers
  });
});

/**
 * GET /api/httpbin/ip
 * 返回客户端 IP 地址
 */
router.get('/ip', (req, res) => {
  res.json({
    origin: req.ip || req.connection.remoteAddress
  });
});

/**
 * GET /api/httpbin/user-agent
 * 返回 User-Agent
 */
router.get('/user-agent', (req, res) => {
  res.json({
    'user-agent': req.get('User-Agent')
  });
});

/**
 * GET /api/httpbin/status/:code
 * 返回指定状态码
 */
router.get('/status/:code', (req, res) => {
  const code = parseInt(req.params.code);
  res.status(code).send(`HTTP Status ${code}`);
});

/**
 * GET /api/httpbin/delay/:seconds
 * 延迟指定秒数后响应
 */
router.get('/delay/:seconds', (req, res) => {
  const seconds = parseInt(req.params.seconds) || 1;
  setTimeout(() => {
    res.json({
      delayed: true,
      seconds,
      timestamp: new Date().toISOString()
    });
  }, seconds * 1000);
});

/**
 * GET /api/httpbin/bytes/:size
 * 返回指定大小的随机字节
 */
router.get('/bytes/:size', (req, res) => {
  const size = parseInt(req.params.size) || 1024;
  const buffer = Buffer.alloc(size);
  for (let i = 0; i < size; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  res.set('Content-Type', 'application/octet-stream');
  res.send(buffer);
});

/**
 * GET /api/httpbin/html
 * 返回示例 HTML 页面
 */
router.get('/html', (req, res) => {
  res.type('html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>HTTPBin HTML Test</title></head>
    <body>
      <h1>HTTPBin HTML Test Page</h1>
      <p>This is a sample HTML page for testing HTTP clients.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    </body>
    </html>
  `);
});

/**
 * GET /api/httpbin/json
 * 返回示例 JSON
 */
router.get('/json', (req, res) => {
  res.json({
    slideshow: {
      author: 'Yours Truly',
      date: 'date of publication',
      slides: [
        { title: 'Wake up to WonderWidgets!', type: 'all' },
        {
          items: [
            'Why <em>WonderWidgets</em> are great',
            'Who <em>buys</em> WonderWidgets'
          ],
          title: 'Overview',
          type: 'all'
        }
      ],
      title: 'Sample Slide Show'
    }
  });
});

/**
 * GET /api/httpbin/xml
 * 返回示例 XML
 */
router.get('/xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version='1.0' encoding='us-ascii'?>
<slideshow>
  <title>Sample Slide Show</title>
  <author>Yours Truly</author>
  <date>date of publication</date>
  <slide type="all">
    <title>Wake up to WonderWidgets!</title>
  </slide>
  <slide type="all">
    <title>Overview</title>
    <item>Why <em>WonderWidgets</em> are great</item>
    <item>Who <em>buys</em> WonderWidgets</item>
  </slide>
</slideshow>`);
});

/**
 * GET /api/httpbin/cookies
 * 返回 cookies
 */
router.get('/cookies', (req, res) => {
  res.json({
    cookies: req.cookies
  });
});

/**
 * GET /api/httpbin/cookies/set
 * 设置 cookies
 */
router.get('/cookies/set', (req, res) => {
  Object.keys(req.query).forEach(key => {
    res.cookie(key, req.query[key]);
  });
  res.json({
    cookies: { ...req.cookies, ...req.query },
    message: 'Cookies set successfully'
  });
});

/**
 * GET /api/httpbin/cookies/delete
 * 删除 cookies
 */
router.get('/cookies/delete', (req, res) => {
  const cookies = Array.isArray(req.query.keys) ? req.query.keys : [req.query.keys];
  cookies.forEach(key => {
    if (key) res.clearCookie(key);
  });
  res.json({
    message: 'Cookies deleted successfully',
    deleted: cookies
  });
});

/**
 * GET /api/httpbin/redirect/:times
 * 重定向指定次数
 */
router.get('/redirect/:times', (req, res) => {
  const times = parseInt(req.params.times) || 1;
  if (times > 1) {
    res.redirect(`/api/httpbin/redirect/${times - 1}`);
  } else {
    res.json({
      message: 'Redirect complete',
      times: parseInt(req.params.times)
    });
  }
});

/**
 * GET /api/httpbin/absolute-redirect/:times
 * 绝对路径重定向
 */
router.get('/absolute-redirect/:times', (req, res) => {
  const times = parseInt(req.params.times) || 1;
  if (times > 1) {
    res.redirect(302, `/api/httpbin/absolute-redirect/${times - 1}`);
  } else {
    res.json({
      message: 'Absolute redirect complete',
      times: parseInt(req.params.times)
    });
  }
});

/**
 * GET /api/httpbin/stream/:lines
 * 流式响应
 */
router.get('/stream/:lines', (req, res) => {
  const lines = parseInt(req.params.lines) || 10;
  res.set('Content-Type', 'application/x-ndjson');
  
  let count = 0;
  const interval = setInterval(() => {
    count++;
    res.write(JSON.stringify({ line: count, timestamp: new Date().toISOString() }) + '\n');
    if (count >= lines) {
      clearInterval(interval);
      res.end();
    }
  }, 100);
});

/**
 * GET /api/httpbin/drip
 * 滴漏式响应
 */
router.get('/drip', (req, res) => {
  const duration = parseFloat(req.query.duration) || 2;
  const delay = parseFloat(req.query.delay) || 0;
  const numbytes = parseInt(req.query.numbytes) || 10;
  
  setTimeout(() => {
    let sent = 0;
    const interval = setInterval(() => {
      if (sent >= numbytes) {
        clearInterval(interval);
        res.end();
        return;
      }
      res.write('*');
      sent++;
    }, (duration * 1000) / numbytes);
  }, delay * 1000);
});

/**
 * GET /api/httpbin/range/:numbytes
 * 支持 Range 头的响应
 */
router.get('/range/:numbytes', (req, res) => {
  const numBytes = parseInt(req.params.numbytes) || 100;
  const data = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(Math.ceil(numBytes / 26)).slice(0, numBytes);
  
  const range = req.get('Range');
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : numBytes - 1;
    const chunk = data.slice(start, end + 1);
    
    res.set('Content-Range', `bytes ${start}-${end}/${numBytes}`);
    res.set('Accept-Ranges', 'bytes');
    res.status(206).send(chunk);
  } else {
    res.set('Accept-Ranges', 'bytes');
    res.send(data);
  }
});

/**
 * GET /api/httpbin/cache
 * 测试缓存
 */
router.get('/cache', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.json({
    cached: true,
    timestamp: new Date().toISOString(),
    message: 'This response is cacheable for 24 hours'
  });
});

/**
 * GET /api/httpbin/cache/:numhours
 * 测试缓存（指定小时数）
 */
router.get('/cache/:numhours', (req, res) => {
  const hours = parseInt(req.params.numhours) || 1;
  res.set('Cache-Control', `public, max-age=${hours * 3600}`);
  res.json({
    cached: true,
    maxAge: hours * 3600,
    timestamp: new Date().toISOString(),
    message: `This response is cacheable for ${hours} hours`
  });
});

/**
 * GET /api/httpbin/etag/:etag
 * 测试 ETag
 */
router.get('/etag/:etag', (req, res) => {
  const etag = req.params.etag;
  const ifNoneMatch = req.get('If-None-Match');
  
  if (ifNoneMatch === etag) {
    res.status(304).send('Not Modified');
  } else {
    res.set('ETag', etag);
    res.json({
      etag,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/httpbin/gzip
 * 返回 Gzip 压缩响应
 */
router.get('/gzip', (req, res) => {
  res.set('Content-Encoding', 'gzip');
  res.json({
    gzipped: true,
    headers: req.headers,
    method: req.method,
    origin: req.ip,
    url: req.originalUrl
  });
});

/**
 * GET /api/httpbin/deflate
 * 返回 Deflate 压缩响应
 */
router.get('/deflate', (req, res) => {
  res.set('Content-Encoding', 'deflate');
  res.json({
    deflated: true,
    headers: req.headers,
    method: req.method,
    origin: req.ip,
    url: req.originalUrl
  });
});

/**
 * GET /api/httpbin/response-headers
 * 自定义响应头
 */
router.get('/response-headers', (req, res) => {
  Object.keys(req.query).forEach(key => {
    res.set(key, req.query[key]);
  });
  res.json({
    headers: req.query,
    message: 'Response headers set successfully'
  });
});

/**
 * GET /api/httpbin/base64/:value
 * Base64 编码/解码
 */
router.get('/base64/:value', (req, res) => {
  try {
    const decoded = Buffer.from(req.params.value, 'base64').toString('utf-8');
    res.json({
      encoded: req.params.value,
      decoded
    });
  } catch (err) {
    res.status(400).json({ error: 'Invalid base64 encoding' });
  }
});

/**
 * GET /api/httpbin/encoding/utf8
 * UTF-8 编码测试
 */
router.get('/encoding/utf8', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>UTF-8 Test</title></head>
    <body>
      <h1>UTF-8 编码测试</h1>
      <p>中文：你好，世界！</p>
      <p>日文：こんにちは世界！</p>
      <p>韩文：안녕하세요 세계!</p>
      <p>Emoji: 🌍 🌎 🌏 🚀 ✨</p>
    </body>
    </html>
  `);
});

/**
 * GET /api/httpbin/anything
 * 返回任何请求的信息
 */
router.all('/anything', (req, res) => {
  res.json(getRequestInfo(req));
});

/**
 * GET /api/httpbin/anything/*
 * 通配符路径
 */
router.all('/anything/*', (req, res) => {
  res.json(getRequestInfo(req));
});

/**
 * 测试平台信息
 */
router.get('/', (req, res) => {
  res.json({
    name: 'HTTPBin Test Platform',
    description: 'HTTP 请求测试平台 - 参考 httpbin.org',
    version: '1.0.0',
    endpoints: {
      'GET /api/httpbin/get': '返回 GET 请求信息',
      'POST /api/httpbin/post': '返回 POST 请求信息',
      'PUT /api/httpbin/put': '返回 PUT 请求信息',
      'DELETE /api/httpbin/delete': '返回 DELETE 请求信息',
      'PATCH /api/httpbin/patch': '返回 PATCH 请求信息',
      'GET /api/httpbin/headers': '返回请求头信息',
      'GET /api/httpbin/ip': '返回客户端 IP',
      'GET /api/httpbin/user-agent': '返回 User-Agent',
      'GET /api/httpbin/status/:code': '返回指定状态码',
      'GET /api/httpbin/delay/:seconds': '延迟响应',
      'GET /api/httpbin/bytes/:size': '返回随机字节',
      'GET /api/httpbin/html': '返回示例 HTML',
      'GET /api/httpbin/json': '返回示例 JSON',
      'GET /api/httpbin/xml': '返回示例 XML',
      'GET /api/httpbin/cookies': '返回 Cookies',
      'GET /api/httpbin/cookies/set': '设置 Cookies',
      'GET /api/httpbin/cookies/delete': '删除 Cookies',
      'GET /api/httpbin/redirect/:times': '重定向测试',
      'GET /api/httpbin/stream/:lines': '流式响应',
      'GET /api/httpbin/drip': '滴漏式响应',
      'GET /api/httpbin/range/:numbytes': 'Range 头测试',
      'GET /api/httpbin/cache': '缓存测试',
      'GET /api/httpbin/etag/:etag': 'ETag 测试',
      'GET /api/httpbin/gzip': 'Gzip 压缩测试',
      'GET /api/httpbin/deflate': 'Deflate 压缩测试',
      'GET /api/httpbin/response-headers': '自定义响应头',
      'GET /api/httpbin/base64/:value': 'Base64 编解码',
      'GET /api/httpbin/encoding/utf8': 'UTF-8 编码测试',
      'GET|POST|PUT|DELETE|PATCH /api/httpbin/anything': '返回任何请求信息'
    },
    webUI: '/httpbin/'
  });
});

export default router;
