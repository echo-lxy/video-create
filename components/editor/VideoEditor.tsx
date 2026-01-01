'use client';

import { useState } from 'react';
import { useEditorStore } from '@/lib/store/editor-store';
import { Button } from '@/components/ui/button';
import { Code2, MessageSquare, Play } from 'lucide-react';
import AIChatPanel from '@/components/ai/AIChatPanel';
import CodeEditor from './CodeEditor';
import VideoPreview from './VideoPreview';

export default function VideoEditor() {
  const { showAIPanel, showCodeEditor, toggleAIPanel, toggleCodeEditor } =
    useEditorStore();

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Top Toolbar */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Play className="w-6 h-6 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-100">
            AI Video Code Generator
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showAIPanel ? 'default' : 'outline'}
            onClick={toggleAIPanel}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Chat
          </Button>
          <Button
            size="sm"
            variant={showCodeEditor ? 'default' : 'outline'}
            onClick={toggleCodeEditor}
          >
            <Code2 className="w-4 h-4 mr-2" />
            Code Editor
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: AI Chat Panel */}
        {showAIPanel && (
          <div className="w-96 border-r border-gray-800 flex-shrink-0">
            <AIChatPanel />
          </div>
        )}

        {/* Center: Code Editor or Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {showCodeEditor && (
            <div className="h-1/2 border-b border-gray-800">
              <CodeEditor />
            </div>
          )}
          <div className={showCodeEditor ? 'h-1/2' : 'h-full'}>
            <VideoPreview />
          </div>
        </div>
      </div>
    </div>
  );
}

