'use client';

import { lazy, Suspense, useState, useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Code2, Monitor, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { useEditorStore } from '@/lib/store/editor-store';

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
  <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
    <div className="text-center text-[#cccccc] text-sm">
      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
      <p>{text}</p>
    </div>
  </div>
);

export default function EditorArea({ activeTabs, onTabChange, onTabClose, defaultActiveTab }: EditorAreaProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultActiveTab || activeTabs[0] || 'preview');
  const [editorSize, setEditorSize] = useState(50); // 编辑器占比（百分比）
  const [previewSize, setPreviewSize] = useState(50); // 预览占比（百分比）
  const [splitDirection, setSplitDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  
  // 当activeTabs变化时，更新activeTab
  useEffect(() => {
    if (activeTabs.length > 0) {
      if (!activeTabs.includes(activeTab)) {
        setActiveTab(activeTabs[0]);
      } else if (defaultActiveTab && activeTabs.includes(defaultActiveTab)) {
        setActiveTab(defaultActiveTab);
      }
    }
  }, [activeTabs, defaultActiveTab, activeTab]);

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

  const hasEditor = activeTabs.includes('editor');
  const hasPreview = activeTabs.includes('preview');
  const showSplit = hasEditor && hasPreview;

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* 标签栏 - VSCode 风格 */}
      <div className="h-9 flex-shrink-0 bg-[#2d2d30] border-b border-[#3e3e42] flex items-end overflow-x-auto">
        {tabs.map((tab) => {
          if (!activeTabs.includes(tab.id)) return null;
          
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'h-full px-4 flex items-center gap-2 border-r border-[#3e3e42] transition-colors group relative',
                isActive
                  ? 'bg-[#1e1e1e] text-[#cccccc]'
                  : 'bg-[#2d2d30] text-[#969696] hover:bg-[#37373d] hover:text-[#cccccc]'
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#007acc]" />
              )}
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm whitespace-nowrap">{tab.label}</span>
              {activeTabs.length > 1 && (
                <button
                  onClick={(e) => handleTabClose(e, tab.id)}
                  className={cn(
                    'ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[#3e3e42] flex-shrink-0',
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

      {/* 内容区域 - 支持拖动分割 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {showSplit ? (
          // 两个标签都打开 - 使用 Allotment 分割
          <Allotment
            proportionalLayout={false}
            onChange={(sizes) => {
              if (sizes.length === 2) {
                const total = sizes[0] + sizes[1];
                setEditorSize((sizes[0] / total) * 100);
                setPreviewSize((sizes[1] / total) * 100);
              }
            }}
          >
            <Allotment.Pane 
              minSize={200}
              preferredSize={editorSize ? `${editorSize}%` : '50%'}
            >
              <div className="w-full h-full">
                <ErrorBoundary
                  fallback={<LoadingPlaceholder text="Code Editor Error" />}
                  onError={(error) => console.error('CodeEditor error:', error)}
                >
                  <CodeEditor />
                </ErrorBoundary>
              </div>
            </Allotment.Pane>
            <Allotment.Pane 
              minSize={200}
              preferredSize={previewSize ? `${previewSize}%` : '50%'}
            >
              <div className="w-full h-full">
                <ErrorBoundary
                  fallback={<LoadingPlaceholder text="Video Preview Error" />}
                  onError={(error) => console.error('VideoPreview error:', error)}
                >
                  <VideoPreview />
                </ErrorBoundary>
              </div>
            </Allotment.Pane>
          </Allotment>
        ) : (
          // 只有一个标签打开 - 全屏显示
          <Suspense fallback={<LoadingPlaceholder text="Loading..." />}>
            {activeTab === 'editor' && hasEditor && (
              <div className="w-full h-full">
                <ErrorBoundary
                  fallback={<LoadingPlaceholder text="Code Editor Error" />}
                  onError={(error) => console.error('CodeEditor error:', error)}
                >
                  <CodeEditor />
                </ErrorBoundary>
              </div>
            )}
            {activeTab === 'preview' && hasPreview && (
              <div className="w-full h-full">
                <ErrorBoundary
                  fallback={<LoadingPlaceholder text="Video Preview Error" />}
                  onError={(error) => console.error('VideoPreview error:', error)}
                >
                  <VideoPreview />
                </ErrorBoundary>
              </div>
            )}
          </Suspense>
        )}
      </div>
    </div>
  );
}
