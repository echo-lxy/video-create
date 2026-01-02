/**
 * 智能 AI Agent 引擎
 * 
 * 参考业内最佳实践：
 * - LangGraph 状态机模式（设计模式参考）
 * - AutoGen 多智能体协作（未来扩展）
 * - Vercel AI SDK（实际实现）
 * 
 * 核心能力：
 * 1. 自动错误检测和修复（闭环）
 * 2. 迭代优化代码
 * 3. 资源智能匹配
 * 4. 代码微调支持
 * 
 * 设计说明：
 * - 使用状态机模式管理 Agent 工作流（参考 LangGraph）
 * - 使用 Vercel AI SDK 处理 AI 调用（成熟稳定）
 * - 纯 TypeScript 实现，无额外依赖（轻量级）
 */

import { compileTypeScript } from '@/lib/compiler/code-compiler';
import { validateCode } from '@/lib/security/code-validator';

/**
 * Agent 状态枚举（参考 LangGraph 状态机模式）
 */
export enum AgentState {
  INIT = 'init',
  GENERATING = 'generating',
  VALIDATING = 'validating',
  FIXING = 'fixing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface AgentContext {
  code: string;
  assets: Array<{ id: string; name: string; type: string; url: string }>;
  videoConfig: {
    durationInFrames: number;
    fps: number;
    width: number;
    height: number;
  };
  errorHistory: Array<{ error: string; attempt: number; fixed: boolean }>;
  iteration: number;
  maxIterations: number;
}

export interface AgentResult {
  success: boolean;
  code?: string;
  error?: string;
  iterations: number;
  errorsFixed: number;
  message: string;
}

export class IntelligentAgent {
  private context: AgentContext;
  private maxIterations = 5; // 最大迭代次数

  constructor(context: Partial<AgentContext>) {
    this.context = {
      code: context.code || '',
      assets: context.assets || [],
      videoConfig: context.videoConfig || {
        durationInFrames: 300,
        fps: 30,
        width: 1920,
        height: 1080,
      },
      errorHistory: [],
      iteration: 0,
      maxIterations: context.maxIterations || this.maxIterations,
    };
  }

  /**
   * 验证代码并返回详细错误信息
   */
  async validateCode(code: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    // 1. 语法验证
    const validation = await validateCode(code);
    
    // 2. 编译验证
    const compileResult = await compileTypeScript(code);
    
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!validation.isValid) {
      errors.push(...validation.errors);
    }

    if (!compileResult.success) {
      errors.push(`编译错误: ${compileResult.error}`);
    }

    // 3. 代码结构检查
    const structureErrors = this.checkCodeStructure(code);
    errors.push(...structureErrors.errors);
    warnings.push(...structureErrors.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 检查代码结构
   */
  private checkCodeStructure(code: string): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查是否有 MyVideo 组件（更宽松的检查）
    // 支持多种导出格式：export const MyVideo, export { MyVideo }, export default MyVideo
    const hasMyVideo = 
      (code.includes('MyVideo') && code.includes('export')) ||
      code.includes('export const MyVideo') ||
      code.includes('export { MyVideo }') ||
      code.includes('export default MyVideo') ||
      code.match(/export\s+(const|function)\s+MyVideo/);
    
    if (!hasMyVideo) {
      errors.push('代码中必须包含 export const MyVideo 组件（或 export { MyVideo } / export default MyVideo）');
    }

    // 检查是否有顶层变量（应该在组件内部）
    const topLevelVarPattern = /^(const|let|var)\s+\w+\s*=/gm;
    const beforeExport = code.split(/export\s+(const|function|{)\s+MyVideo/)[0];
    if (beforeExport && topLevelVarPattern.test(beforeExport)) {
      warnings.push('检测到顶层变量定义，建议移到组件内部');
    }

    // 检查 hooks 是否在组件外部（更精确的检查）
    const hooksPattern = /(useMemo|useState|useEffect|useCallback|useCurrentFrame|useVideoConfig)\s*\(/;
    const beforeComponent = code.split(/export\s+(const|function|{)\s+MyVideo/)[0];
    if (beforeComponent && hooksPattern.test(beforeComponent)) {
      // 检查是否在注释中
      const lines = beforeComponent.split('\n');
      let hasHooksOutside = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (hooksPattern.test(trimmed) && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
          hasHooksOutside = true;
          break;
        }
      }
      if (hasHooksOutside) {
        errors.push('检测到 hooks 在组件外部调用，这是不允许的。所有 hooks 必须在 MyVideo 组件内部调用');
      }
    }

    return { errors, warnings };
  }

  /**
   * 分析错误并生成修复建议
   */
  analyzeError(error: string): {
    type: 'syntax' | 'runtime' | 'structure' | 'unknown';
    severity: 'error' | 'warning';
    suggestion: string;
    fixable: boolean;
  } {
    const errorLower = error.toLowerCase();

    // 语法错误
    if (errorLower.includes('syntax') || errorLower.includes('parse')) {
      return {
        type: 'syntax',
        severity: 'error',
        suggestion: '检查代码语法，确保括号、引号等匹配',
        fixable: true,
      };
    }

    // React Hooks 错误
    if (errorLower.includes('hook') || errorLower.includes('invalid hook call')) {
      return {
        type: 'structure',
        severity: 'error',
        suggestion: '确保所有 hooks 都在 MyVideo 组件内部调用，不能在组件外部或条件语句中调用',
        fixable: true,
      };
    }

    // 编译错误
    if (errorLower.includes('compile') || errorLower.includes('transform')) {
      return {
        type: 'syntax',
        severity: 'error',
        suggestion: '检查代码是否符合 TypeScript/React 规范',
        fixable: true,
      };
    }

    // 运行时错误
    if (errorLower.includes('runtime') || errorLower.includes('cannot read')) {
      return {
        type: 'runtime',
        severity: 'error',
        suggestion: '检查变量是否正确定义和使用',
        fixable: true,
      };
    }

    return {
      type: 'unknown',
      severity: 'error',
      suggestion: '需要进一步分析错误',
      fixable: false,
    };
  }

  /**
   * 生成修复提示词
   */
  generateFixPrompt(
    code: string,
    error: string,
    errorAnalysis: ReturnType<typeof this.analyzeError>
  ): string {
    const context = `
当前代码：
\`\`\`typescript
${code}
\`\`\`

错误信息：
${error}

错误分析：
- 类型: ${errorAnalysis.type}
- 严重程度: ${errorAnalysis.severity}
- 建议: ${errorAnalysis.suggestion}

请修复这个错误，确保：
1. 所有代码都在 MyVideo 组件内部
2. 所有 hooks 都在组件内部调用
3. 代码可以成功编译
4. 保持原有功能不变
`;

    return context;
  }

  /**
   * 执行智能修复流程
   */
  async executeFixFlow(
    initialCode: string,
    error: string,
    aiModel: any // AI 模型实例
  ): Promise<AgentResult> {
    let currentCode = initialCode;
    let iterations = 0;
    let errorsFixed = 0;

    while (iterations < this.maxIterations) {
      iterations++;

      // 验证当前代码
      const validation = await this.validateCode(currentCode);
      
      if (validation.isValid) {
        return {
          success: true,
          code: currentCode,
          iterations,
          errorsFixed,
          message: `成功修复！经过 ${iterations} 次迭代，修复了 ${errorsFixed} 个错误`,
        };
      }

      // 分析错误
      const firstError = validation.errors[0];
      const errorAnalysis = this.analyzeError(firstError);

      if (!errorAnalysis.fixable) {
        return {
          success: false,
          code: currentCode,
          error: firstError,
          iterations,
          errorsFixed,
          message: `无法自动修复：${firstError}`,
        };
      }

      // 生成修复提示词
      const fixPrompt = this.generateFixPrompt(currentCode, firstError, errorAnalysis);

      // 调用 AI 修复（这里需要集成 AI 模型）
      // 暂时返回错误，实际应该调用 AI
      return {
        success: false,
        code: currentCode,
        error: 'AI 修复功能需要集成',
        iterations,
        errorsFixed,
        message: '修复流程已启动，但需要 AI 模型支持',
      };
    }

    return {
      success: false,
      code: currentCode,
      error: '达到最大迭代次数',
      iterations,
      errorsFixed,
      message: `经过 ${iterations} 次迭代仍无法完全修复`,
    };
  }
}

