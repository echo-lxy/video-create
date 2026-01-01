'use client';

import { lazy, Suspense, useState, useEffect } from 'react';
import { Code2, Monitor, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

// 懒加载组件
const CodeEditor = lazy(() => import('./CodeEditor').then(m => ({ default: m.default })));
const VideoPreview = lazy(() => import('./VideoPreview').then(m => ({ default: m.default })));

type TabId = 'editor' | 'preview';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'editor', label: '代码编辑器', icon: Code2 },
  { id: 'preview', label: '视频预览', icon: Monitor },
];

interface EditorAreaProps {
  activeTabs: TabId[];
  onTabChange: (tabs: TabId[]) => void;
  onTabClose?: (tabId: TabId) => void;
  defaultActiveTab?: TabId;
}

const LoadingPlaceholder = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
    <div className="text-center text-[#cccccc] text-sm">
      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
      <p>{text}</p>
    </div>
  </div>
);

export default function EditorArea({ activeTabs, onTabChange, onTabClose, defaultActiveTab }: EditorAreaProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultActiveTab || activeTabs[0] || 'preview');
  
  // 当activeTabs变化时，更新activeTab
  useEffect(() => {
    if (activeTabs.length > 0) {
      // 如果当前activeTab不在activeTabs中，切换到第一个可用的tab
      if (!activeTabs.includes(activeTab)) {
        setActiveTab(activeTabs[0]);
      }
      // 如果有defaultActiveTab且它在activeTabs中，切换到它
      else if (defaultActiveTab && activeTabs.includes(defaultActiveTab)) {
        setActiveTab(defaultActiveTab);
      }
    }
  }, [activeTabs, defaultActiveTab]);

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    if (!activeTabs.includes(tabId)) {
      onTabChange([...activeTabs, tabId]);
    }
  };

  const handleTabClose = (e: React.MouseEvent, tabId: TabId) => {
    e.stopPropagation();
    if (activeTabs.length > 1) {
      const newTabs = activeTabs.filter(id => id !== tabId);
      onTabChange(newTabs);
      if (activeTab === tabId) {
        setActiveTab(newTabs[0]);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* 标签栏 */}
      <div className="h-9 bg-[#2d2d30] border-b border-[#3e3e42] flex items-end overflow-x-auto">
        {tabs.map((tab) => {
          if (!activeTabs.includes(tab.id)) return null;
          
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'h-full px-4 flex items-center gap-2 border-r border-[#3e3e42] transition-colors group',
                isActive
                  ? 'bg-[#1e1e1e] text-[#cccccc] border-t-2 border-t-[#007acc]'
                  : 'bg-[#2d2d30] text-[#969696] hover:bg-[#37373d] hover:text-[#cccccc]'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm whitespace-nowrap">{tab.label}</span>
              {activeTabs.length > 1 && (
                <button
                  onClick={(e) => handleTabClose(e, tab.id)}
                  className={cn(
                    'ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[#3e3e42]',
                    isActive ? 'text-[#cccccc]' : 'text-[#969696]'
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <Suspense fallback={<LoadingPlaceholder text="Loading..." />}>
            {activeTab === 'editor' && activeTabs.includes('editor') && (
              <div className="h-full">
                <CodeEditor />
              </div>
            )}
            {activeTab === 'preview' && activeTabs.includes('preview') && (
              <div className="h-full">
                <VideoPreview />
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

