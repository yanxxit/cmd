import { message } from 'antd';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

/**
 * 统一的请求封装函数
 * 自动适配 Next.js 代理配置：
 * - 开发环境：自动添加 /api 前缀，通过代理访问后端服务
 * - 生产环境：直接使用相对路径
 */
export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...customOptions } = options;

  let fetchUrl = url;

  // 自动添加 /api 前缀以适配代理配置
  // 代理配置：/api/* -> http://localhost:3000/api/*
  if (!fetchUrl.startsWith('/api/') && !fetchUrl.startsWith('http://') && !fetchUrl.startsWith('https://')) {
    fetchUrl = `/api${fetchUrl.startsWith('/') ? fetchUrl : '/' + fetchUrl}`;
  }

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
