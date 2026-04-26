import { message } from 'antd';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...customOptions } = options;

  let fetchUrl = url;

  // 处理查询参数
  if (params) {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        if (Array.isArray(params[key])) {
          params[key].forEach((val: any) => searchParams.append(key, val));
        } else {
          searchParams.append(key, params[key]);
        }
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fetchUrl += `${fetchUrl.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...customOptions.headers,
      },
      ...customOptions,
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // 代理或路由配置错误时，可能会返回 HTML 等内容
      throw new Error(`Invalid response content-type: ${contentType}`);
    }

    if (!response.ok) {
      throw new Error(data?.error || '请求失败');
    }

    return data;
  } catch (error: any) {
    // 忽略由于组件卸载等原因导致的中止请求错误
    if (error.name === 'AbortError') throw error;
    message.error(error.message || '网络错误');
    throw error;
  }
}
