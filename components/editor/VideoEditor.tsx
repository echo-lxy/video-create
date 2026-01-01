'use client';

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/store/editor-store';
import { Button } from '@/components/ui/button';
import { Code2, MessageSquare, Play, AlertCircle } from 'lucide-react';
// 直接导入，避免动态导入导致的 chunk 加载问题
import AIChatPanel from '@/components/ai/AIChatPanel';
import CodeEditor from './CodeEditor';
import VideoPreview from './VideoPreview';

export default function VideoEditor() {
  const { showAIPanel, showCodeEditor, toggleAIPanel, toggleCodeEditor } =
    useEditorStore();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // 捕获全局错误
    const handleError = (event: ErrorEvent) => {
      console.error('VideoEditor error:', event.error);
      const errorMessage = event.error?.message || event.message || 'Unknown error';
      
      // 过滤掉一些已知的 Monaco Editor 内部错误
      if (errorMessage.includes('BarBarToken') || 
          errorMessage.includes('monaco') ||
          errorMessage.includes('Monaco')) {
        console.warn('Monaco Editor internal error (may be safe to ignore):', errorMessage);
        return; // 不显示这些错误，它们通常是内部的
      }
      
      setError(errorMessage);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      const errorMessage = event.reason?.message || String(event.reason) || 'Unknown error';
      
      // 过滤 Monaco Editor 相关错误
      if (errorMessage.includes('BarBarToken') || 
          errorMessage.includes('monaco')) {
        console.warn('Monaco Editor promise rejection (may be safe to ignore):', errorMessage);
        return;
      }
      
      setError(errorMessage);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center text-gray-400">Initializing...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">Error</h3>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Top Toolbar */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Play className="w-6 h-6 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-100">
            AI Video Code Generator
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showAIPanel ? 'default' : 'outline'}
            onClick={toggleAIPanel}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Chat
          </Button>
          <Button
            size="sm"
            variant={showCodeEditor ? 'default' : 'outline'}
            onClick={toggleCodeEditor}
          >
            <Code2 className="w-4 h-4 mr-2" />
            Code Editor
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: AI Chat Panel */}
        {showAIPanel && (
          <div className="w-96 border-r border-gray-800 flex-shrink-0">
            <AIChatPanel />
          </div>
        )}

        {/* Center: Code Editor or Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {showCodeEditor && (
            <div className="h-1/2 border-b border-gray-800">
              <CodeEditor />
            </div>
          )}
          <div className={showCodeEditor ? 'h-1/2' : 'h-full'}>
            <VideoPreview />
          </div>
        </div>
      </div>
    </div>
  );
}

