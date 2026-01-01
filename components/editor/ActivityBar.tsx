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
  tooltip: string;
}> = [
  { id: 'ai', icon: MessageSquare, label: 'AI助手', tooltip: 'AI Assistant' },
  { id: 'assets', icon: FolderOpen, label: '资源', tooltip: 'Assets' },
  { id: 'prompt', icon: FileText, label: '模板', tooltip: 'Prompt Template' },
  { id: 'editor', icon: Code2, label: '代码', tooltip: 'Code Editor' },
  { id: 'preview', icon: Monitor, label: '预览', tooltip: 'Preview' },
];

export default function ActivityBar({ activeActivity, onActivityChange }: ActivityBarProps) {
  return (
    <div className="h-full w-full bg-[#2d2d30] border-r border-[#3e3e42] flex flex-col items-center py-2 overflow-y-auto">
      {activities.map((activity) => {
        const Icon = activity.icon;
        const isActive = activeActivity === activity.id;
        
        return (
          <button
            key={activity.id}
            onClick={() => onActivityChange(activity.id)}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded mb-1 transition-colors relative group',
              isActive
                ? 'bg-[#37373d] text-white'
                : 'text-[#cccccc] hover:bg-[#37373d] hover:text-white'
            )}
            title={activity.tooltip}
          >
            <Icon className="w-5 h-5" />
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#007acc]" />
            )}
          </button>
        );
      })}
      
      {/* 设置按钮 - 固定在底部 */}
      <div className="mt-auto">
        <button
          onClick={() => onActivityChange('settings')}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded transition-colors relative group',
            activeActivity === 'settings'
              ? 'bg-[#37373d] text-white'
              : 'text-[#cccccc] hover:bg-[#37373d] hover:text-white'
          )}
          title="Settings"
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

