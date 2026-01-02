'use client';

import { MessageSquare, FolderOpen, FileText, Code2, Monitor, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ActivityId = 'ai' | 'assets' | 'prompt' | 'editor' | 'preview' | 'settings';

interface ActivityBarProps {
  activeActivity: ActivityId | null;
  onActivityChange: (activity: ActivityId) => void;
}

const activities: Array<{
  id: ActivityId;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = [
  { id: 'ai', icon: MessageSquare, label: 'AI助手' },
  { id: 'assets', icon: FolderOpen, label: '资源' },
  { id: 'prompt', icon: FileText, label: '模板' },
  { id: 'editor', icon: Code2, label: '代码' },
  { id: 'preview', icon: Monitor, label: '预览' },
];

export default function ActivityBar({ activeActivity, onActivityChange }: ActivityBarProps) {
  return (
    <div className="h-full w-full flex flex-col items-center py-2 overflow-y-auto">
      {/* 主要活动 */}
      {activities.map((activity) => {
        const Icon = activity.icon;
        const isActive = activeActivity === activity.id;
        
        return (
          <button
            key={activity.id}
            onClick={() => onActivityChange(activity.id)}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded mb-1 transition-colors relative',
              isActive
                ? 'bg-[#37373d] text-white'
                : 'text-[#969696] hover:bg-[#37373d] hover:text-white'
            )}
            title={activity.label}
          >
            <Icon className="w-5 h-5" />
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#007acc]" />
            )}
          </button>
        );
      })}
      
      {/* 设置按钮 - 底部 */}
      <div className="mt-auto">
        <button
          onClick={() => onActivityChange('settings')}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded transition-colors relative',
            activeActivity === 'settings'
              ? 'bg-[#37373d] text-white'
              : 'text-[#969696] hover:bg-[#37373d] hover:text-white'
          )}
          title="设置"
        >
          <Settings className="w-5 h-5" />
          {activeActivity === 'settings' && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#007acc]" />
          )}
        </button>
      </div>
    </div>
  );
}
