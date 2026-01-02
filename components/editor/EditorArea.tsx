'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Code2, Monitor, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 动态导入组件，避免SSR问题
const CodeEditor = dynamic(() => import('./CodeEditor'), { 
  ssr: false,
  loading: () => <LoadingPlaceholder text="加载代码编辑器..." />
});

const VideoPreview = dynamic(() => import('./VideoPreview'), { 
  ssr: false,
  loading: () => <LoadingPlaceholder text="加载视频预览..." />
});

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
}

function LoadingPlaceholder({ text }: { text: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-center text-[#cccccc] text-sm">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p>{text}</p>
      </div>
    </div>
  );
}

// 可拖动的标签组件
function DraggableTab({ 
  tab, 
  isActive, 
  onClick, 
  onClose,
  showClose
}: { 
  tab: Tab; 
  isActive: boolean; 
  onClick: () => void;
  onClose: () => void;
  showClose: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = tab.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'h-9 px-3 flex items-center gap-2 border-r border-[#3e3e42] cursor-pointer group relative',
        isActive
          ? 'bg-[#1e1e1e] text-[#cccccc]'
          : 'bg-[#2d2d30] text-[#969696] hover:bg-[#37373d]'
      )}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#007acc]" />
      )}
      
      {/* 拖动句柄 */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50" />
      </div>
      
      <Icon className="w-4 h-4" />
      <span className="text-sm">{tab.label}</span>
      
      {showClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-1 p-0.5 rounded hover:bg-[#3e3e42] opacity-0 group-hover:opacity-100"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function EditorArea({ activeTabs, onTabChange }: EditorAreaProps) {
  const [activeTab, setActiveTab] = useState<TabId>(activeTabs[0] || 'editor');
  const [mounted, setMounted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 确保activeTab在activeTabs中
    if (!activeTabs.includes(activeTab) && activeTabs.length > 0) {
      setActiveTab(activeTabs[0]);
    }
  }, [activeTabs, activeTab]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activeTabs.indexOf(active.id as TabId);
      const newIndex = activeTabs.indexOf(over.id as TabId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(activeTabs, oldIndex, newIndex);
        onTabChange(newOrder);
      }
    }
  };

  const handleTabClose = (tabId: TabId) => {
    if (activeTabs.length > 1) {
      const newTabs = activeTabs.filter(id => id !== tabId);
      onTabChange(newTabs);
      
      if (activeTab === tabId) {
        setActiveTab(newTabs[0]);
      }
    }
  };

  if (!mounted) {
    return <LoadingPlaceholder text="初始化..." />;
  }

  const showSplit = activeTabs.includes('editor') && activeTabs.includes('preview');

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* 标签栏 */}
      <div className="h-9 flex-shrink-0 bg-[#2d2d30] border-b border-[#3e3e42] flex overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeTabs}
            strategy={horizontalListSortingStrategy}
          >
            {activeTabs.map((tabId) => {
              const tab = tabs.find(t => t.id === tabId);
              if (!tab) return null;
              
              return (
                <DraggableTab
                  key={tabId}
                  tab={tab}
                  isActive={activeTab === tabId}
                  onClick={() => setActiveTab(tabId)}
                  onClose={() => handleTabClose(tabId)}
                  showClose={activeTabs.length > 1}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {showSplit ? (
          <Allotment vertical>
            <Allotment.Pane minSize={200}>
              <Suspense fallback={<LoadingPlaceholder text="加载代码编辑器..." />}>
                <CodeEditor />
              </Suspense>
            </Allotment.Pane>
            <Allotment.Pane minSize={200}>
              <Suspense fallback={<LoadingPlaceholder text="加载视频预览..." />}>
                <VideoPreview />
              </Suspense>
            </Allotment.Pane>
          </Allotment>
        ) : (
          <Suspense fallback={<LoadingPlaceholder text="加载中..." />}>
            {activeTab === 'editor' ? <CodeEditor /> : <VideoPreview />}
          </Suspense>
        )}
      </div>
    </div>
  );
}
