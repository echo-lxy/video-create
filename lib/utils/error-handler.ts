/**
 * 全局错误处理工具
 * 用于抑制已知的、不影响功能的浏览器警告
 */

/**
 * 初始化全局错误处理
 * 抑制 ResizeObserver 等已知的浏览器警告
 */
export function initGlobalErrorHandler() {
  if (typeof window === 'undefined') return;

  // 保存原始 console.error
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // 覆盖 console.error 以过滤已知警告
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // 过滤 ResizeObserver 相关警告（浏览器已知问题）
    if (
      message.includes('ResizeObserver loop') ||
      message.includes('ResizeObserver loop completed with undelivered notifications') ||
      message.includes('ResizeObserver loop limit exceeded')
    ) {
      // 静默忽略，这是浏览器已知问题，不影响功能
      // 参考：https://github.com/WICG/resize-observer/issues/38
      return;
    }

    // 过滤其他已知的、不影响功能的警告
    if (
      message.includes('BarBarToken') ||
      message.includes('monaco') ||
      message.includes('chunk') ||
      message.includes('Loading') ||
      message.includes('favicon') ||
      message.includes('404')
    ) {
      // 静默忽略
      return;
    }

    // 其他错误正常输出
    originalConsoleError.apply(console, args);
  };

  // 覆盖 console.warn 以过滤已知警告
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // 过滤 ResizeObserver 相关警告
    if (
      message.includes('ResizeObserver') ||
      message.includes('BarBarToken') ||
      message.includes('monaco')
    ) {
      // 静默忽略
      return;
    }

    // 其他警告正常输出
    originalConsoleWarn.apply(console, args);
  };

  // 处理全局错误事件
  const handleError = (event: ErrorEvent) => {
    const errorMessage = event.error?.message || event.message || '';
    
    // 过滤已知的、不影响功能的错误
    if (
      errorMessage.includes('ResizeObserver') ||
      errorMessage.includes('BarBarToken') ||
      errorMessage.includes('monaco') ||
      errorMessage.includes('chunk') ||
      errorMessage.includes('Loading') ||
      errorMessage.includes('favicon')
    ) {
      // 阻止错误显示在控制台
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  };

  // 处理未捕获的 Promise 拒绝
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const errorMessage = event.reason?.message || String(event.reason) || '';
    
    // 过滤已知的、不影响功能的错误
    if (
      errorMessage.includes('ResizeObserver') ||
      errorMessage.includes('BarBarToken') ||
      errorMessage.includes('monaco') ||
      errorMessage.includes('chunk') ||
      errorMessage.includes('Loading')
    ) {
      // 阻止错误显示在控制台
      event.preventDefault();
      return;
    }
  };

  // 注册事件监听器（使用捕获阶段以确保能捕获所有错误）
  window.addEventListener('error', handleError, true);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // 返回清理函数
  return () => {
    // 恢复原始 console 方法
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    
    // 移除事件监听器
    window.removeEventListener('error', handleError, true);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}

