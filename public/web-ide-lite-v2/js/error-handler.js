/**
 * Web IDE Lite v2 - 错误处理
 */

// 错误类型
export const ErrorType = {
  FILE: 'FILE_ERROR',
  DIRECTORY: 'DIRECTORY_ERROR',
  EDITOR: 'EDITOR_ERROR',
  NETWORK: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// 错误处理类
export class AppError extends Error {
  constructor(message, type = ErrorType.UNKNOWN, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

// 错误处理器
export class ErrorHandler {
  constructor(showToast, onError) {
    this.showToast = showToast;
    this.onError = onError;
  }

  handle(error, context = '') {
    const appError = error instanceof AppError ? error : this.wrapError(error);
    
    // 记录错误
    console.error(`[${context}] ${appError.type}:`, appError);
    
    // 显示错误提示
    this.showToast(`❌ ${this.getErrorMessage(appError)}`, 'error');
    
    // 回调
    if (this.onError) this.onError(appError);
    
    return appError;
  }

  wrapError(error) {
    if (error.name === 'AbortError') {
      return new AppError('操作已取消', ErrorType.UNKNOWN, error);
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new AppError('网络错误，请检查网络连接', ErrorType.NETWORK, error);
    }
    return new AppError(error.message || '未知错误', ErrorType.UNKNOWN, error);
  }

  getErrorMessage(error) {
    const messages = {
      [ErrorType.FILE]: '文件操作失败',
      [ErrorType.DIRECTORY]: '目录操作失败',
      [ErrorType.EDITOR]: '编辑器错误',
      [ErrorType.NETWORK]: '网络连接失败'
    };
    return messages[error.type] || error.message;
  }
}

// 创建错误处理器
export function createErrorHandler(showToast, onError) {
  return new ErrorHandler(showToast, onError);
}

// 异步错误包装器
export function withError(handler, errorHandler, context = '') {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorHandler.handle(error, context);
    }
  };
}
