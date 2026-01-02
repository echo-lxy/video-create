/**
 * AI 提供商配置验证 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAIModel, detectProviderType, validateProviderConfig } from '@/lib/ai/providers';
import { generateText } from 'ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, apiKey, model, baseUrl } = await req.json();

    if (!apiKey || !model) {
      return NextResponse.json(
        { valid: false, error: 'API Key 和模型名称不能为空' },
        { status: 400 }
      );
    }

    // 检测提供商类型
    const providerType = detectProviderType({ name, model, baseUrl });

    // 创建配置
    const config = {
      id: 'temp',
      name: name || 'Test Provider',
      apiKey,
      model,
      baseUrl,
      providerType,
    };

    // 验证配置
    const validation = await validateProviderConfig(config);
    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, error: validation.error },
        { status: 400 }
      );
    }

    // 尝试发送测试请求
    try {
      const { model: aiModel } = createAIModel(config);
      
      // 发送一个简单的测试请求
      const result = await generateText({
        model: aiModel,
        prompt: 'Hello',
        maxTokens: 5,
      });

      return NextResponse.json({
        valid: true,
        message: '配置验证成功',
        providerType,
      });
    } catch (error: any) {
      let errorMessage = 'API 调用失败';
      let errorDetails = '';
      
      // 详细的错误信息提取
      if (error.message) {
        errorDetails = error.message;
      }
      if (error.cause?.message) {
        errorDetails += ` | ${error.cause.message}`;
      }
      
      // 检查是否是网络错误或连接错误
      if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND')) {
        errorMessage = '无法连接到 API 服务器';
        if (providerType === 'openai-compatible') {
          errorMessage += '。豆包配置检查：\n1. Base URL: https://ark.cn-beijing.volces.com/api/v3\n2. 确认网络可以访问该地址\n3. 检查 API Key 是否正确';
        } else {
          errorMessage += '，请检查 Base URL 是否正确';
        }
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'API Key 认证失败，请检查 API Key 是否正确';
        if (providerType === 'openai-compatible') {
          errorMessage += '。对于豆包，请确认 API Key 格式正确且有效';
        }
      } else if (error.message?.includes('404')) {
        errorMessage = '模型不存在或 API 地址不正确';
        if (providerType === 'openai-compatible') {
          errorMessage += '。豆包配置检查：\n1. Base URL: https://ark.cn-beijing.volces.com/api/v3\n2. 模型名称: doubao-pro-32k 或 doubao-lite-4k\n3. 确认 API Key 有权限访问该模型';
        }
      } else if (error.message?.includes('429')) {
        errorMessage = 'API 调用频率超限，请稍后再试';
      } else if (error.message?.includes('timeout')) {
        errorMessage = '请求超时，请检查网络连接或稍后重试';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // 记录详细错误用于调试
      console.error('AI Provider Validation Error:', {
        providerType,
        name,
        model,
        baseUrl: baseUrl || 'not set',
        error: errorDetails || error.message,
        fullError: error,
      });

      return NextResponse.json(
        { 
          valid: false, 
          error: errorMessage,
          details: errorDetails || undefined,
          providerType,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Validate API error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || '验证失败' },
      { status: 500 }
    );
  }
}

