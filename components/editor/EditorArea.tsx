'use client';

import { lazy, Suspense, useState, useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Code2, Monitor, X, GripVertical } from 'lucide-react';
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

// 可拖动的标签组件
function DraggableTab({ 
  tab, 
  isActive, 
  onClick, 
  onClose 
}: { 
  tab: Tab; 
  isActive: boolean; 
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
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
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onClick}
      className={cn(
        'h-full px-4 flex items-center gap-2 border-r border-[#3e3e42] transition-colors group relative',
        isActive
          ? 'bg-[#1e1e1e] text-[#cccccc]'
          : 'bg-[#2d2d30] text-[#969696] hover:bg-[#37373d] hover:text-[#cccccc]'
      )}
    >
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#007acc] z-10" />
      )}
      {/* 拖动句柄 */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3 text-[#969696]" />
      </div>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm whitespace-nowrap">{tab.label}</span>
      <button
        onClick={onClose}
        className={cn(
          'ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[#3e3e42] flex-shrink-0',
          isActive ? 'text-[#cccccc]' : 'text-[#969696]'
        )}
      >
        <X className="w-3 h-3" />
      </button>
    </button>
  );
}

export default function EditorArea({ activeTabs, onTabChange, onTabClose, defaultActiveTab }: EditorAreaProps) {
  // 默认激活编辑器标签
  const [activeTab, setActiveTab] = useState<TabId>(defaultActiveTab || 'editor');
  const [orderedTabs, setOrderedTabs] = useState<TabId[]>(activeTabs.length > 0 ? activeTabs : ['editor']);
  const [editorSize, setEditorSize] = useState(60); // 编辑器占比（百分比）- 默认60%（编辑器在上）
  
  // 同步 orderedTabs 与 activeTabs
  useEffect(() => {
    if (activeTabs.length === 0) {
      setOrderedTabs(['editor']);
      setActiveTab('editor');
      return;
    }
    
    // 保持 activeTabs 的顺序，但保留 orderedTabs 中已有的顺序
    const newOrdered = activeTabs.filter(id => orderedTabs.includes(id));
    const newTabs = activeTabs.filter(id => !orderedTabs.includes(id));
    const updated = [...newOrdered, ...newTabs];
    
    // 确保 updated 不为空
    if (updated.length > 0) {
      setOrderedTabs(updated);
    } else {
      // 如果更新后为空，使用 activeTabs
      setOrderedTabs(activeTabs);
    }
  }, [activeTabs]); // 移除 orderedTabs 依赖，避免循环更新
  
  // 当activeTabs变化时，更新activeTab
  useEffect(() => {
    if (activeTabs.length === 0) {
      // 如果 activeTabs 为空，设置默认标签
      setActiveTab('editor');
      return;
    }
    
    // 确保 activeTab 在 activeTabs 中
    if (!activeTabs.includes(activeTab)) {
      // 如果当前激活的标签不在 activeTabs 中，切换到第一个可用标签
      const firstTab = activeTabs[0];
      if (firstTab) {
        setActiveTab(firstTab);
      }
    } else if (defaultActiveTab && activeTabs.includes(defaultActiveTab) && activeTab !== defaultActiveTab) {
      // 如果 defaultActiveTab 存在且在 activeTabs 中，切换到它
      setActiveTab(defaultActiveTab);
    }
  }, [activeTabs, defaultActiveTab]); // 移除 activeTab 依赖，避免循环更新

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedTabs((items) => {
        const oldIndex = items.indexOf(active.id as TabId);
        const newIndex = items.indexOf(over.id as TabId);
        
        // 边界检查：确保索引有效
        if (oldIndex === -1 || newIndex === -1) {
          console.warn('Invalid drag indices:', { oldIndex, newIndex, items });
          return items;
        }
        
        try {
          const newOrder = arrayMove(items, oldIndex, newIndex);
          // 同步到父组件
          onTabChange(newOrder);
          return newOrder;
        } catch (error) {
          console.error('Error in arrayMove:', error);
          return items;
        }
      });
    }
  };

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
      
      // 边界检查：确保新数组不为空
      if (newTabs.length === 0) {
        console.warn('Cannot close last tab');
        return;
      }
      
      onTabChange(newTabs);
      setOrderedTabs(orderedTabs.filter(id => id !== tabId));
      
      if (activeTab === tabId) {
        // 确保新激活的标签存在
        const nextTab = newTabs[0];
        if (nextTab) {
          setActiveTab(nextTab);
        } else {
          // 如果新数组为空，设置默认标签
          setActiveTab('editor');
        }
      }
    }
  };

  const hasEditor = activeTabs.includes('editor');
  const hasPreview = activeTabs.includes('preview');
  const showSplit = hasEditor && hasPreview;

  // 获取当前显示的标签（按顺序），确保不为空
  const visibleTabs = orderedTabs.filter(id => activeTabs.includes(id));
  
  // 如果 visibleTabs 为空，使用 activeTabs 作为后备
  const safeVisibleTabs: TabId[] = visibleTabs.length > 0 
    ? visibleTabs 
    : (activeTabs.length > 0 ? activeTabs : ['editor']);

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* 标签栏 - VSCode 风格，支持拖动，使用相对定位 */}
      <div className="h-9 flex-shrink-0 bg-[#2d2d30] border-b border-[#3e3e42] flex items-end overflow-x-auto relative z-10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={safeVisibleTabs}
            strategy={horizontalListSortingStrategy}
          >
            {safeVisibleTabs.map((tabId) => {
              const tab = tabs.find(t => t.id === tabId);
              if (!tab) return null;
              
              const isActive = activeTab === tabId;
              
              return (
                <DraggableTab
                  key={tabId}
                  tab={tab}
                  isActive={isActive}
                  onClick={() => handleTabClick(tabId)}
                  onClose={(e) => handleTabClose(e, tabId)}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      {/* 内容区域 - 默认垂直布局（编辑器在上，预览在下） */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {showSplit ? (
          // 两个标签都打开 - 使用 Allotment 垂直分割（编辑器在上，预览在下）
          <Allotment
            vertical
            proportionalLayout={false}
            onChange={(sizes) => {
              if (sizes.length === 2) {
                const total = sizes[0] + sizes[1];
                setEditorSize((sizes[0] / total) * 100);
              }
            }}
          >
            <Allotment.Pane 
              minSize={200}
              preferredSize={editorSize ? `${editorSize}%` : '60%'}
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
              preferredSize={editorSize ? `${100 - editorSize}%` : '40%'}
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
