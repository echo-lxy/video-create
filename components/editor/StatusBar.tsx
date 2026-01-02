'use client';

import { useEditorStore } from '@/lib/store/editor-store';
import { useCodeStore } from '@/lib/store/code-store';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StatusBar() {
  const { compiling, compilationError } = useEditorStore();
  const { videoConfig } = useCodeStore();

  return (
    <div className="w-full h-6 bg-[#007acc] border-t border-[#3e3e42] px-3 flex items-center justify-between text-xs text-white">
      {/* 左侧：编译状态 */}
      <div className="flex items-center gap-2">
        {compiling ? (
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

      {/* 右侧：视频信息 */}
      <div className="flex items-center gap-4">
        <span>{videoConfig.fps} fps</span>
        <span>{videoConfig.durationInFrames} 帧</span>
        <span>{videoConfig.width}×{videoConfig.height}</span>
        <span>{videoConfig.name}</span>
      </div>
    </div>
  );
}
