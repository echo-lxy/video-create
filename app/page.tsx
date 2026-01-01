'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// 调试模式：在 URL 中添加 ?debug=1 来显示加载状态
const isDebug = typeof window !== 'undefined' && 
  new URLSearchParams(window.location.search).get('debug') === '1';

// 动态导入主编辑器组件，避免 SSR 问题
const VideoEditor = dynamic(() => import('@/components/editor/VideoEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-400">Loading AI Video Editor...</p>
        <p className="text-gray-500 text-sm mt-2">This may take a moment...</p>
        <p className="text-gray-600 text-xs mt-4">
          If this takes too long, add ?debug=1 to the URL
        </p>
      </div>
    </div>
  ),
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

  useEffect(() => {
    setIsClient(true);
    
    // 设置超时检测（30秒）
    const timeout = setTimeout(() => {
      setLoadTimeout(true);
      console.error('Loading timeout after 30 seconds');
    }, 30000);

    return () => clearTimeout(timeout);
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

  // 超时提示
  if (loadTimeout) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-300 mb-2">
            Loading Timeout
          </h2>
          <p className="text-gray-400 mb-4">
            The editor is taking longer than expected to load. This might be due to:
          </p>
          <ul className="text-sm text-gray-500 text-left mb-4 space-y-2">
            <li>• Slow network connection</li>
            <li>• Large dependencies (Monaco Editor, esbuild-wasm)</li>
            <li>• Browser compatibility issues</li>
          </ul>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              Retry
            </button>
            <button
              onClick={() => {
                window.location.href = window.location.href + '?debug=1';
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Debug Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

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

