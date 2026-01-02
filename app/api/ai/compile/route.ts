/**
 * 编译验证 API
 * 供 AI 调用，直接使用编译组件验证代码
 * 返回真实的编译错误信息，供 AI 修复代码
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCode } from '@/lib/security/code-validator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: '代码不能为空', errors: ['代码不能为空'] },
        { status: 400 }
      );
    }

    const errors: string[] = [];

    // 1. 语法验证
    const validation = await validateCode(code);
    if (!validation.isValid) {
      errors.push(...validation.errors);
    }

    // 2. 基本结构检查（服务器端可以做的检查）
    if (!code.includes('MyVideo')) {
      errors.push('代码中必须包含 MyVideo 组件');
    }
    
    if (!code.includes('export')) {
      errors.push('代码中必须包含 export 语句（export const MyVideo 或 export { MyVideo }）');
    }

    // 3. 检查是否有明显的语法错误
    // 检查括号匹配
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`括号不匹配：有 ${openBraces} 个 { 和 ${closeBraces} 个 }`);
    }

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`圆括号不匹配：有 ${openParens} 个 ( 和 ${closeParens} 个 )`);
    }

    // 4. 检查 hooks 是否在组件外部
    const hooksPattern = /(useMemo|useState|useEffect|useCallback|useCurrentFrame|useVideoConfig)\s*\(/;
    const beforeComponent = code.split(/export\s+(const|function|{)\s+MyVideo/)[0];
    if (beforeComponent && hooksPattern.test(beforeComponent)) {
      // 检查是否在注释中
      const lines = beforeComponent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (hooksPattern.test(trimmed) && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
          errors.push('检测到 hooks 在组件外部调用，所有 hooks 必须在 MyVideo 组件内部调用');
          break;
        }
      }
    }

    const success = errors.length === 0;

    return NextResponse.json({
      success,
      isValid: success,
      errors,
      message: success 
        ? '代码基本验证通过（注意：实际编译验证在浏览器端进行）' 
        : `发现 ${errors.length} 个错误：\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`,
      // 提供修复提示
      fixHint: errors.length > 0 
        ? `请根据以下错误修复代码：\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
        : undefined,
    });
  } catch (error: any) {
    console.error('Compile API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || '编译验证失败',
        errors: [error?.message || '未知错误'],
      },
      { status: 500 }
    );
  }
}

