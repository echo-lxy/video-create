'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Plus, X, Check, Trash2, Key, Globe, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useAIConfigStore, AIProvider } from '@/lib/store/ai-config-store';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils/cn';

export default function Settings() {
  const { providers, activeProviderId, addProvider, setActiveProvider, removeProvider, updateProvider } =
    useAIConfigStore();
  const [newProvider, setNewProvider] = useState<Partial<AIProvider>>({
    name: '',
    apiKey: '',
    model: 'gpt-4-turbo-preview',
    baseUrl: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);

  const validateProvider = async (): Promise<boolean> => {
    if (!newProvider.name || !newProvider.apiKey || !newProvider.model) {
      setValidationResult({ valid: false, error: '请填写所有必填字段' });
      return false;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProvider.name,
          apiKey: newProvider.apiKey,
          model: newProvider.model,
          baseUrl: newProvider.baseUrl,
        }),
      });

      // 检查响应状态
      if (!response.ok) {
        // 尝试解析错误响应
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = errorData.error || `HTTP ${response.status}`;
        } catch {
          // 如果不是 JSON，读取文本
          const text = await response.text();
          // 如果是 HTML，提取有用信息
          if (text.includes('<!DOCTYPE')) {
            errorText = `服务器返回了错误页面 (HTTP ${response.status})，请检查 API 路由是否正确配置`;
          } else {
            errorText = text || `请求失败 (HTTP ${response.status})`;
          }
        }
        
        setValidationResult({
          valid: false,
          error: errorText,
        });
        return false;
      }

      // 解析 JSON 响应
      let result;
      try {
        const text = await response.text();
        result = JSON.parse(text);
      } catch (parseError: any) {
        console.error('Failed to parse response:', parseError);
        setValidationResult({
          valid: false,
          error: '服务器返回了无效的响应格式，请检查 API 配置',
          details: parseError.message,
        });
        return false;
      }

      setValidationResult(result);

      if (!result.valid) {
        console.error('Provider validation failed:', result);
      }

      return result.valid;
    } catch (error: any) {
      console.error('Validation request failed:', error);
      let errorMessage = '验证失败，请检查网络连接';
      
      if (error.message?.includes('JSON') || error.message?.includes('<!DOCTYPE')) {
        errorMessage = '服务器返回了无效的响应，可能是 API 路由配置问题';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setValidationResult({
        valid: false,
        error: errorMessage,
        details: error.stack,
      });
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleAddProvider = async () => {
    const isValid = await validateProvider();
    if (!isValid) {
      return;
    }

    addProvider({
      id: uuidv4(),
      name: newProvider.name!,
      apiKey: newProvider.apiKey!,
      model: newProvider.model!,
      baseUrl: newProvider.baseUrl || undefined,
    });

    setNewProvider({ name: '', apiKey: '', model: 'gpt-4-turbo-preview', baseUrl: '' });
    setValidationResult(null);
    setShowAddForm(false);
  };

  const handleEditProvider = (provider: AIProvider) => {
    setEditingId(provider.id);
    setNewProvider({
      name: provider.name,
      apiKey: provider.apiKey,
      model: provider.model,
      baseUrl: provider.baseUrl || '',
    });
    setShowAddForm(true);
  };

  const handleUpdateProvider = async () => {
    if (!editingId) return;

    const isValid = await validateProvider();
    if (!isValid) {
      return;
    }

    updateProvider(editingId, {
      name: newProvider.name!,
      apiKey: newProvider.apiKey!,
      model: newProvider.model!,
      baseUrl: newProvider.baseUrl || undefined,
    });

    setNewProvider({ name: '', apiKey: '', model: 'gpt-4-turbo-preview', baseUrl: '' });
    setValidationResult(null);
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setNewProvider({ name: '', apiKey: '', model: 'gpt-4-turbo-preview', baseUrl: '' });
    setEditingId(null);
    setShowAddForm(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
      {/* 标题栏 */}
      <div className="flex-shrink-0 h-12 bg-[#2d2d30] border-b border-[#3e3e42] px-4 flex items-center gap-2">
        <SettingsIcon className="w-4 h-4 text-[#007acc]" />
        <span className="text-sm font-medium text-[#cccccc]">设置</span>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* AI 配置区域 */}
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#cccccc] mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#007acc]" />
              AI 提供商配置
            </h2>
            <p className="text-xs text-[#969696] mb-4">
              支持配置 OpenAI、Anthropic (Claude) 或豆包（字节跳动）API 以使用 AI 助手功能
            </p>

            {/* 已配置的提供商列表 */}
            {providers.length > 0 && (
              <div className="space-y-2 mb-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={cn(
                      'p-3 rounded border transition-colors',
                      provider.id === activeProviderId
                        ? 'bg-[#007acc]/10 border-[#007acc]'
                        : 'bg-[#2d2d30] border-[#3e3e42] hover:border-[#3e3e42]'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[#cccccc]">
                            {provider.name}
                          </span>
                          {provider.id === activeProviderId && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[#007acc] text-white">
                              当前使用
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#969696] space-y-1">
                          <div className="flex items-center gap-1">
                            <span>模型:</span>
                            <span className="text-[#cccccc]">{provider.model}</span>
                          </div>
                          {provider.baseUrl && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span className="text-[#cccccc] truncate">{provider.baseUrl}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {provider.id !== activeProviderId && (
                          <button
                            onClick={() => setActiveProvider(provider.id)}
                            className="p-1.5 rounded hover:bg-[#3e3e42] text-[#969696] hover:text-[#cccccc] transition-colors"
                            title="激活"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditProvider(provider)}
                          className="p-1.5 rounded hover:bg-[#3e3e42] text-[#969696] hover:text-[#cccccc] transition-colors"
                          title="编辑"
                        >
                          <SettingsIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('确定要删除这个提供商吗？')) {
                              removeProvider(provider.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-red-900/20 text-[#969696] hover:text-red-400 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 添加/编辑表单 */}
            {showAddForm ? (
              <div className="p-4 rounded border border-[#3e3e42] bg-[#2d2d30] space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#cccccc]">
                    {editingId ? '编辑提供商' : '添加新提供商'}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="p-1 rounded hover:bg-[#3e3e42] text-[#969696] hover:text-[#cccccc] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-xs text-[#969696] block mb-1.5">
                    提供商名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如: OpenAI GPT-4"
                    value={newProvider.name || ''}
                    onChange={(e) =>
                      setNewProvider({ ...newProvider, name: e.target.value })
                    }
                    className="w-full h-8 px-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-sm text-[#cccccc] placeholder-[#5a5a5a] focus:outline-none focus:border-[#007acc]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#969696] block mb-1.5 flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    API Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={newProvider.apiKey || ''}
                    onChange={(e) =>
                      setNewProvider({ ...newProvider, apiKey: e.target.value })
                    }
                    className="w-full h-8 px-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-sm text-[#cccccc] placeholder-[#5a5a5a] focus:outline-none focus:border-[#007acc]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#969696] block mb-1.5">
                    模型 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="gpt-4-turbo-preview, claude-3-5-sonnet-20241022, 或 doubao-pro-32k"
                    value={newProvider.model || ''}
                    onChange={(e) =>
                      setNewProvider({ ...newProvider, model: e.target.value })
                    }
                    className="w-full h-8 px-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-sm text-[#cccccc] placeholder-[#5a5a5a] focus:outline-none focus:border-[#007acc]"
                  />
                  <p className="text-xs text-[#5a5a5a] mt-1">
                    OpenAI: gpt-4-turbo-preview, gpt-3.5-turbo | Anthropic: claude-3-5-sonnet-20241022 | 豆包: doubao-pro-32k, doubao-lite-4k
                  </p>
                  <p className="text-xs text-[#5a5a5a] mt-1">
                    💡 豆包配置提示：Base URL 建议填写 https://ark.cn-beijing.volces.com/api/v3
                  </p>
                </div>

                <div>
                  <label className="text-xs text-[#969696] block mb-1.5 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Base URL (可选)
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.openai.com/v1 或 https://ark.cn-beijing.volces.com/api/v3 (豆包)"
                    value={newProvider.baseUrl || ''}
                    onChange={(e) =>
                      setNewProvider({ ...newProvider, baseUrl: e.target.value })
                    }
                    className="w-full h-8 px-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-sm text-[#cccccc] placeholder-[#5a5a5a] focus:outline-none focus:border-[#007acc]"
                  />
                  <p className="text-xs text-[#5a5a5a] mt-1">
                    豆包默认: https://ark.cn-beijing.volces.com/api/v3 (使用豆包时建议填写)
                  </p>
                </div>

                {/* 验证结果提示 */}
                {validationResult && (
                  <div
                    className={cn(
                      'p-3 rounded border text-sm',
                      validationResult.valid
                        ? 'bg-green-900/20 border-green-700/50 text-green-400'
                        : 'bg-red-900/20 border-red-700/50 text-red-400'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {validationResult.valid ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          {validationResult.valid ? '配置验证成功' : '配置验证失败'}
                        </div>
                        {!validationResult.valid && (
                          <div className="mt-1 text-xs opacity-90 whitespace-pre-line">
                            {validationResult.error}
                            {validationResult.details && (
                              <div className="mt-1 text-[10px] opacity-75">
                                详情: {validationResult.details}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={editingId ? handleUpdateProvider : handleAddProvider}
                    disabled={validating}
                    className="flex-1 h-8 px-3 bg-[#007acc] hover:bg-[#005a9e] text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>验证中...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingId ? '保存并验证' : '添加并验证'}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={validating}
                    className="h-8 px-3 bg-[#37373d] hover:bg-[#3e3e42] text-[#cccccc] rounded text-sm transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full h-9 px-3 bg-[#2d2d30] hover:bg-[#37373d] border border-[#3e3e42] rounded text-sm text-[#cccccc] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>添加 AI 提供商</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

