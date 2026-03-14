let requestHistory = [];
const MAX_HISTORY = 1000;

export function addRequest(info) {
  requestHistory.unshift(info);
  if (requestHistory.length > MAX_HISTORY) {
    requestHistory.pop();
  }
}

export function getRequests(options = {}) {
  let result = [...requestHistory];
  
  if (options.method) {
    result = result.filter(r => r.method === options.method);
  }
  
  if (options.path) {
    result = result.filter(r => r.path.includes(options.path));
  }
  
  if (options.limit && options.limit > 0) {
    result = result.slice(0, options.limit);
  }
  
  return result;
}

export function clearRequests() {
  requestHistory = [];
}

export function createRequestLogger() {
  return function (req, res, next) {
    const startTime = Date.now();
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    const requestInfo = {
      id: requestId,
      method: req.method,
      path: req.path,
      url: req.originalUrl,
      query: { ...req.query },
      body: req.body ? JSON.parse(JSON.stringify(req.body)) : undefined,
      headers: {
        'user-agent': req.get('user-agent'),
        'content-type': req.get('content-type'),
        'accept': req.get('accept')
      },
      ip: req.ip || req.ips?.[0] || req.connection?.remoteAddress,
      timestamp: new Date().toISOString(),
      startTime: startTime,
      statusCode: null,
      responseTime: null,
      responseSize: null
    };
    
    const originalEnd = res.end;
    const originalWrite = res.write;
    let responseSize = 0;
    
    res.write = function (chunk, ...args) {
      if (chunk) {
        responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
      }
      return originalWrite.call(this, chunk, ...args);
    };
    
    res.end = function (chunk, ...args) {
      if (chunk) {
        responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
      }
      
      requestInfo.statusCode = res.statusCode;
      requestInfo.responseTime = Date.now() - startTime;
      requestInfo.responseSize = responseSize;
      
      addRequest(requestInfo);
      
      return originalEnd.call(this, chunk, ...args);
    };
    
    next();
  };
}
