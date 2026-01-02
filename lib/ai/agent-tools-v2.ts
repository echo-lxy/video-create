/**
 * 增强的 AI Agent 工具集 V2
 * 支持自动错误修复、编译验证、迭代优化
 */

import { z } from 'zod';
import { compileTypeScript } from '@/lib/compiler/code-compiler';
import { validateCode } from '@/lib/security/code-validator';
import { IntelligentAgent } from './agent-engine';

export interface ToolContext {
  code: string;
  assets: Array<{ id: string; name: string; type: string; url: string }>;
  videoConfig: {
    durationInFrames: number;
    fps: number;
    width: number;
    height: number;
  };
}

/**
 * 编译验证工具 - AI 可以自动验证代码是否能编译
 * 直接调用前端的原生编译功能（compileTypeScript），获取真实的编译错误信息
 */
export const compileAndValidateTool = {
  description: `验证代码是否能成功编译。直接调用前端的原生编译功能（compileTypeScript）进行验证，返回真实的编译错误信息。
  AI 必须基于这些错误信息自动修复代码。
  
  使用场景：
  - 生成代码后自动验证
  - 修复代码后验证是否成功
  - 迭代优化过程中验证
  
  重要：如果编译失败，必须使用返回的错误信息修复代码！`,
  parameters: z.object({
    code: z.string().describe('要验证的代码'),
  }),
  execute: async (params: { code: string }, context: ToolContext) => {
    const { code } = params;
    
    // 检查是否在浏览器环境
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      // 浏览器环境：直接调用原生编译功能
      try {
        // 动态导入编译函数（避免服务器端打包问题）
        const { compileTypeScript } = await import('@/lib/compiler/code-compiler');
        const { validateCode } = await import('@/lib/security/code-validator');
        
        // 1. 语法验证
        const validation = await validateCode(code);
        
        // 2. 编译验证（使用原生编译功能）
        const compileResult = await compileTypeScript(code);
        
        const errors: string[] = [];
        const warnings: string[] = [];
        
        if (!validation.isValid) {
          errors.push(...validation.errors);
        }
        
        if (!compileResult.success) {
          errors.push(compileResult.error || '编译失败');
        }
        
        // 3. 代码结构检查
        const agent = new IntelligentAgent(context);
        const structureCheck = await agent.validateCode(code);
        errors.push(...structureCheck.errors);
        warnings.push(...structureCheck.warnings);
        
        const isValid = errors.length === 0;
        
        return {
          success: isValid,
          isValid,
          errors,
          warnings,
          message: isValid 
            ? '代码验证通过，可以成功编译' 
            : `发现 ${errors.length} 个错误，${warnings.length} 个警告`,
          // 如果失败，提供详细的错误信息供 AI 修复
          ...(errors.length > 0 ? {
            errorDetails: errors.join('\n'),
            fixHint: `请根据以下错误信息修复代码：\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`,
          } : {}),
        };
      } catch (error: any) {
        // 编译过程出错
        const errorMsg = error?.message || '编译过程出错';
        return {
          success: false,
          isValid: false,
          errors: [errorMsg],
          warnings: [],
          message: `编译验证失败: ${errorMsg}`,
          errorDetails: errorMsg,
          fixHint: `编译过程出错，请检查代码：${errorMsg}`,
        };
      }
    } else {
      // 服务器端：使用 API 或基本验证
      try {
        // 尝试从编译状态 store 读取（如果前端已经编译过）
        // 注意：这在服务器端无法访问，所以回退到 API
        const response = await fetch('/api/ai/compile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error(`编译 API 调用失败: ${response.statusText}`);
        }

        const result = await response.json();
        
        return {
          success: result.success,
          isValid: result.isValid,
          errors: result.errors || [],
          warnings: result.warnings || [],
          message: result.message || (result.success ? '代码验证通过' : '代码验证失败'),
          ...(result.errors && result.errors.length > 0 ? {
            errorDetails: result.errors.join('\n'),
            fixHint: `请根据以下错误信息修复代码：\n${result.errors.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n')}`,
          } : {}),
        };
      } catch (error: any) {
        // API 调用失败，使用基本验证
        const errors: string[] = [];
        const validation = await validateCode(code);
        if (!validation.isValid) {
          errors.push(...validation.errors);
        }
        
        return {
          success: errors.length === 0,
          isValid: errors.length === 0,
          errors,
          warnings: [],
          message: errors.length === 0 
            ? '代码基本验证通过（服务器端验证）' 
            : `发现 ${errors.length} 个错误（服务器端验证）`,
          errorDetails: errors.join('\n'),
          fixHint: errors.length > 0 
            ? `请根据以下错误信息修复代码：\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
            : undefined,
        };
      }
    }
  },
};

/**
 * 自动修复工具 - AI 可以基于错误信息自动修复代码
 */
export const autoFixCodeTool = {
  description: `基于编译错误自动修复代码。这是一个迭代过程，会尝试多次修复直到成功或达到最大迭代次数。
  
  工作流程：
  1. 验证代码，获取错误信息
  2. 分析错误类型和原因
  3. 生成修复后的代码
  4. 再次验证，如果还有错误则继续修复
  5. 最多尝试 5 次`,
  parameters: z.object({
    code: z.string().describe('需要修复的代码'),
    errorMessage: z.string().optional().describe('已知的错误信息（如果已知道错误）'),
    maxIterations: z.number().optional().describe('最大修复迭代次数（默认 5）'),
  }),
  execute: async (
    params: { code: string; errorMessage?: string; maxIterations?: number },
    context: ToolContext
  ) => {
    const { code, errorMessage, maxIterations = 5 } = params;
    const agent = new IntelligentAgent({
      ...context,
      code,
      maxIterations,
    });

    // 如果没有提供错误信息，先验证获取
    let currentError = errorMessage;
    if (!currentError) {
      const validation = await agent.validateCode(code);
      if (validation.isValid) {
        return {
          success: true,
          code,
          message: '代码没有错误，无需修复',
          iterations: 0,
        };
      }
      currentError = validation.errors[0];
    }

    // 分析错误
    const errorAnalysis = agent.analyzeError(currentError);
    
    // 生成修复提示词（供 AI 使用）
    const fixPrompt = agent.generateFixPrompt(code, currentError, errorAnalysis);

    return {
      success: false, // 需要 AI 实际执行修复
      code,
      error: currentError,
      errorAnalysis,
      fixPrompt,
      message: `已分析错误，请使用 fixPrompt 生成修复后的代码`,
      // 这个工具返回修复提示词，实际修复由 AI 通过 modifyCode 工具完成
    };
  },
};

/**
 * 智能代码生成工具 - 支持资源指定和代码微调
 * 
 * ⚠️ 重要：此工具只生成代码提示词，生成代码后必须使用 compileAndValidate 验证
 */
export const generateCodeTool = {
  description: `智能生成 Remotion 视频代码。支持：
  - 根据用户需求生成新代码
  - 基于现有代码进行微调
  - 自动匹配和使用资源
  - 确保代码符合所有规范
  
  ⚠️ 使用此工具后，必须立即使用 compileAndValidate 验证生成的代码！
  如果验证失败，必须使用 autoFixCode + modifyCode 进行修复！`,
  parameters: z.object({
    requirement: z.string().describe('用户需求描述'),
    baseCode: z.string().optional().describe('现有代码（如果进行微调）'),
    assetIds: z.array(z.string()).optional().describe('要使用的资源 ID 列表'),
    modificationType: z.enum(['new', 'modify', 'enhance']).optional().describe('生成类型：new=新代码，modify=修改现有，enhance=增强现有'),
  }),
  execute: async (
    params: {
      requirement: string;
      baseCode?: string;
      assetIds?: string[];
      modificationType?: 'new' | 'modify' | 'enhance';
    },
    context: ToolContext
  ) => {
    const { requirement, baseCode, assetIds, modificationType = 'new' } = params;
    // 获取指定的资源
    const selectedAssets = assetIds
      ? context.assets.filter(a => assetIds.includes(a.id))
      : [];

    // 生成代码提示词
    const codePrompt = `
用户需求：${requirement}

${baseCode ? `现有代码：\n\`\`\`typescript\n${baseCode}\n\`\`\`` : ''}

${selectedAssets.length > 0 ? `指定资源：\n${selectedAssets.map(a => `- ${a.name} (${a.type}): ${a.url}`).join('\n')}` : ''}

视频配置：
- 时长: ${context.videoConfig.durationInFrames} 帧
- 帧率: ${context.videoConfig.fps} fps
- 分辨率: ${context.videoConfig.width}x${context.videoConfig.height}

${modificationType === 'modify' ? '请修改现有代码以满足新需求' : ''}
${modificationType === 'enhance' ? '请在现有代码基础上增强功能' : ''}
${modificationType === 'new' ? '请生成全新的代码' : ''}

请生成符合所有规范的 Remotion 代码。
`;

    return {
      success: true,
      prompt: codePrompt,
      assets: selectedAssets,
      message: `已准备代码生成提示词，包含 ${selectedAssets.length} 个指定资源。⚠️ 生成代码后必须立即使用 compileAndValidate 验证！`,
    };
  },
};

/**
 * 迭代优化工具 - 支持多轮优化
 */
export const optimizeCodeTool = {
  description: `迭代优化代码，包括性能优化、代码简化、最佳实践改进等。
  可以多次调用此工具进行渐进式优化。`,
  parameters: z.object({
    code: z.string().describe('要优化的代码'),
    optimizationGoals: z.array(z.enum(['performance', 'readability', 'best-practices', 'size'])).optional().describe('优化目标'),
    validateAfterOptimize: z.boolean().optional().describe('优化后是否自动验证（默认 true）'),
  }),
  execute: async (
    params: {
      code: string;
      optimizationGoals?: Array<'performance' | 'readability' | 'best-practices' | 'size'>;
      validateAfterOptimize?: boolean;
    },
    context: ToolContext
  ) => {
    const { code, optimizationGoals = ['best-practices'], validateAfterOptimize = true } = params;
    const agent = new IntelligentAgent(context);

    // 验证优化前代码
    const beforeValidation = await agent.validateCode(code);

    // 生成优化提示词
    const optimizePrompt = `
当前代码：
\`\`\`typescript
${code}
\`\`\`

优化目标：${optimizationGoals.join(', ')}

${beforeValidation.errors.length > 0 ? `当前错误：\n${beforeValidation.errors.map(e => `- ${e}`).join('\n')}` : ''}

请优化代码，确保：
1. 修复所有错误
2. 实现优化目标
3. 保持功能不变
4. 符合所有代码规范
`;

    return {
      success: true,
      prompt: optimizePrompt,
      beforeValidation,
      message: `已准备优化提示词，优化前有 ${beforeValidation.errors.length} 个错误`,
    };
  },
};

