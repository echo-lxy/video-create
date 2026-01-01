import * as esbuild from 'esbuild-wasm';

let initialized = false;

export async function initializeCompiler() {
  if (initialized) return;

  try {
    await esbuild.initialize({
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm',
    });
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize esbuild:', error);
    throw error;
  }
}

export interface CompileResult {
  success: boolean;
  code?: string;
  error?: string;
}

export async function compileTypeScript(code: string): Promise<CompileResult> {
  try {
    if (!initialized) {
      await initializeCompiler();
    }

    // 确保代码有导出语句
    let codeToCompile = code.trim();
    if (!codeToCompile.includes('export')) {
      // 如果没有导出，添加默认导出
      codeToCompile = `${codeToCompile}\n\nexport { MyVideo };`;
    }

    // 包装代码，将 React 和 remotion 作为参数传入
    const wrappedCode = `
      (function(React, remotion) {
        ${codeToCompile}
        return typeof MyVideo !== 'undefined' ? MyVideo : null;
      })
    `;

    // 使用 IIFE 格式编译
    const result = await esbuild.transform(wrappedCode, {
      loader: 'tsx',
      target: 'es2020',
      format: 'iife', // IIFE 格式，可以在浏览器中直接执行
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    });

    return {
      success: true,
      code: result.code,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown compilation error',
    };
  }
}

