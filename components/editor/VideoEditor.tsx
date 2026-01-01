'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useEditorStore } from '@/lib/store/editor-store';
import { Button } from '@/components/ui/button';
import { Code2, MessageSquare, Play, AlertCircle, Loader2, FolderOpen, FileText } from 'lucide-react';

// 懒加载组件，按需加载以加快初始加载
const AIChatPanel = lazy(() => import('@/components/ai/AIChatPanel').then(m => ({ default: m.default })));
const CodeEditor = lazy(() => import('./CodeEditor').then(m => ({ default: m.default })));
const VideoPreview = lazy(() => import('./VideoPreview').then(m => ({ default: m.default })));
const AssetManager = lazy(() => import('@/components/assets/AssetManager').then(m => ({ default: m.default })));
const PromptTemplateEditor = lazy(() => import('@/components/prompt/PromptTemplateEditor').then(m => ({ default: m.default })));

// 加载占位符
const LoadingPlaceholder = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center bg-gray-950">
    <div className="text-center text-gray-400 text-sm">
      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
      <p>{text}</p>
    </div>
  </div>
);

export default function VideoEditor() {
  const { showAIPanel, showCodeEditor, toggleAIPanel, toggleCodeEditor } =
    useEditorStore();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssets, setShowAssets] = useState(false);
  const [showPromptTemplate, setShowPromptTemplate] = useState(false);

  useEffect(() => {
    // 延迟设置 mounted，给组件一些时间初始化
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    
    // 捕获全局错误
    const handleError = (event: ErrorEvent) => {
      console.error('VideoEditor error:', event.error);
      const errorMessage = event.error?.message || event.message || 'Unknown error';
      
      // 过滤掉一些已知的 Monaco Editor 内部错误
      if (errorMessage.includes('BarBarToken') || 
          errorMessage.includes('monaco') ||
          errorMessage.includes('Monaco') ||
          errorMessage.includes('chunk') ||
          errorMessage.includes('Loading')) {
        console.warn('Component loading error (may be safe to ignore):', errorMessage);
        return; // 不显示这些错误，它们通常是加载相关的
      }
      
      setError(errorMessage);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      const errorMessage = event.reason?.message || String(event.reason) || 'Unknown error';
      
      // 过滤加载相关错误
      if (errorMessage.includes('BarBarToken') || 
          errorMessage.includes('monaco') ||
          errorMessage.includes('chunk') ||
          errorMessage.includes('Loading')) {
        console.warn('Component loading rejection (may be safe to ignore):', errorMessage);
        return;
      }
      
      setError(errorMessage);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      clearTimeout(timer);
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
          <Button
            size="sm"
            variant={showAssets ? 'default' : 'outline'}
            onClick={() => setShowAssets(!showAssets)}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            资源管理
          </Button>
          <Button
            size="sm"
            variant={showPromptTemplate ? 'default' : 'outline'}
            onClick={() => setShowPromptTemplate(!showPromptTemplate)}
          >
            <FileText className="w-4 h-4 mr-2" />
            提示词模板
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: AI Chat Panel / Assets / Prompt Template */}
        <div className="flex">
          {showAIPanel && (
            <div className="w-96 border-r border-gray-800 flex-shrink-0">
              <Suspense fallback={<LoadingPlaceholder text="Loading AI Panel..." />}>
                <AIChatPanel />
              </Suspense>
            </div>
          )}
          {showAssets && (
            <div className="w-80 border-r border-gray-800 flex-shrink-0">
              <Suspense fallback={<LoadingPlaceholder text="Loading Assets..." />}>
                <AssetManager />
              </Suspense>
            </div>
          )}
          {showPromptTemplate && (
            <div className="w-80 border-r border-gray-800 flex-shrink-0">
              <Suspense fallback={<LoadingPlaceholder text="Loading Prompt Template..." />}>
                <PromptTemplateEditor />
              </Suspense>
            </div>
          )}
        </div>

        {/* Center: Code Editor or Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {showCodeEditor && (
            <div className="h-1/2 border-b border-gray-800">
              <Suspense fallback={<LoadingPlaceholder text="Loading Code Editor..." />}>
                <CodeEditor />
              </Suspense>
            </div>
          )}
          <div className={showCodeEditor ? 'h-1/2' : 'h-full'}>
            <Suspense fallback={<LoadingPlaceholder text="Loading Preview..." />}>
              <VideoPreview />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

