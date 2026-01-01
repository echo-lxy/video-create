import * as esbuild from 'esbuild-wasm';

let initialized = false;

export async function initializeCompiler() {
  if (initialized) return;

  try {
    // 优先使用本地资源，如果不存在则回退到 CDN
    const isProduction = typeof window !== 'undefined' && 
      (window.location.hostname === 'echo-lxy.github.io' || 
       process.env.NODE_ENV === 'production');
    const basePath = isProduction ? '/video-create' : '';
    
    // 尝试使用本地资源
    const localWasmURL = `${basePath}/esbuild/esbuild.wasm`;
    
    // 检查本地资源是否存在（使用 HEAD 请求，快速检查）
    let wasmURL = localWasmURL;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时
      
      const response = await fetch(localWasmURL, { 
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // 本地资源不存在，使用 CDN
        wasmURL = 'https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm';
        console.log('⚠️ Using CDN for esbuild-wasm (local file not found)');
      } else {
        console.log('✅ Using local esbuild-wasm (faster!)');
      }
    } catch {
      // 检查失败或超时，使用 CDN
      wasmURL = 'https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm';
      console.log('⚠️ Using CDN for esbuild-wasm (fallback)');
    }

    await esbuild.initialize({
      wasmURL,
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

    // 预处理代码：移除 React 和 remotion 的导入语句
    // 因为它们会作为全局变量注入，不需要导入
    let codeToCompile = code.trim();
    
    // 移除各种形式的 React 导入
    codeToCompile = codeToCompile.replace(
      /import\s+(?:\*\s+as\s+)?React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?\s*/g,
      ''
    );
    codeToCompile = codeToCompile.replace(
      /import\s+\{[^}]*\}\s+from\s+['"]react['"];?\s*/g,
      ''
    );
    
    // 移除 remotion 的导入（AbsoluteFill, useCurrentFrame 等会作为全局变量注入）
    codeToCompile = codeToCompile.replace(
      /import\s+(?:\*\s+as\s+)?remotion(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]remotion['"];?\s*/g,
      ''
    );
    codeToCompile = codeToCompile.replace(
      /import\s+\{[^}]*\}\s+from\s+['"]remotion['"];?\s*/g,
      ''
    );
    
    // 移除 'use client' 指令（不需要）
    codeToCompile = codeToCompile.replace(/['"]use\s+client['"];?\s*/g, '');
    
    // 确保代码有导出语句
    if (!codeToCompile.includes('export')) {
      // 如果没有导出，添加默认导出
      codeToCompile = `${codeToCompile}\n\nexport { MyVideo };`;
    }

    // 使用 ESM 格式编译（最佳实践：支持 export 语句）
    // 这是 CodeSandbox、StackBlitz 等在线 IDE 使用的标准方法
    // 注意：transform API 不支持 external，我们会在执行时注入依赖
    const result = await esbuild.transform(codeToCompile, {
      loader: 'tsx',
      target: 'es2020',
      format: 'esm', // ESM 格式，支持 export 语句
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      // 定义全局变量，避免 esbuild 报错
      define: {
        'process.env.NODE_ENV': '"production"',
      },
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

