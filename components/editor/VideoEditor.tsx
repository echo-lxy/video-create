'use client';

import { useState, useEffect } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { useEditorStore } from '@/lib/store/editor-store';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import EditorArea from './EditorArea';
import BottomPanelComponent from './Panel';
import StatusBar from './StatusBar';
import { ActivityId } from './ActivityBar';
import { ErrorBoundary } from './ErrorBoundary';

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
      console.error('VideoEditor error:', event.error);
      const errorMessage = event.error?.message || event.message || 'Unknown error';

      if (
        errorMessage.includes('BarBarToken') ||
        errorMessage.includes('monaco') ||
        errorMessage.includes('Monaco') ||
        errorMessage.includes('chunk') ||
        errorMessage.includes('Loading')
      ) {
        console.warn('Component loading error (may be safe to ignore):', errorMessage);
        return;
      }

      setError(errorMessage);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      const errorMessage = event.reason?.message || String(event.reason) || 'Unknown error';

      if (
        errorMessage.includes('BarBarToken') ||
        errorMessage.includes('monaco') ||
        errorMessage.includes('chunk') ||
        errorMessage.includes('Loading')
      ) {
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

  const handleActivityChange = (activity: ActivityId) => {
    // 如果点击的是当前活动，则关闭侧边栏（仅对侧边栏活动）
    if (activeActivity === activity && ['ai', 'assets', 'prompt'].includes(activity)) {
      setActiveActivity(null);
      return;
    }
    
    // 设置新的活动
    setActiveActivity(activity);
    
    // 如果选择的是编辑器或预览，自动添加到标签页并激活
    if (activity === 'editor') {
      if (!activeTabs.includes('editor')) {
        setActiveTabs([...activeTabs, 'editor']);
      }
      // 注意：EditorArea会通过activeTabs的变化自动切换到editor标签
    } else if (activity === 'preview') {
      if (!activeTabs.includes('preview')) {
        setActiveTabs([...activeTabs, 'preview']);
      }
      // 注意：EditorArea会通过activeTabs的变化自动切换到preview标签
    }
  };

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center text-[#cccccc]">Initializing...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">Error</h3>
          <p className="text-sm text-[#cccccc] mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  const showSidebar = activeActivity && ['ai', 'assets', 'prompt'].includes(activeActivity);
  const showBottomPanel = panelHeight > 0;

  // 计算面板尺寸百分比
  const getSidebarSize = () => {
    if (!showSidebar) return 0;
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    return Math.min(Math.max((sidebarWidth / containerWidth) * 100, 15), 40);
  };

  const getBottomPanelSize = () => {
    if (!showBottomPanel) return 0;
    const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    return Math.min(Math.max((panelHeight / containerHeight) * 100, 5), 70);
  };

  return (
    <ErrorBoundary>
      <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
        {/* 主布局：活动栏 + 侧边栏 + 编辑区 + 底部面板 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 活动栏 */}
          <div className="flex-shrink-0">
            <ActivityBar
              activeActivity={activeActivity}
              onActivityChange={handleActivityChange}
            />
          </div>

          {/* 侧边栏和主编辑区 */}
          <Group orientation="horizontal" className="flex-1">
            {/* 侧边栏（可调整大小） */}
            {showSidebar && (
              <>
                <Panel
                  defaultSize={getSidebarSize()}
                  minSize={15}
                  maxSize={40}
                  onResize={(panelSize) => {
                    // panelSize 是 { asPercentage: number, inPixels: number }
                    setSidebarWidth(panelSize.inPixels);
                  }}
                >
                  <Sidebar activeActivity={activeActivity} width={sidebarWidth} />
                </Panel>
                <Separator className="w-1 bg-[#1e1e1e] hover:bg-[#007acc] transition-colors cursor-col-resize" />
              </>
            )}

            {/* 主编辑区和底部面板 */}
            <Group orientation="vertical" className="flex-1">
              <Panel
                defaultSize={showBottomPanel ? 100 - getBottomPanelSize() : 100}
                minSize={30}
              >
                <EditorArea
                  activeTabs={activeTabs}
                  onTabChange={setActiveTabs}
                  defaultActiveTab={activeActivity === 'editor' ? 'editor' : activeActivity === 'preview' ? 'preview' : undefined}
                />
              </Panel>

              {/* 底部面板（可调整大小） */}
              {showBottomPanel && (
                <>
                  <Separator className="h-1 bg-[#1e1e1e] hover:bg-[#007acc] transition-colors cursor-row-resize" />
                  <Panel
                    defaultSize={getBottomPanelSize()}
                    minSize={5}
                    maxSize={70}
                  onResize={(panelSize) => {
                    // panelSize 是 { asPercentage: number, inPixels: number }
                    setPanelHeight(panelSize.inPixels);
                  }}
                  >
                    <BottomPanelComponent height={panelHeight} onHeightChange={setPanelHeight} />
                  </Panel>
                </>
              )}
          </Group>
        </Group>
        </div>

        {/* 状态栏 */}
        <StatusBar />
      </div>
    </ErrorBoundary>
  );
}

