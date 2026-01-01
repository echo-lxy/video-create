'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录全局错误
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-gray-950 text-gray-100">
        <div className="h-screen w-screen flex items-center justify-center">
          <div className="text-center max-w-2xl px-4">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-300 mb-2">
              Application Error
            </h2>
            <p className="text-gray-400 mb-4">
              {error.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

