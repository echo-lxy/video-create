'use client';

import { lazy, Suspense } from 'react';
import { ActivityId } from './ActivityBar';
import { Loader2 } from 'lucide-react';

// 懒加载组件
const AIChatPanel = lazy(() => import('@/components/ai/AIChatPanel').then(m => ({ default: m.default })));
const AssetManager = lazy(() => import('@/components/assets/AssetManager').then(m => ({ default: m.default })));
const PromptTemplateEditor = lazy(() => import('@/components/prompt/PromptTemplateEditor').then(m => ({ default: m.default })));

interface SidebarProps {
  activeActivity: ActivityId | null;
  width: number;
}

const LoadingPlaceholder = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
    <div className="text-center text-[#cccccc] text-sm">
      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
      <p>{text}</p>
    </div>
  </div>
);

export default function Sidebar({ activeActivity, width }: SidebarProps) {
  if (!activeActivity || !['ai', 'assets', 'prompt'].includes(activeActivity)) {
    return null;
  }

  return (
    <div className="w-full h-full bg-[#252526] border-r border-[#3e3e42] overflow-hidden">
      <Suspense fallback={<LoadingPlaceholder text="Loading..." />}>
        {activeActivity === 'ai' && <AIChatPanel />}
        {activeActivity === 'assets' && <AssetManager />}
        {activeActivity === 'prompt' && <PromptTemplateEditor />}
      </Suspense>
    </div>
  );
}

