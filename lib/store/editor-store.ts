import { create } from 'zustand';

export interface EditorState {
  showAIPanel: boolean;
  showCodeEditor: boolean;
  isCompiling: boolean;
  compilationError: string | null;
  toggleAIPanel: () => void;
  toggleCodeEditor: () => void;
  setCompiling: (isCompiling: boolean) => void;
  setCompilationError: (error: string | null) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  showAIPanel: true,
  showCodeEditor: true,
  isCompiling: false,
  compilationError: null,
  toggleAIPanel: () => set((state) => ({ showAIPanel: !state.showAIPanel })),
  toggleCodeEditor: () =>
    set((state) => ({ showCodeEditor: !state.showCodeEditor })),
  setCompiling: (isCompiling) => set({ isCompiling }),
  setCompilationError: (error) => set({ compilationError: error }),
}));

