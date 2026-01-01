'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect, Component } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// 调试模式：在 URL 中添加 ?debug=1 来显示加载状态
const isDebug = typeof window !== 'undefined' && 
  new URLSearchParams(window.location.search).get('debug') === '1';

// 加载组件（显示加载时间和进度）
function LoadingComponent() {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-400">Loading AI Video Editor...</p>
        <p className="text-gray-500 text-sm mt-2">
          This may take a moment... ({elapsed}s)
        </p>
        <p className="text-gray-600 text-xs mt-4">
          First load requires downloading Monaco Editor (~2MB) and esbuild-wasm (~1MB)
        </p>
        {elapsed > 30 && (
          <p className="text-yellow-500 text-xs mt-2">
            Taking longer than usual. Check your network connection.
          </p>
        )}
        {elapsed > 10 && (
          <p className="text-gray-500 text-xs mt-2">
            💡 Tip: Subsequent loads will be much faster (browser cache)
          </p>
        )}
      </div>
    </div>
  );
}

// 动态导入主编辑器组件，避免 SSR 问题
const VideoEditor = dynamic(() => import('@/components/editor/VideoEditor'), {
  ssr: false,
  loading: () => <LoadingComponent />,
});

// 调试组件
const LoadingDebug = dynamic(() => import('@/components/editor/LoadingDebug'), {
  ssr: false,
});

// 错误边界组件
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setError(event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-2xl px-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-300 mb-2">
            Failed to Load Editor
          </h2>
          <p className="text-gray-400 mb-4">
            There was an error loading the video editor. Please try refreshing the page.
          </p>
          {error && (
            <pre className="text-xs text-gray-500 bg-gray-900 p-4 rounded overflow-auto text-left max-h-64">
              {error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [loadStartTime] = useState(Date.now());

  useEffect(() => {
    setIsClient(true);
    
    // 增加超时时间到 60 秒（Monaco Editor 和 esbuild-wasm 首次加载需要时间）
    const timeout = setTimeout(() => {
      const elapsed = Date.now() - loadStartTime;
      if (elapsed > 60000) {
        setLoadTimeout(true);
        console.warn('Loading timeout after 60 seconds');
      }
    }, 60000);

    return () => clearTimeout(timeout);
  }, [loadStartTime]);

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

  // 超时提示（只在真正超时后显示，不阻止正常加载）
  // 注释掉超时阻止，让组件继续加载
  // if (loadTimeout) {
  //   return (
  //     <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
  //       <div className="text-center max-w-md px-4">
  //         <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
  //         <h2 className="text-xl font-semibold text-yellow-300 mb-2">
  //           Loading Timeout
  //         </h2>
  //         <p className="text-gray-400 mb-4">
  //           The editor is taking longer than expected to load. This might be due to:
  //         </p>
  //         <ul className="text-sm text-gray-500 text-left mb-4 space-y-2">
  //           <li>• Slow network connection</li>
  //           <li>• Large dependencies (Monaco Editor, esbuild-wasm)</li>
  //           <li>• Browser compatibility issues</li>
  //         </ul>
  //         <div className="space-y-2">
  //           <button
  //             onClick={() => window.location.reload()}
  //             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
  //           >
  //             Retry
  //           </button>
  //           <button
  //             onClick={() => {
  //               window.location.href = window.location.href + '?debug=1';
  //             }}
  //             className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
  //           >
  //             Debug Mode
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-400">Initializing...</p>
              </div>
            </div>
          }
        >
          <VideoEditor />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

