import { create } from 'zustand';
import { ActivityId } from '@/components/editor/ActivityBar';

export interface EditorState {
  // 布局状态
  activeActivity: ActivityId | null;
  sidebarWidth: number;
  panelHeight: number;
  activeTabs: Array<'editor' | 'preview'>;
  
  // 编译状态
  isCompiling: boolean;
  compilationError: string | null;
  
  // Actions
  setActiveActivity: (activity: ActivityId | null) => void;
  setSidebarWidth: (width: number) => void;
  setPanelHeight: (height: number) => void;
  setActiveTabs: (tabs: Array<'editor' | 'preview'>) => void;
  setCompiling: (isCompiling: boolean) => void;
  setCompilationError: (error: string | null) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  // 布局状态 - 默认显示预览，侧边栏显示AI助手
  activeActivity: 'ai',
  sidebarWidth: 320,
  panelHeight: 200,
  activeTabs: ['preview'],
  
  // 编译状态
  isCompiling: false,
  compilationError: null,
  
  // Actions
  setActiveActivity: (activity) => set({ activeActivity: activity }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setPanelHeight: (height) => set({ panelHeight: height }),
  setActiveTabs: (tabs) => set({ activeTabs: tabs }),
  setCompiling: (isCompiling) => set({ isCompiling }),
  setCompilationError: (error) => set({ compilationError: error }),
}));

