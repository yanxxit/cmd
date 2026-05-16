// js/api.js - 测试案例管理统一 fetch 封装
// 所有响应统一拆出 result.data；非 success 时抛错由调用方 try/catch
const AUTH_TOKEN_KEY = 'tcm-admin-token';
const AUTH_EXPIRES_KEY = 'tcm-admin-token-expires';

export function getAuthToken() {
  const expiresAt = Number(localStorage.getItem(AUTH_EXPIRES_KEY) || 0);
  if (expiresAt && expiresAt < Date.now()) {
    clearAuthToken();
    return '';
  }
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function setAuthToken(token, expiresAt) {
  if (!token) return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (expiresAt) {
    localStorage.setItem(AUTH_EXPIRES_KEY, String(expiresAt));
  }
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXPIRES_KEY);
}

async function request(url, options = {}) {
  const token = getAuthToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const result = await response.json();
  if (response.status === 401 && token) {
    clearAuthToken();
    window.dispatchEvent(new CustomEvent('tcm-auth-expired'));
  }
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
