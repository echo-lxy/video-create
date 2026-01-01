'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useEditorStore } from '@/lib/store/editor-store';

type PanelTab = 'problems' | 'output' | 'terminal';

interface PanelProps {
  height: number;
  onHeightChange: (height: number) => void;
}

export default function Panel({ height, onHeightChange }: PanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('problems');
  const { isCompiling, compilationError } = useEditorStore();

  const handleToggle = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      onHeightChange(200); // 恢复默认高度
    } else {
      setIsCollapsed(true);
      onHeightChange(0);
    }
  };

  if (isCollapsed) {
    return (
      <div className="h-6 bg-[#1e1e1e] border-t border-[#3e3e42] flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {activeTab === 'problems' && (
            <>
              {compilationError ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              )}
              <span className="text-xs text-[#cccccc]">问题</span>
            </>
          )}
          {activeTab === 'output' && (
            <span className="text-xs text-[#cccccc]">输出</span>
          )}
          {activeTab === 'terminal' && (
            <span className="text-xs text-[#cccccc]">终端</span>
          )}
        </div>
        <button
          onClick={handleToggle}
          className="text-[#969696] hover:text-[#cccccc] transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#1e1e1e] border-t border-[#3e3e42]" style={{ height }}>
      {/* 标签栏 */}
      <div className="h-9 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('problems')}
            className={cn(
              'px-3 py-1 text-xs transition-colors',
              activeTab === 'problems'
                ? 'text-[#cccccc] bg-[#1e1e1e]'
                : 'text-[#969696] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            )}
          >
            {compilationError ? (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-400" />
                问题
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                问题
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={cn(
              'px-3 py-1 text-xs transition-colors',
              activeTab === 'output'
                ? 'text-[#cccccc] bg-[#1e1e1e]'
                : 'text-[#969696] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            )}
          >
            输出
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={cn(
              'px-3 py-1 text-xs transition-colors',
              activeTab === 'terminal'
                ? 'text-[#cccccc] bg-[#1e1e1e]'
                : 'text-[#969696] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            )}
          >
            终端
          </button>
        </div>
        <button
          onClick={handleToggle}
          className="text-[#969696] hover:text-[#cccccc] transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'problems' && (
          <div className="space-y-2">
            {isCompiling ? (
              <div className="flex items-center gap-2 text-[#cccccc] text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在编译...</span>
              </div>
            ) : compilationError ? (
              <div className="bg-red-900/20 border border-red-500/50 rounded p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-red-400 text-sm font-medium mb-1">编译错误</div>
                    <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">
                      {compilationError}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>没有发现问题</span>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'output' && (
          <div className="text-[#cccccc] text-sm font-mono">
            <div className="text-[#969696] mb-2">输出日志将显示在这里...</div>
          </div>
        )}
        
        {activeTab === 'terminal' && (
          <div className="text-[#cccccc] text-sm font-mono">
            <div className="text-[#969696] mb-2">终端输出将显示在这里...</div>
          </div>
        )}
      </div>
    </div>
  );
}

