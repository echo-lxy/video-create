'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Send, Sparkles, Loader2, Copy, Check, Wand2, FileCode, Image, Music, Video as VideoIcon, CheckCircle2, XCircle, Search, Settings, Wrench, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useCodeStore } from '@/lib/store/code-store';
import { useAssetsStore } from '@/lib/store/assets-store';
import { useAIConfigStore } from '@/lib/store/ai-config-store';
import { useEditorStore } from '@/lib/store/editor-store';

interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: any;
  result?: any;
}

export default function AiAssistant() {
  const { code, setCode } = useCodeStore();
  const { assets } = useAssetsStore();
  const { getActiveProvider } = useAIConfigStore();
  const { setActiveActivity } = useEditorStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeProvider = getActiveProvider();

  // 格式化资源数据供 API 使用
  const formattedAssets = assets.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    url: a.url,
  }));

  // 使用 Vercel AI SDK 的 useChat hook
  const { videoConfig } = useCodeStore();
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
    error,
    setMessages,
  } = useChat({
    api: '/api/chat',
    body: {
      code,
      assets: formattedAssets,
      provider: activeProvider || null,
      videoConfig,
    },
    onToolCall: ({ toolCall }) => {
      // 记录工具调用
      setToolCalls(prev => [...prev, {
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
        args: toolCall.args,
      }]);
    },
    onFinish: async (message) => {
      // 检查是否有工具调用结果需要处理
      if (message.toolInvocations) {
        for (const toolInvocation of message.toolInvocations) {
          await handleToolResult(toolInvocation);
        }
      }
    },
  });

  // 处理工具调用结果
  const handleToolResult = async (toolInvocation: any) => {
    const { toolName, toolCallId, result } = toolInvocation;

    // 更新工具调用状态
    setToolCalls(prev => prev.map(tc => 
      tc.toolCallId === toolCallId 
        ? { ...tc, result }
        : tc
    ));

    switch (toolName) {
      case 'modifyCode':
        // 代码已生成，如果验证通过则自动应用
        if (result.success && result.code) {
          // 不立即应用，等待用户确认或 AI 验证通过
        }
        break;
      
      case 'compileAndValidate':
        // 编译验证结果
        if (result.success) {
          // 验证通过，可以应用代码
          console.log('✅ 代码验证通过');
        } else {
          // 验证失败，AI 应该自动修复
          console.log('❌ 代码验证失败:', result.errors);
        }
        break;
      
      case 'autoFixCode':
        // 自动修复分析结果
        if (result.fixPrompt) {
          // AI 会基于 fixPrompt 自动修复
          console.log('🔧 已分析错误，准备修复');
        }
        break;
      
      case 'generateCode':
        // 代码生成提示词已准备
        if (result.success && result.assets) {
          console.log(`📝 代码生成提示词已准备，包含 ${result.assets.length} 个资源`);
        }
        break;
      
      case 'optimizeCodeIterative':
        // 优化提示词已准备
        if (result.success) {
          console.log('⚡ 优化提示词已准备');
        }
        break;
      
      case 'applyCode':
        if (result.success && result.code) {
          setCode(result.code);
        }
        break;
      
      case 'searchAssets':
        // 资源搜索在前端完成，这里只是记录
        break;
      
      case 'useAsset':
        if (result.success && result.code) {
          // 可以提示用户资源已使用
        }
        break;
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, toolCalls]);

  // 处理发送消息
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 清空之前的工具调用
    setToolCalls([]);

    handleSubmit(e);
  };

  // 应用代码
  const handleApplyCode = (codeToApply: string) => {
    // 提取代码块
    const codeMatch = codeToApply.match(/```(?:typescript|ts|tsx)?\n([\s\S]*?)\n```/);
    if (codeMatch) {
      setCode(codeMatch[1].trim());
    } else {
      // 如果没有代码块，直接使用整个内容
      setCode(codeToApply.trim());
    }
  };

  // 复制内容
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 获取工具图标
  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'modifyCode':
      case 'applyCode':
        return <FileCode className="w-3.5 h-3.5" />;
      case 'searchAssets':
      case 'useAsset':
        return <Image className="w-3.5 h-3.5" />;
      default:
        return <Wand2 className="w-3.5 h-3.5" />;
    }
  };

  // 检查是否有配置
  if (!activeProvider) {
    return (
      <>
        <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
          <div className="flex-shrink-0 h-12 bg-[#2d2d30] border-b border-[#3e3e42] px-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#007acc]" />
            <span className="text-sm font-medium text-[#cccccc]">AI 助手</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <Sparkles className="w-16 h-16 text-[#3e3e42] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#cccccc] mb-2">
                未配置 AI 提供商
              </h3>
              <p className="text-sm text-[#969696] mb-6">
                请先配置 AI 提供商才能使用 AI 助手功能
              </p>
              <p className="text-xs text-[#5a5a5a] mb-6">
                支持 OpenAI 和 Anthropic (Claude)
              </p>
              <button
                onClick={() => setActiveActivity('settings')}
                className="px-4 py-2 bg-[#007acc] hover:bg-[#005a9e] text-white rounded text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Settings className="w-4 h-4" />
                <span>前往设置配置</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
        {/* 标题栏 */}
        <div className="flex-shrink-0 h-12 bg-[#2d2d30] border-b border-[#3e3e42] px-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#007acc]" />
          <span className="text-sm font-medium text-[#cccccc]">AI 助手</span>
          <div className="flex-1" />
          {activeProvider && (
            <span className="text-xs text-[#969696] bg-[#1e1e1e] px-2 py-0.5 rounded">
              {activeProvider.name}
            </span>
          )}
          <button
            onClick={() => setActiveActivity('settings')}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#3e3e42] text-[#969696] hover:text-[#cccccc] transition-colors"
            title="打开设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 初始欢迎消息 */}
        {messages.length === 0 && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#007acc] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[80%] rounded-lg px-4 py-3 bg-[#2d2d30] text-[#cccccc]">
              <div className="text-sm whitespace-pre-wrap">
                你好！我是 AI 视频代码助手。我可以帮你：{'\n\n'}
                • 生成 Remotion 视频代码{'\n'}
                • 自动修改和优化代码{'\n'}
                • 智能搜索和使用资源{'\n'}
                • 代码分析和性能优化{'\n'}
                • 错误检测和自动修复{'\n'}
                • 解答技术问题{'\n'}
                • 提供创意建议{'\n\n'}
                请描述你想要创建的视频效果！我可以帮你分析代码、优化性能、推荐资源等。
              </div>
            </div>
          </div>
        )}

        {/* 消息列表 */}
        {messages.map((message) => {
          const toolCall = toolCalls.find(tc => 
            messages.findIndex(m => m.id === message.id) !== -1
          );

          return (
            <div key={message.id} className="space-y-2">
              <div
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#007acc] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-3',
                    message.role === 'user'
                      ? 'bg-[#007acc] text-white'
                      : 'bg-[#2d2d30] text-[#cccccc]'
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>

                  {/* 工具调用显示 */}
                  {message.toolInvocations && message.toolInvocations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#3e3e42] space-y-2">
                      <div className="text-xs text-[#969696] mb-1">工具调用：</div>
                      {message.toolInvocations.map((toolInvocation: any) => {
                        const isComplete = toolInvocation.state === 'result';
                        const toolLabels: Record<string, string> = {
                          modifyCode: '生成代码',
                          analyzeCode: '分析代码',
                          optimizeCode: '优化代码',
                          searchAssets: '搜索资源',
                          recommendAssets: '推荐资源',
                          useAsset: '使用资源',
                          applyCode: '应用代码',
                          reviewCode: '审查代码',
                          fixErrors: '修复错误',
                          // 新增工具
                          compileAndValidate: '验证代码',
                          autoFixCode: '自动修复',
                          generateCode: '智能生成',
                          optimizeCodeIterative: '迭代优化',
                        };

                        const toolIcons: Record<string, any> = {
                          modifyCode: FileCode,
                          analyzeCode: Wand2,
                          optimizeCode: Sparkles,
                          searchAssets: Search,
                          recommendAssets: Sparkles,
                          useAsset: Image,
                          // 新增工具图标
                          compileAndValidate: CheckCircle2,
                          autoFixCode: Wrench,
                          generateCode: Sparkles,
                          optimizeCodeIterative: Zap,
                          applyCode: CheckCircle2,
                          reviewCode: FileCode,
                          fixErrors: XCircle,
                        };

                        const Icon = toolIcons[toolInvocation.toolName] || Wand2;

                        return (
                          <div
                            key={toolInvocation.toolCallId}
                            className={cn(
                              'flex items-center gap-2 text-xs px-2 py-1.5 rounded transition-colors',
                              isComplete 
                                ? 'bg-green-900/20 text-green-400 border border-green-700/30' 
                                : 'bg-[#37373d] text-[#969696] border border-[#3e3e42]'
                            )}
                          >
                            <div className={cn(
                              'flex items-center justify-center w-5 h-5 rounded',
                              isComplete ? 'bg-green-500/20' : 'bg-[#007acc]/20'
                            )}>
                              {isComplete ? (
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              ) : (
                                <Loader2 className="w-3 h-3 animate-spin text-[#007acc]" />
                              )}
                            </div>
                            <Icon className="w-3 h-3" />
                            <span className="font-medium">
                              {toolLabels[toolInvocation.toolName] || toolInvocation.toolName}
                            </span>
                            {toolInvocation.result && (
                              <div className="text-xs text-[#969696] mt-1 space-y-1">
                                {toolInvocation.result.assets && (
                                  <div className="flex items-center gap-1">
                                    <Image className="w-3 h-3" />
                                    ({toolInvocation.result.count || 0} 个结果)
                                  </div>
                                )}
                                {toolInvocation.result.recommendations && (
                                  <div className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    {toolInvocation.result.recommendations}
                                  </div>
                                )}
                                {toolInvocation.result.optimizationType && (
                                  <div className="flex items-center gap-1">
                                    <Wand2 className="w-3 h-3" />
                                    ({toolInvocation.result.optimizationType})
                                  </div>
                                )}
                                {/* 编译验证结果 */}
                                {toolInvocation.result.isValid !== undefined && (
                                  <div className={cn(
                                    'flex items-center gap-1',
                                    toolInvocation.result.isValid ? 'text-green-400' : 'text-red-400'
                                  )}>
                                    <CheckCircle2 className="w-3 h-3" />
                                    {toolInvocation.result.isValid ? '验证通过' : `验证失败: ${toolInvocation.result.errors?.length || 0} 个错误`}
                                  </div>
                                )}
                                {toolInvocation.result.errors && toolInvocation.result.errors.length > 0 && (
                                  <div className="text-red-400 text-xs">
                                    {toolInvocation.result.errors.slice(0, 2).map((e: string, i: number) => (
                                      <div key={i}>• {e}</div>
                                    ))}
                                    {toolInvocation.result.errors.length > 2 && (
                                      <div>...还有 {toolInvocation.result.errors.length - 2} 个错误</div>
                                    )}
                                  </div>
                                )}
                                {/* 自动修复结果 */}
                                {toolInvocation.result.fixPrompt && (
                                  <div className="text-blue-400 text-xs">
                                    🔧 已生成修复提示词，正在自动修复...
                                  </div>
                                )}
                                {toolInvocation.result.iterations !== undefined && (
                                  <div className="text-xs">
                                    迭代次数: {toolInvocation.result.iterations}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 操作按钮 */}
                  {message.role === 'assistant' && message.content && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-[#3e3e42]">
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="text-xs px-2 py-1 rounded bg-[#37373d] hover:bg-[#3e3e42] text-[#cccccc] transition-colors flex items-center gap-1"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>复制</span>
                          </>
                        )}
                      </button>

                      {(message.content.includes('```') || message.content.includes('MyVideo')) && (
                        <button
                          onClick={() => handleApplyCode(message.content)}
                          className="text-xs px-2 py-1 rounded bg-[#007acc] hover:bg-[#005a9e] text-white transition-colors flex items-center gap-1"
                        >
                          <FileCode className="w-3 h-3" />
                          <span>应用代码</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#3e3e42] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm text-[#cccccc]">You</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#007acc] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[#2d2d30] rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-[#969696]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI 正在思考...</span>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg px-4 py-3">
              <p className="text-sm text-red-300">
                {error.message || 'AI 服务错误，请检查配置'}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="flex-shrink-0 border-t border-[#3e3e42] bg-[#2d2d30] p-4">
        {/* 快速操作按钮 */}
        {code && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              onClick={() => append({ role: 'user', content: '分析当前代码的结构和性能' })}
              disabled={isLoading}
              className="text-xs px-2 py-1 rounded bg-[#37373d] hover:bg-[#3e3e42] text-[#cccccc] transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Wand2 className="w-3 h-3" />
              <span>分析代码</span>
            </button>
            <button
              onClick={() => append({ role: 'user', content: '优化当前代码的性能和可读性' })}
              disabled={isLoading}
              className="text-xs px-2 py-1 rounded bg-[#37373d] hover:bg-[#3e3e42] text-[#cccccc] transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>优化代码</span>
            </button>
            <button
              onClick={() => append({ role: 'user', content: '审查代码质量，检查最佳实践' })}
              disabled={isLoading}
              className="text-xs px-2 py-1 rounded bg-[#37373d] hover:bg-[#3e3e42] text-[#cccccc] transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <FileCode className="w-3 h-3" />
              <span>审查代码</span>
            </button>
            {formattedAssets.length > 0 && (
              <button
                onClick={() => append({ role: 'user', content: '根据当前代码推荐合适的资源' })}
                disabled={isLoading}
                className="text-xs px-2 py-1 rounded bg-[#37373d] hover:bg-[#3e3e42] text-[#cccccc] transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Image className="w-3 h-3" />
                <span>推荐资源</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={code ? "描述你想要的视频效果或修改..." : "描述你想要的视频效果..."}
            disabled={isLoading}
            className="flex-1 h-10 px-3 bg-[#3c3c3c] border border-[#3e3e42] rounded text-[#cccccc] placeholder-[#969696] text-sm focus:outline-none focus:border-[#007acc] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 flex items-center justify-center rounded bg-[#007acc] hover:bg-[#005a9e] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-[#5a5a5a]">
            提示：描述越详细，生成的代码越准确。AI 会自动搜索和使用资源库中的资源。
          </p>
          {formattedAssets.length > 0 && (
            <span className="text-xs text-[#007acc] bg-[#007acc]/10 px-2 py-0.5 rounded">
              {formattedAssets.length} 个资源可用
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
