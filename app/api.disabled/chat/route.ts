import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, code, provider } = await req.json();

    if (!provider || !provider.apiKey) {
      return new Response('No AI provider configured', { status: 400 });
    }

    // 创建 AI 提供者实例
    let model: any;
    const providerName = provider.name.toLowerCase();
    
    if (providerName.includes('openai') || providerName.includes('gpt')) {
      const openaiProvider = createOpenAI({
        apiKey: provider.apiKey,
        ...(provider.baseUrl ? { baseURL: provider.baseUrl } : {}),
      });
      model = openaiProvider(provider.model);
    } else if (providerName.includes('anthropic') || providerName.includes('claude')) {
      const anthropicProvider = createAnthropic({
        apiKey: provider.apiKey,
        ...(provider.baseUrl ? { baseURL: provider.baseUrl } : {}),
      });
      model = anthropicProvider(provider.model);
    } else {
      // 默认使用 OpenAI 兼容接口
      const openaiProvider = createOpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || 'https://api.openai.com/v1',
      });
      model = openaiProvider(provider.model);
    }

    // 系统提示词
    const systemPrompt = `You are an expert Remotion video code assistant. You help users create and modify Remotion video code.

Current code:
\`\`\`typescript
${code}
\`\`\`

Guidelines:
- Generate valid TypeScript/React code for Remotion
- Use Remotion APIs: AbsoluteFill, useCurrentFrame, interpolate, etc.
- Export a component named "MyVideo"
- Always wrap code in \`\`\`tsx code blocks
- Keep code simple and readable
- Follow React hooks rules
- Use inline styles

Example structure:
\`\`\`tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Your content */}
    </AbsoluteFill>
  );
};
\`\`\``;

    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toAIStreamResponse();
  } catch (error: any) {
    console.error('AI API Error:', error);
    return new Response(error.message || 'Internal Server Error', {
      status: 500,
    });
  }
}

