'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { useAIConfigStore } from '@/lib/store/ai-config-store';
import { useCodeStore } from '@/lib/store/code-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Settings, Loader2 } from 'lucide-react';
import AIConfigDialog from './AIConfigDialog';

export default function AIChatPanel() {
  const { getActiveProvider } = useAIConfigStore();
  const { code, setCode } = useCodeStore();
  const [showConfig, setShowConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeProvider = getActiveProvider();

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
      body: {
        code,
        provider: activeProvider,
      },
      onFinish: (message) => {
        // 提取代码块并更新
        const codeMatch = message.content.match(/```(?:tsx|typescript)\n([\s\S]*?)```/);
        if (codeMatch && codeMatch[1]) {
          setCode(codeMatch[1].trim());
        }
      },
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeProvider) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#252526] p-8 text-center">
        <Bot className="w-16 h-16 text-[#969696] mb-4" />
        <h3 className="text-lg font-semibold text-[#cccccc] mb-2">
          No AI Provider Configured
        </h3>
        <p className="text-sm text-[#969696] mb-6">
          Configure an AI provider to start using AI assistance
        </p>
        <Button onClick={() => setShowConfig(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Configure AI
        </Button>
        <AIConfigDialog open={showConfig} onOpenChange={setShowConfig} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#252526]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#007acc]" />
          <h3 className="text-sm font-medium text-[#cccccc]">AI Assistant</h3>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setShowConfig(true)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[#969696] text-sm mt-8">
            <Bot className="w-12 h-12 mx-auto mb-2 text-[#969696]" />
            <p>Ask me to help you create or modify video code</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007acc] flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-[#007acc] text-white'
                  : 'bg-[#37373d] text-[#cccccc]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#37373d] flex items-center justify-center">
                <User className="w-4 h-4 text-[#cccccc]" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007acc] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[#37373d] rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#969696]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#3e3e42]">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask AI to modify your video code..."
            className="flex-1 min-h-[60px] resize-none bg-[#3c3c3c] border-[#3e3e42] text-[#cccccc]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <AIConfigDialog open={showConfig} onOpenChange={setShowConfig} />
    </div>
  );
}

