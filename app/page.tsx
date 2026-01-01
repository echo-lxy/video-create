'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { initGlobalErrorHandler } from '@/lib/utils/error-handler';

// 调试模式：在 URL 中添加 ?debug=1 来显示加载状态
const isDebug = typeof window !== 'undefined' && 
  new URLSearchParams(window.location.search).get('debug') === '1';

// 动态导入主编辑器组件，避免 SSR 问题
const VideoEditor = dynamic(() => import('@/components/editor/VideoEditor'), {
  ssr: false,
  loading: () => <LoadingComponent />,
});

// 调试组件
const LoadingDebug = dynamic(() => import('@/components/editor/LoadingDebug'), {
  ssr: false,
});

function LoadingComponent() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hint, setHint] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (elapsedTime > 5 && elapsedTime <= 10) {
      setHint('正在加载代码编辑器...');
    } else if (elapsedTime > 10 && elapsedTime <= 20) {
      setHint('正在初始化编译器...');
    } else if (elapsedTime > 20) {
      setHint('首次加载较慢，请耐心等待。资源将被缓存，后续访问会更快。');
    }
  }, [elapsedTime]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-400">Loading AI Video Editor...</p>
        <p className="text-gray-500 text-sm mt-2">Elapsed: {elapsedTime}s</p>
        {hint && (
          <p className="text-gray-600 text-xs mt-2 max-w-md mx-auto">{hint}</p>
        )}
        {elapsedTime > 10 && (
          <p className="text-gray-600 text-xs mt-2">
            💡 首次加载需要下载大型依赖（Monaco Editor, esbuild-wasm）。
            <br />
            它们将被缓存，后续访问会快很多（2-5 秒）。
          </p>
        )}
        {elapsedTime > 30 && (
          <p className="text-gray-600 text-xs mt-2">
            ⚠️ 加载时间较长？检查网络或尝试调试模式：在 URL 中添加 ?debug=1
          </p>
        )}
      </div>
    </div>
  );
}

// 全局错误处理（用于捕获非React错误）
function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 初始化全局错误处理（抑制 ResizeObserver 等已知警告）
    const cleanup = initGlobalErrorHandler();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return <>{children}</>;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  // 调试模式
  if (isDebug) {
    return <LoadingDebug />;
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <GlobalErrorHandler>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div className="h-screen w-screen flex items-center justify-center bg-[#1e1e1e]">
              <div className="text-center max-w-2xl px-4">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-red-300 mb-2">
                  应用加载失败
                </h2>
                <p className="text-[#cccccc] mb-4">
                  编辑器加载时发生错误。请刷新页面重试。
                </p>
                {error && (
                  <pre className="text-xs text-red-400 bg-red-900/30 p-3 rounded mb-4 overflow-auto text-left max-h-32">
                    {error.message}
                  </pre>
                )}
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={resetErrorBoundary}
                    className="px-4 py-2 bg-[#007acc] text-white rounded hover:bg-[#005a9e]"
                  >
                    重试
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    刷新页面
                  </button>
                </div>
              </div>
            </div>
          )}
          onError={(error, errorInfo) => {
            console.error('App Error Boundary caught:', error, errorInfo);
          }}
        >
          <Suspense fallback={<LoadingComponent />}>
            <VideoEditor />
          </Suspense>
        </ErrorBoundary>
      </GlobalErrorHandler>
    </main>
  );
}
