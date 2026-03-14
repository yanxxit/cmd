import http from 'http';
import https from 'https';
import net from 'net';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { createCertificate } from './cert-generator.js';

const LOG_DIR = path.join(process.cwd(), '.http-sniffer');
const CERT_DIR = path.join(LOG_DIR, 'certs');

const stats = {
  total: 0,
  methods: {},
  statusCodes: {},
  domains: {},
  totalTime: 0,
  totalSize: 0,
  slowRequests: [],
  failedRequests: [],
  startTime: Date.now()
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

function colorize(text, color) {
  return colors[color] + text + colors.reset;
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
  }
}

function formatTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusColor(statusCode) {
  if (!statusCode) return 'white';
  if (statusCode >= 200 && statusCode < 300) return 'green';
  if (statusCode >= 300 && statusCode < 400) return 'yellow';
  if (statusCode >= 400 && statusCode < 500) return 'red';
  return 'red';
}

function getMethodColor(method) {
  const colorMap = {
    GET: 'blue',
    POST: 'green',
    PUT: 'yellow',
    DELETE: 'red',
    PATCH: 'magenta',
    OPTIONS: 'cyan',
    HEAD: 'white',
    CONNECT: 'cyan'
  };
  return colorMap[method] || 'white';
}

function padRight(str, len) {
  str = String(str);
  while (str.length < len) str += ' ';
  return str;
}

function padLeft(str, len) {
  str = String(str);
  while (str.length < len) str = ' ' + str;
  return str;
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

let requestId = 0;
const activeRequests = new Map();
const allRequests = [];
const certCache = new Map();
let programOptions = {};

function setProgramOptions(options) {
  programOptions = options;
}

function shouldFilterRequest(info) {
  if (programOptions.method && info.method !== programOptions.method.toUpperCase()) {
    return true;
  }
  
  if (programOptions.domain && !info.host.includes(programOptions.domain)) {
    return true;
  }
  
  if (programOptions.exclude && info.host.includes(programOptions.exclude)) {
    return true;
  }
  
  if (programOptions.minTime && info.responseTime && info.responseTime < parseInt(programOptions.minTime)) {
    return true;
  }
  
  if (programOptions.maxTime && info.responseTime && info.responseTime > parseInt(programOptions.maxTime)) {
    return true;
  }
  
  if (programOptions.status && info.statusCode && String(info.statusCode) !== programOptions.status) {
    return true;
  }
  
  if (programOptions.statusRange) {
    const [min, max] = programOptions.statusRange.split('-').map(Number);
    if (info.statusCode && (info.statusCode < min || info.statusCode > max)) {
      return true;
    }
  }
  
  if (programOptions.search) {
    const searchTerm = programOptions.search.toLowerCase();
    const searchFields = [
      info.host,
      info.path,
      info.url,
      info.method,
      String(info.statusCode || '')
    ].join(' ').toLowerCase();
    if (!searchFields.includes(searchTerm)) {
      return true;
    }
  }
  
  return false;
}

function updateStats(info) {
  stats.total++;
  stats.methods[info.method] = (stats.methods[info.method] || 0) + 1;
  stats.domains[info.host] = (stats.domains[info.host] || 0) + 1;
  
  if (info.statusCode) {
    const statusGroup = Math.floor(info.statusCode / 100) + 'xx';
    stats.statusCodes[statusGroup] = (stats.statusCodes[statusGroup] || 0) + 1;
    stats.statusCodes[info.statusCode] = (stats.statusCodes[info.statusCode] || 0) + 1;
    
    if (info.statusCode >= 400) {
      stats.failedRequests.push(info);
    }
  }
  
  if (info.responseTime) {
    stats.totalTime += info.responseTime;
    
    if (info.responseTime > 1000) {
      stats.slowRequests.push(info);
    }
  }
  
  if (info.responseSize) {
    stats.totalSize += info.responseSize;
  }
}

function printRequestDetails(info) {
  console.log(colorize('\n' + '═'.repeat(80), 'dim'));
  console.log(colorize('📋 请求详情', 'cyan'));
  console.log(colorize('═'.repeat(80), 'dim'));
  
  console.log(`${colorize('ID:', 'dim')} ${info.id}`);
  console.log(`${colorize('时间:', 'dim')} ${info.timestamp}`);
  console.log(`${colorize('方法:', 'dim')} ${colorize(info.method, getMethodColor(info.method))}`);
  console.log(`${colorize('URL:', 'dim')} ${colorize(info.url, 'white')}`);
  
  if (info.statusCode) {
    console.log(`${colorize('状态码:', 'dim')} ${colorize(info.statusCode, getStatusColor(info.statusCode))}`);
  }
  
  if (info.responseTime) {
    console.log(`${colorize('响应时间:', 'dim')} ${colorize(info.responseTime + 'ms', 'magenta')}`);
  }
  
  if (info.responseSize) {
    console.log(`${colorize('响应大小:', 'dim')} ${colorize(formatSize(info.responseSize), 'yellow')}`);
  }
  
  if (info.headers && Object.keys(info.headers).length > 0) {
    console.log(colorize('\n📤 请求头:', 'dim'));
    for (const [key, value] of Object.entries(info.headers)) {
      console.log(`  ${colorize(key + ':', 'cyan')} ${value}`);
    }
  }
  
  if (info.requestBody) {
    console.log(colorize('\n📝 请求体:', 'dim'));
    try {
      const parsed = JSON.parse(info.requestBody);
      console.log(`  ${JSON.stringify(parsed, null, 2).split('\n').join('\n  ')}`);
    } catch {
      console.log(`  ${truncate(info.requestBody, 500)}`);
    }
  }
  
  if (info.responseHeaders && Object.keys(info.responseHeaders).length > 0) {
    console.log(colorize('\n📥 响应头:', 'dim'));
    for (const [key, value] of Object.entries(info.responseHeaders)) {
      console.log(`  ${colorize(key + ':', 'green')} ${value}`);
    }
  }
  
  if (info.responseBody) {
    console.log(colorize('\n📄 响应体:', 'dim'));
    try {
      const parsed = JSON.parse(info.responseBody);
      console.log(`  ${JSON.stringify(parsed, null, 2).split('\n').join('\n  ')}`);
    } catch {
      console.log(`  ${truncate(info.responseBody, 500)}`);
    }
  }
  
  if (info.error) {
    console.log(colorize('\n❌ 错误:', 'red'));
    console.log(`  ${info.error}`);
  }
  
  console.log(colorize('═'.repeat(80) + '\n', 'dim'));
}

function logRequest(info) {
  if (shouldFilterRequest(info)) {
    return;
  }
  
  updateStats(info);
  
  if (programOptions.verbose) {
    printRequestDetails(info);
    return;
  }
  
  if (programOptions.format === 'json') {
    console.log(JSON.stringify(info));
    return;
  }
  
  const timestamp = colorize(`[${formatTimestamp(info.timestamp)}]`, 'dim');
  const method = colorize(padRight(info.method, 7), getMethodColor(info.method));
  
  let displayUrl = info.host + (info.path || '');
  if (programOptions.search) {
    const searchTerm = programOptions.search.toLowerCase();
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    displayUrl = displayUrl.replace(regex, (match) => colorize(match, 'bgYellow'));
  } else {
    displayUrl = colorize(truncate(displayUrl, 55), 'white');
  }
  
  let statusCode = '-';
  if (info.statusCode) {
    statusCode = colorize(padLeft(info.statusCode, 3), getStatusColor(info.statusCode));
  }
  
  let responseTime = '-';
  if (info.responseTime) {
    let timeColor = 'magenta';
    if (info.responseTime > 1000) timeColor = 'red';
    else if (info.responseTime > 500) timeColor = 'yellow';
    responseTime = colorize(padLeft(info.responseTime + 'ms', 7), timeColor);
  }
  
  let responseSize = '-';
  if (info.responseSize) {
    responseSize = colorize(padLeft(formatSize(info.responseSize), 10), 'yellow');
  }
  
  let indicator = ' ';
  if (info.responseTime && info.responseTime > 1000) {
    indicator = colorize('🐌', 'yellow');
  }
  if (info.statusCode && info.statusCode >= 400) {
    indicator = colorize('❌', 'red');
  }
  
  let protocolTag = info.isHttps ? colorize('🔒', 'green') : '';
  
  console.log(`${protocolTag} ${indicator} ${timestamp} ${method} ${displayUrl} ${statusCode} ${responseTime} ${responseSize}`);
  
  if (programOptions.save) {
    saveToFile(info);
  }
  
  if (programOptions.har) {
    allRequests.push(info);
  }
}

function saveToFile(info) {
  ensureLogDir();
  const filename = path.join(LOG_DIR, `${Date.now()}-${info.id}.json`);
  fs.writeFileSync(filename, JSON.stringify(info, null, 2));
}

function exportToHAR() {
  const har = {
    log: {
      version: '1.2',
      creator: {
        name: 'HTTP Sniffer',
        version: '3.0.0'
      },
      entries: allRequests.map(req => ({
        startedDateTime: req.timestamp,
        time: req.responseTime || 0,
        request: {
          method: req.method,
          url: req.url,
          headers: Object.entries(req.headers || {}).map(([name, value]) => ({ name, value }))
        },
        response: {
          status: req.statusCode || 0,
          statusText: '',
          headers: Object.entries(req.responseHeaders || {}).map(([name, value]) => ({ name, value })),
          content: {
            size: req.responseSize || 0,
            text: req.responseBody || ''
          }
        }
      }))
    }
  };
  
  ensureLogDir();
  const filename = path.join(LOG_DIR, `requests-${Date.now()}.har`);
  fs.writeFileSync(filename, JSON.stringify(har, null, 2));
  console.log(colorize(`\n📦 HAR 文件已导出: ${filename}`, 'green'));
}

function printStats() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const avgTime = stats.total > 0 ? (stats.totalTime / stats.total).toFixed(2) : 0;
  
  console.log(colorize('\n' + '═'.repeat(80), 'dim'));
  console.log(colorize('📊 统计信息', 'cyan'));
  console.log(colorize('═'.repeat(80), 'dim'));
  console.log(`${colorize('运行时间:', 'dim')} ${colorize(elapsed.toFixed(1) + 's', 'white')}`);
  console.log(`${colorize('总请求数:', 'dim')} ${colorize(stats.total, 'white')}`);
  console.log(`${colorize('平均耗时:', 'dim')} ${colorize(avgTime + 'ms', 'white')}`);
  console.log(`${colorize('总流量:', 'dim')} ${colorize(formatSize(stats.totalSize), 'white')}`);
  
  if (stats.slowRequests.length > 0) {
    console.log(colorize('\n🐌 慢请求 (>1s):', 'yellow'));
    const topSlow = stats.slowRequests
      .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0))
      .slice(0, 5);
    for (const req of topSlow) {
      console.log(`  ${colorize((req.responseTime || 0) + 'ms', 'yellow')} - ${req.host}${req.path}`);
    }
  }
  
  if (stats.failedRequests.length > 0) {
    console.log(colorize('\n❌ 失败请求 (4xx/5xx):', 'red'));
    const topFailed = stats.failedRequests.slice(0, 5);
    for (const req of topFailed) {
      console.log(`  ${colorize(req.statusCode, 'red')} - ${req.host}${req.path}`);
    }
  }
  
  if (Object.keys(stats.methods).length > 0) {
    console.log(colorize('\n📋 请求方法:', 'dim'));
    for (const [method, count] of Object.entries(stats.methods)) {
      console.log(`  ${colorize(method, getMethodColor(method))}: ${count}`);
    }
  }
  
  if (Object.keys(stats.statusCodes).filter(k => k.includes('xx')).length > 0) {
    console.log(colorize('\n📊 状态码:', 'dim'));
    for (const [code, count] of Object.entries(stats.statusCodes)) {
      if (code.includes('xx')) {
        console.log(`  ${colorize(code, getStatusColor(parseInt(code)))}: ${count}`);
      }
    }
  }
  
  const topDomains = Object.entries(stats.domains)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (topDomains.length > 0) {
    console.log(colorize('\n🌐 热门域名:', 'dim'));
    for (const [domain, count] of topDomains) {
      console.log(`  ${colorize(domain, 'white')}: ${count}`);
    }
  }
  
  console.log(colorize('═'.repeat(80) + '\n', 'dim'));
}

function handleHttpRequest(clientReq, clientRes, isHttps = false) {
  const id = ++requestId;
  const reqUrl = url.parse(clientReq.url);
  
  const requestInfo = {
    id,
    method: clientReq.method,
    host: reqUrl.host || clientReq.headers.host,
    path: reqUrl.path,
    url: isHttps ? `https://${clientReq.headers.host}${reqUrl.path}` : clientReq.url,
    headers: clientReq.headers,
    timestamp: new Date().toISOString(),
    startTime: Date.now(),
    requestBody: [],
    isHttps
  };
  
  activeRequests.set(id, requestInfo);
  
  clientReq.on('data', (chunk) => {
    requestInfo.requestBody.push(chunk);
  });
  
  const protocol = isHttps ? https : http;
  const port = isHttps ? 443 : (reqUrl.port || 80);
  
  const options = {
    hostname: requestInfo.host.split(':')[0],
    port: port,
    path: reqUrl.path,
    method: clientReq.method,
    headers: clientReq.headers
  };
  
  const proxyReq = protocol.request(options, (proxyRes) => {
    requestInfo.statusCode = proxyRes.statusCode;
    requestInfo.responseHeaders = proxyRes.headers;
    requestInfo.responseBody = [];
    
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    
    proxyRes.on('data', (chunk) => {
      requestInfo.responseBody.push(chunk);
      clientRes.write(chunk);
    });
    
    proxyRes.on('end', () => {
      requestInfo.responseTime = Date.now() - requestInfo.startTime;
      requestInfo.responseSize = Buffer.concat(requestInfo.responseBody).length;
      requestInfo.requestBody = Buffer.concat(requestInfo.requestBody).toString('utf8');
      requestInfo.responseBody = Buffer.concat(requestInfo.responseBody).toString('utf8');
      
      logRequest(requestInfo);
      activeRequests.delete(id);
      clientRes.end();
    });
  });
  
  proxyReq.on('error', (err) => {
    requestInfo.error = err.message;
    requestInfo.responseTime = Date.now() - requestInfo.startTime;
    logRequest(requestInfo);
    activeRequests.delete(id);
    clientRes.writeHead(502);
    clientRes.end('Proxy Error: ' + err.message);
  });
  
  clientReq.on('data', (chunk) => {
    proxyReq.write(chunk);
  });
  
  clientReq.on('end', () => {
    proxyReq.end();
  });
}

async function getCertificate(hostname) {
  if (certCache.has(hostname)) {
    return certCache.get(hostname);
  }
  
  const certPath = path.join(CERT_DIR, `${hostname}.pem`);
  const keyPath = path.join(CERT_DIR, `${hostname}-key.pem`);
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const cert = fs.readFileSync(certPath, 'utf8');
    const key = fs.readFileSync(keyPath, 'utf8');
    certCache.set(hostname, { cert, key });
    return { cert, key };
  }
  
  const { cert, key } = await createCertificate(hostname);
  fs.writeFileSync(certPath, cert);
  fs.writeFileSync(keyPath, key);
  certCache.set(hostname, { cert, key });
  
  return { cert, key };
}

async function handleHttpsConnect(clientReq, clientSocket, head) {
  const reqUrl = url.parse('https://' + clientReq.url);
  const hostname = reqUrl.hostname;
  const port = reqUrl.port || 443;
  
  if (!programOptions.mitm) {
    const id = ++requestId;
    const requestInfo = {
      id,
      method: 'CONNECT',
      host: reqUrl.host,
      path: '',
      url: 'https://' + clientReq.url,
      timestamp: new Date().toISOString(),
      startTime: Date.now(),
      isHttps: true
    };
    
    activeRequests.set(id, requestInfo);
    logRequest(requestInfo);
    
    const proxySocket = net.connect(port, hostname, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      proxySocket.write(head);
      proxySocket.pipe(clientSocket);
      clientSocket.pipe(proxySocket);
    });
    
    proxySocket.on('error', (err) => {
      requestInfo.error = err.message;
      requestInfo.responseTime = Date.now() - requestInfo.startTime;
      logRequest(requestInfo);
      activeRequests.delete(id);
      clientSocket.end();
    });
    
    clientSocket.on('error', () => {
      proxySocket.end();
    });
    
    proxySocket.on('close', () => {
      requestInfo.responseTime = Date.now() - requestInfo.startTime;
      activeRequests.delete(id);
    });
    return;
  }
  
  try {
    const { cert, key } = await getCertificate(hostname);
    
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    
    const httpsServer = https.createServer({ cert, key }, (req, res) => {
      handleHttpRequest(req, res, true);
    });
    
    httpsServer.emit('connection', clientSocket);
  } catch (error) {
    console.error(colorize('证书生成失败:', 'red'), error.message);
    clientSocket.end();
  }
}

function printCertInstructions() {
  console.log(colorize('\n' + '═'.repeat(80), 'dim'));
  console.log(colorize('🔐 HTTPS MITM 证书安装说明', 'cyan'));
  console.log(colorize('═'.repeat(80), 'dim'));
  console.log();
  console.log('要使用 HTTPS MITM 功能监听浏览器的 Ajax/fetch 请求，');
  console.log('需要安装并信任根证书。请按以下步骤操作：');
  console.log();
  console.log(colorize('📁 证书位置:', 'yellow'));
  console.log(`  ${path.join(CERT_DIR, 'root-ca.pem')}`);
  console.log();
  console.log(colorize('🍎 macOS:', 'cyan'));
  console.log('  1. 双击 root-ca.pem 文件');
  console.log('  2. 在钥匙串访问中，右键点击证书，选择"显示简介"');
  console.log('  3. 展开"信任"，将"使用此证书时"设为"始终信任"');
  console.log();
  console.log(colorize('🪟 Windows:', 'cyan'));
  console.log('  1. 双击 root-ca.pem 文件');
  console.log('  2. 选择"本地计算机"，点击"下一步"');
  console.log('  3. 选择"将所有的证书放入下列存储"，点击"浏览"');
  console.log('  4. 选择"受信任的根证书颁发机构"，点击"确定"');
  console.log('  5. 点击"下一步"，然后"完成"');
  console.log();
  console.log(colorize('🐧 Linux (Chrome/Firefox):', 'cyan'));
  console.log('  Chrome: 设置 → 隐私和安全 → 安全 → 管理证书 → 授权中心 → 导入');
  console.log('  Firefox: 设置 → 隐私与安全 → 证书 → 查看证书 → 证书颁发机构 → 导入');
  console.log();
  console.log(colorize('⚠️  安全警告:', 'red'));
  console.log('  此证书仅用于开发测试，请勿在生产环境使用！');
  console.log('  使用完毕后请从系统中删除此证书。');
  console.log(colorize('═'.repeat(80) + '\n', 'dim'));
}

export default function startHttpSniffer(options) {
  setProgramOptions(options);
  ensureLogDir();
  
  const PORT = parseInt(options.port);
  
  const proxyServer = http.createServer();
  
  proxyServer.on('request', (req, res) => {
    handleHttpRequest(req, res, false);
  });
  
  proxyServer.on('connect', handleHttpsConnect);
  
  proxyServer.listen(PORT, () => {
    console.log(colorize('\n🚀 HTTP Sniffer v3.0.0 已启动\n', 'bright'));
    console.log(colorize('代理服务器地址: ', 'dim') + colorize(`http://127.0.0.1:${PORT}`, 'cyan'));
    
    if (options.mitm) {
      console.log(colorize('🔒 HTTPS MITM 模式: 已启用', 'green'));
      console.log(colorize('   运行 --gen-cert 查看证书安装说明', 'dim'));
    } else {
      console.log(colorize('💡 提示: 使用 --mitm 启用 HTTPS MITM 以监听 Ajax/fetch 请求', 'yellow'));
    }
    
    console.log(colorize('请配置浏览器或 curl 使用此代理服务器\n', 'dim'));
    
    if (options.save) {
      console.log(colorize(`📝 请求记录将保存到: ${LOG_DIR}`, 'yellow'));
    }
    
    if (options.verbose) {
      console.log(colorize('🔍 详细模式: 显示完整的请求/响应信息', 'magenta'));
    }
    
    if (options.method) {
      console.log(colorize(`🔍 过滤方法: ${options.method.toUpperCase()}`, 'magenta'));
    }
    
    if (options.domain) {
      console.log(colorize(`🔍 过滤域名: ${options.domain}`, 'magenta'));
    }
    
    if (options.exclude) {
      console.log(colorize(`🔍 排除域名: ${options.exclude}`, 'magenta'));
    }
    
    if (options.search) {
      console.log(colorize(`🔍 搜索关键词: ${options.search}`, 'magenta'));
    }
    
    if (options.minTime) {
      console.log(colorize(`🔍 最小响应时间: ${options.minTime}ms`, 'magenta'));
    }
    
    if (options.maxTime) {
      console.log(colorize(`🔍 最大响应时间: ${options.maxTime}ms`, 'magenta'));
    }
    
    if (options.status) {
      console.log(colorize(`🔍 状态码: ${options.status}`, 'magenta'));
    }
    
    if (options.statusRange) {
      console.log(colorize(`🔍 状态码范围: ${options.statusRange}`, 'magenta'));
    }
    
    console.log();
    console.log(colorize('─'.repeat(115), 'dim'));
    console.log(
      colorize(padRight('  协议', 5), 'dim') +
      colorize(padRight('时间', 20), 'dim') +
      colorize(padRight('方法', 8), 'dim') +
      colorize(padRight('URL', 60), 'dim') +
      colorize(padRight('状态', 6), 'dim') +
      colorize(padRight('耗时', 8), 'dim') +
      colorize(padRight('大小', 12), 'dim')
    );
    console.log(colorize('─'.repeat(115), 'dim'));
  });
  
  proxyServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(colorize(`\n❌ 端口 ${PORT} 已被占用，请使用 -p 参数指定其他端口\n`, 'red'));
      process.exit(1);
    }
    console.error(colorize('\n❌ 服务器错误:', 'red'), err.message);
  });
  
  process.on('SIGINT', () => {
    console.log(colorize('\n\n👋 正在关闭...', 'yellow'));
    
    if (options.stats) {
      printStats();
    }
    
    if (options.har && allRequests.length > 0) {
      exportToHAR();
    }
    
    proxyServer.close(() => {
      console.log(colorize('✅ 已停止\n', 'green'));
      process.exit(0);
    });
  });
}

export { printCertInstructions, createCertificate };
