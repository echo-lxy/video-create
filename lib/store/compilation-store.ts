/**
 * 编译状态存储
 * 用于存储编译结果，供 AI 工具读取
 */

import { create } from 'zustand';

export interface CompilationResult {
  code: string;
  success: boolean;
  errors: string[];
  warnings: string[];
  timestamp: number;
}

interface CompilationState {
  lastResult: CompilationResult | null;
  setCompilationResult: (result: Omit<CompilationResult, 'timestamp'>) => void;
  getLastResult: (code: string) => CompilationResult | null;
  clearResult: () => void;
}

export const useCompilationStore = create<CompilationState>((set, get) => ({
  lastResult: null,
  
  setCompilationResult: (result) => {
    set({
      lastResult: {
        ...result,
        timestamp: Date.now(),
      },
    });
  },
  
  getLastResult: (code: string) => {
    const { lastResult } = get();
    // 如果代码匹配且结果在 5 秒内，返回结果
    if (lastResult && lastResult.code === code && Date.now() - lastResult.timestamp < 5000) {
      return lastResult;
    }
    return null;
  },
  
  clearResult: () => {
    set({ lastResult: null });
  },
}));

