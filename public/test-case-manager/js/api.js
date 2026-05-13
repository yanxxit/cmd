// js/api.js - 测试案例管理统一 fetch 封装
// 所有响应统一拆出 result.data；非 success 时抛错由调用方 try/catch
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '请求失败');
  }
  return result.data;
}

export const api = {
  request,
  get(url) {
    return request(url);
  },
  post(url, data) {
    return request(url, { method: 'POST', body: JSON.stringify(data) });
  },
  put(url, data) {
    return request(url, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete(url) {
    return request(url, { method: 'DELETE' });
  },
};

export default api;
