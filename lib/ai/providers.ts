/**
 * AI 提供商抽象层
 * 支持所有主流的 AI 提供商，易于扩展
 */

import { LanguageModel } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

export interface AIProviderConfig {
  id: string;
  name: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
  providerType: 'openai' | 'anthropic' | 'openai-compatible' | 'custom';
}

export interface AIProviderResult {
  model: LanguageModel;
  providerName: string;
}

/**
 * 创建 AI 模型实例
 */
export function createAIModel(config: AIProviderConfig): AIProviderResult {
  const { providerType, model, apiKey, baseUrl, name } = config;

  try {
    switch (providerType) {
      case 'openai':
        return {
          model: openai(model, {
            apiKey,
            ...(baseUrl && { baseURL: baseUrl }),
          }),
          providerName: 'OpenAI',
        };

      case 'anthropic':
        return {
          model: anthropic(model, {
            apiKey,
            ...(baseUrl && { baseURL: baseUrl }),
          }),
          providerName: 'Anthropic',
        };

      case 'openai-compatible':
        // OpenAI 兼容的提供商（如豆包、其他兼容 OpenAI API 的服务）
        // 豆包的默认 baseUrl: https://ark.cn-beijing.volces.com/api/v3
        const defaultBaseUrl = baseUrl || 'https://api.openai.com/v1';
        const openaiClient = createOpenAI({
          apiKey,
          baseURL: defaultBaseUrl,
        });
        return {
          model: openaiClient(model),
          providerName: name || 'OpenAI Compatible',
        };

      case 'custom':
        // 自定义提供商，使用 OpenAI 兼容接口
        const customClient = createOpenAI({
          apiKey,
          baseURL: baseUrl || 'https://api.openai.com/v1',
        });
        return {
          model: customClient(model),
          providerName: name || 'Custom',
        };

      default:
        throw new Error(`不支持的提供商类型: ${providerType}`);
    }
  } catch (error: any) {
    throw new Error(`创建 AI 模型失败: ${error.message}`);
  }
}

/**
 * 自动检测提供商类型
 */
export function detectProviderType(config: {
  name: string;
  model: string;
  baseUrl?: string;
}): AIProviderConfig['providerType'] {
  const nameLower = config.name.toLowerCase();
  const modelLower = config.model.toLowerCase();
  const baseUrlLower = config.baseUrl?.toLowerCase() || '';

  // Anthropic
  if (
    nameLower.includes('anthropic') ||
    nameLower.includes('claude') ||
    modelLower.includes('claude')
  ) {
    return 'anthropic';
  }

  // 豆包
  if (
    nameLower.includes('豆包') ||
    nameLower.includes('doubao') ||
    baseUrlLower.includes('volcengine') ||
    baseUrlLower.includes('doubao')
  ) {
    return 'openai-compatible';
  }

  // OpenAI 兼容（有自定义 baseUrl）
  if (baseUrl && baseUrl !== 'https://api.openai.com/v1') {
    return 'openai-compatible';
  }

  // 默认 OpenAI
  return 'openai';
}

/**
 * 验证 AI 提供商配置
 */
export async function validateProviderConfig(
  config: AIProviderConfig
): Promise<{ valid: boolean; error?: string }> {
  try {
    // 基本验证
    if (!config.apiKey || !config.model) {
      return {
        valid: false,
        error: 'API Key 和模型名称不能为空',
      };
    }

    // 创建模型实例
    const { model } = createAIModel(config);

    // 尝试发送一个简单的测试请求
    // 注意：这里我们只是验证配置，不实际调用
    // 实际的验证会在保存时通过测试 API 调用完成

    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || '配置验证失败',
    };
  }
}

