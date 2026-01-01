'use client';

import { useCodeStore } from '@/lib/store/code-store';
import { useEditorStore } from '@/lib/store/editor-store';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function StatusBar() {
  const { videoConfig } = useCodeStore();
  const { isCompiling, compilationError } = useEditorStore();
  
  const { durationInFrames, fps, width, height } = videoConfig;
  const duration = (durationInFrames / fps).toFixed(1);

  return (
    <div className="h-6 bg-[#007acc] text-white text-xs flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {/* 编译状态 */}
        <div className="flex items-center gap-1.5">
          {isCompiling ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>编译中...</span>
            </>
          ) : compilationError ? (
            <>
              <AlertCircle className="w-3 h-3" />
              <span>编译错误</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>就绪</span>
            </>
          )}
        </div>

        {/* 视频配置 */}
        <div className="flex items-center gap-4">
          <span>{duration}秒</span>
          <span>{fps} fps</span>
          <span>{width}×{height}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span>AI Video Editor</span>
      </div>
    </div>
  );
}

