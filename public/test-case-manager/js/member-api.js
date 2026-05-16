const MEMBER_TOKEN_KEY = 'tcm-member-token';
const MEMBER_TOKEN_EXPIRES_KEY = 'tcm-member-token-expires';

export function getMemberToken() {
  const expiresAt = Number(localStorage.getItem(MEMBER_TOKEN_EXPIRES_KEY) || 0);
  if (expiresAt && expiresAt < Date.now()) {
    clearMemberToken();
    return '';
  }
  return localStorage.getItem(MEMBER_TOKEN_KEY) || '';
}

export function setMemberToken(token, expiresAt) {
  if (!token) return;
  localStorage.setItem(MEMBER_TOKEN_KEY, token);
  if (expiresAt) {
    localStorage.setItem(MEMBER_TOKEN_EXPIRES_KEY, String(expiresAt));
  }
}

export function clearMemberToken() {
  localStorage.removeItem(MEMBER_TOKEN_KEY);
  localStorage.removeItem(MEMBER_TOKEN_EXPIRES_KEY);
}

async function request(url, options = {}) {
  const token = getMemberToken();
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
    clearMemberToken();
    window.dispatchEvent(new CustomEvent('tcm-member-auth-expired'));
  }
  if (!result.success) {
    throw new Error(result.error || '请求失败');
  }
  return result.data;
}

export const memberApi = {
  request,
  get(url) {
    return request(url);
  },
  post(url, data) {
    return request(url, { method: 'POST', body: JSON.stringify(data) });
  },
};

export default memberApi;

