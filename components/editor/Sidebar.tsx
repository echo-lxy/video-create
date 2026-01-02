'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ActivityId } from './ActivityBar';

// 懒加载侧边栏组件
const AiAssistant = dynamic(() => import('./AiAssistant'), {
  ssr: false,
  loading: () => <LoadingPlaceholder text="加载 AI 助手..." />
});

const AssetsManager = dynamic(() => import('./AssetsManager'), {
  ssr: false,
  loading: () => <LoadingPlaceholder text="加载资源管理..." />
});

const PromptTemplate = dynamic(() => import('./PromptTemplate'), {
  ssr: false,
  loading: () => <LoadingPlaceholder text="加载模板..." />
});

const Settings = dynamic(() => import('./Settings'), {
  ssr: false,
  loading: () => <LoadingPlaceholder text="加载设置..." />
});

interface SidebarProps {
  activeActivity: ActivityId | null;
}

function LoadingPlaceholder({ text }: { text: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#252526]">
      <div className="text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#007acc]" />
        <p className="text-xs text-[#969696]">{text}</p>
      </div>
    </div>
  );
}

export default function Sidebar({ activeActivity }: SidebarProps) {
  const renderContent = () => {
    switch (activeActivity) {
      case 'ai':
        return (
          <Suspense fallback={<LoadingPlaceholder text="加载 AI 助手..." />}>
            <AiAssistant />
          </Suspense>
        );
      case 'assets':
        return (
          <Suspense fallback={<LoadingPlaceholder text="加载资源管理..." />}>
            <AssetsManager />
          </Suspense>
        );
      case 'prompt':
        return (
          <Suspense fallback={<LoadingPlaceholder text="加载模板..." />}>
            <PromptTemplate />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingPlaceholder text="加载设置..." />}>
            <Settings />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-[#252526] border-r border-[#3e3e42] overflow-hidden">
      {renderContent()}
    </div>
  );
}
