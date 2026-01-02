'use client';

import { useState, useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { useEditorStore } from '@/lib/store/editor-store';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import EditorArea from './EditorArea';
import BottomPanelComponent from './Panel';
import StatusBar from './StatusBar';
import { ActivityId } from './ActivityBar';
import { ErrorBoundary } from 'react-error-boundary';

export default function VideoEditor() {
  const {
    activeActivity,
    sidebarWidth,
    panelHeight,
    activeTabs,
    setActiveActivity,
    setSidebarWidth,
    setPanelHeight,
    setActiveTabs,
  } = useEditorStore();

  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);

    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.error?.message || event.message || 'Unknown error';

      // 过滤已知的、不影响功能的错误
      if (
        errorMessage.includes('BarBarToken') ||
        errorMessage.includes('monaco') ||
        errorMessage.includes('Monaco') ||
        errorMessage.includes('chunk') ||
        errorMessage.includes('Loading') ||
        errorMessage.includes('ResizeObserver') ||
        errorMessage.includes('favicon')
      ) {
        // 静默忽略这些已知错误
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 只有真正的错误才设置状态
      console.error('VideoEditor error:', event.error);
      setError(errorMessage);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason) || 'Unknown error';

      // 过滤已知的、不影响功能的错误
      if (
        errorMessage.includes('BarBarToken') ||
        errorMessage.includes('monaco') ||
        errorMessage.includes('chunk') ||
        errorMessage.includes('Loading') ||
        errorMessage.includes('ResizeObserver')
      ) {
        // 静默忽略这些已知错误
        event.preventDefault();
        return;
      }

      // 只有真正的错误才记录
      console.error('Unhandled promise rejection:', event.reason);
      setError(errorMessage);
    };

    // 使用捕获阶段确保能捕获所有错误
    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 处理活动栏点击
  const handleActivityChange = (activity: ActivityId | null) => {
    if (activity === activeActivity) {
      // 如果点击的是当前活动项，则关闭侧边栏
      setActiveActivity(null);
    } else {
      // 否则切换到新的活动项
      setActiveActivity(activity);
      
      // 根据活动项更新标签页
      if (activity === 'editor') {
        // 确保编辑器标签页打开
        const currentTabs: Array<'editor' | 'preview'> = activeTabs.length > 0 ? activeTabs : ['preview'];
        if (!currentTabs.includes('editor')) {
          setActiveTabs(['editor', ...currentTabs]);
        }
      } else if (activity === 'preview') {
        // 确保预览标签页打开
        const currentTabs: Array<'editor' | 'preview'> = activeTabs.length > 0 ? activeTabs : ['editor'];
        if (!currentTabs.includes('preview')) {
          setActiveTabs(['preview', ...currentTabs]);
        }
      }
    }
  };

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="w-12 h-12 animate-spin text-[#007acc]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center max-w-2xl px-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-300 mb-2">
            编辑器错误
          </h2>
          <p className="text-[#cccccc] mb-4">
            {error}
          </p>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      </div>
    );
  }

  const showSidebar = activeActivity && ['ai', 'assets', 'prompt'].includes(activeActivity);
  const showBottomPanel = panelHeight > 0;

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
          <div className="text-center max-w-2xl px-4">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-300 mb-2">
              编辑器错误
            </h2>
            <p className="text-[#cccccc] mb-4">
              编辑器组件发生错误。
            </p>
            {error && (
              <pre className="text-xs text-red-400 bg-red-900/30 p-3 rounded mb-4 overflow-auto text-left max-h-32">
                {error.message}
              </pre>
            )}
            <Button onClick={resetErrorBoundary}>
              重试
            </Button>
          </div>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error('VideoEditor Error Boundary caught:', error, errorInfo);
      }}
    >
      {/* 最外层容器 - 100% 高度和宽度 */}
      <div className="w-full h-full flex flex-col bg-[#1e1e1e]" style={{ position: 'relative' }}>
        {/* 主内容区 - flex-1 确保占满剩余空间 */}
        <div className="flex-1 flex min-h-0" style={{ position: 'relative' }}>
          {/* 活动栏 - 固定宽度 48px */}
          <div className="w-12 flex-shrink-0 h-full">
            <ActivityBar
              activeActivity={activeActivity}
              onActivityChange={handleActivityChange}
            />
          </div>

          {/* Allotment 容器 - 占满剩余空间 */}
          <div className="flex-1 min-w-0 h-full" style={{ position: 'relative' }}>
            <Allotment
              proportionalLayout={false}
              onChange={(sizes) => {
                // 跟踪侧边栏宽度变化
                if (showSidebar && sizes && Array.isArray(sizes) && sizes.length > 0 && sizes[0] != null) {
                  setSidebarWidth(sizes[0]);
                }
              }}
            >
              {/* 侧边栏 - 可选显示 */}
              {showSidebar && (
                <Allotment.Pane 
                  minSize={200} 
                  maxSize={600}
                  preferredSize={sidebarWidth || 320}
                  snap
                >
                  <div className="w-full h-full">
                    <Sidebar activeActivity={activeActivity} width={sidebarWidth} />
                  </div>
                </Allotment.Pane>
              )}

              {/* 主编辑区和底部面板 - 垂直分割 */}
              <Allotment.Pane>
                <Allotment 
                  vertical
                  proportionalLayout={false}
                  onChange={(sizes) => {
                    // 跟踪底部面板高度变化
                    if (showBottomPanel && sizes && Array.isArray(sizes) && sizes.length > 1 && sizes[1] != null) {
                      setPanelHeight(sizes[1]);
                    }
                  }}
                >
                  {/* 主编辑区 */}
                  <Allotment.Pane minSize={300}>
                    <div className="w-full h-full">
                      <EditorArea
                        activeTabs={activeTabs}
                        onTabChange={setActiveTabs}
                        defaultActiveTab={activeActivity === 'editor' ? 'editor' : activeActivity === 'preview' ? 'preview' : undefined}
                      />
                    </div>
                  </Allotment.Pane>

                  {/* 底部面板 - 可选显示 */}
                  {showBottomPanel && (
                    <Allotment.Pane 
                      minSize={100} 
                      maxSize={500}
                      preferredSize={panelHeight || 200}
                      snap
                    >
                      <div className="w-full h-full">
                        <BottomPanelComponent 
                          height={panelHeight} 
                          onHeightChange={setPanelHeight} 
                        />
                      </div>
                    </Allotment.Pane>
                  )}
                </Allotment>
              </Allotment.Pane>
            </Allotment>
          </div>
        </div>

        {/* 状态栏 - 固定在底部 */}
        <div className="flex-shrink-0">
          <StatusBar />
        </div>
      </div>
    </ErrorBoundary>
  );
}
