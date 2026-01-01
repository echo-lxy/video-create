'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// 动态导入主编辑器组件，避免 SSR 问题
const VideoEditor = dynamic(() => import('@/components/editor/VideoEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-400">Loading AI Video Editor...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <Suspense
        fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          </div>
        }
      >
        <VideoEditor />
      </Suspense>
    </main>
  );
}

