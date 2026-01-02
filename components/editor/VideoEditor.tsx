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
import StatusBar from './StatusBar';
import { ActivityId } from './ActivityBar';

export default function VideoEditor() {
  const {
    activeActivity,
    sidebarWidth,
    activeTabs,
    setActiveActivity,
    setSidebarWidth,
    setActiveTabs,
  } = useEditorStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 处理活动栏点击
  const handleActivityChange = (activity: ActivityId | null) => {
    if (activity === activeActivity) {
      setActiveActivity(null);
    } else {
      setActiveActivity(activity);
      
      // 根据活动项更新标签页
      if (activity === 'editor') {
        if (!activeTabs.includes('editor')) {
          setActiveTabs(['editor', ...activeTabs]);
        }
      } else if (activity === 'preview') {
        if (!activeTabs.includes('preview')) {
          setActiveTabs(['preview', ...activeTabs]);
        }
      }
    }
  };

  if (!mounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="w-12 h-12 animate-spin text-[#007acc]" />
      </div>
    );
  }

  const showSidebar = activeActivity && ['ai', 'assets', 'prompt', 'settings'].includes(activeActivity);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 活动栏 */}
        <div className="w-12 flex-shrink-0 bg-[#2d2d30] border-r border-[#3e3e42]">
          <ActivityBar
            activeActivity={activeActivity}
            onActivityChange={handleActivityChange}
          />
        </div>

        {/* 可调整大小的内容区 */}
        <div className="flex-1 overflow-hidden">
          <Allotment
            proportionalLayout={false}
            onChange={(sizes) => {
              if (showSidebar && sizes && sizes[0]) {
                setSidebarWidth(sizes[0]);
              }
            }}
          >
            {/* 侧边栏（可选） */}
            {showSidebar && (
              <Allotment.Pane 
                minSize={200} 
                maxSize={600}
                preferredSize={sidebarWidth || 300}
              >
                <Sidebar activeActivity={activeActivity} />
              </Allotment.Pane>
            )}

            {/* 主编辑区 */}
            <Allotment.Pane>
              <EditorArea
                activeTabs={activeTabs}
                onTabChange={setActiveTabs}
              />
            </Allotment.Pane>
          </Allotment>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="h-6 flex-shrink-0">
        <StatusBar />
      </div>
    </div>
  );
}
