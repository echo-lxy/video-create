import * as esbuild from 'esbuild-wasm';

let initialized = false;
let initializationPromise: Promise<void> | null = null;

export async function initializeCompiler() {
  // 如果已经初始化，直接返回
  if (initialized) return;
  
  // 如果正在初始化，等待它完成
  if (initializationPromise) {
    return initializationPromise;
  }

  // 创建初始化 Promise，确保只执行一次
  initializationPromise = (async () => {
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

      // 检查是否已经初始化（防止重复初始化）
      // 注意：esbuild-wasm 的 initialize 只能调用一次
      // 如果已经初始化，这里会抛出错误，我们需要捕获它
      try {
        await esbuild.initialize({
          wasmURL,
        });
        initialized = true;
        console.log('✅ esbuild initialized successfully');
      } catch (initError: any) {
        // 如果错误是 "Cannot call initialize more than once"，说明已经初始化过了
        if (initError?.message?.includes('Cannot call "initialize" more than once') ||
            initError?.message?.includes('already initialized')) {
          console.log('ℹ️ esbuild already initialized');
          initialized = true;
        } else {
          throw initError;
        }
      }
    } catch (error) {
      console.error('Failed to initialize esbuild:', error);
      // 重置 promise，允许重试（可选）
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
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
    
    // 修复常见的语法错误：from'xxx' -> from 'xxx'（缺少空格）
    codeToCompile = codeToCompile.replace(/from(['"])/g, "from $1");
    
    // 移除各种形式的 React 导入（React 和所有 hooks 会作为全局变量注入）
    codeToCompile = codeToCompile.replace(
      /import\s+(?:\*\s+as\s+)?React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?\s*/g,
      ''
    );
    // 移除 React hooks 导入（useMemo, useState, useEffect 等会作为全局变量注入）
    codeToCompile = codeToCompile.replace(
      /import\s+\{[^}]*\}\s+from\s+['"]react['"];?\s*/g,
      ''
    );
    
    // 移除 remotion 的导入（AbsoluteFill, useCurrentFrame 等会作为全局变量注入）
    // 注意：useMemo 等 React hooks 不应该从 remotion 导入，如果用户这样做了，需要修复
    codeToCompile = codeToCompile.replace(
      /import\s+\{[^}]*useMemo[^}]*\}\s+from\s+['"]remotion['"];?\s*/g,
      '' // 移除从 remotion 导入 useMemo 的错误用法
    );
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
    
    // 自动修复：检测并修复 "export const MyVideo = () => helperFunction()" 模式
    // 这种模式是错误的，因为 helperFunction 中使用了 hooks
    const helperCallPattern = /export\s+const\s+MyVideo\s*=\s*\(\)\s*=>\s*(\w+)\s*\(\s*\)\s*;?\s*$/m;
    const helperCallMatch = codeToCompile.match(helperCallPattern);
    
    if (helperCallMatch) {
      const helperName = helperCallMatch[1];
      // 查找 helper 函数的定义（箭头函数或普通函数）
      const arrowFunctionPattern = new RegExp(`(const|let|var|function)\\s+${helperName}\\s*=\\s*(\\([^)]*\\))?\\s*=>\\s*{([\\s\\S]*?)};?`, 'm');
      const normalFunctionPattern = new RegExp(`function\\s+${helperName}\\s*\\([^)]*\\)\\s*{([\\s\\S]*?)}`, 'm');
      
      let helperBody = '';
      let helperMatch = codeToCompile.match(arrowFunctionPattern) || codeToCompile.match(normalFunctionPattern);
      
      if (helperMatch) {
        helperBody = helperMatch[3] || helperMatch[1] || '';
        // 移除 helper 函数定义
        codeToCompile = codeToCompile.replace(arrowFunctionPattern, '').replace(normalFunctionPattern, '');
        // 替换组件定义，将 helper 函数体直接内联
        codeToCompile = codeToCompile.replace(
          helperCallPattern,
          `export const MyVideo = () => {\n    ${helperBody.trim()}\n};`
        );
      }
    }
    
    // 自动修复：将顶层常量移到组件内部
    // 查找 export const MyVideo 之前的所有顶层常量定义
    const exportIndex = codeToCompile.indexOf('export const MyVideo');
    if (exportIndex > 0) {
      const beforeExport = codeToCompile.substring(0, exportIndex);
      const afterExport = codeToCompile.substring(exportIndex);
      
      // 提取所有顶层常量（const/let/var 定义）
      const topLevelVars: Array<{full: string, name: string, value: string}> = [];
      const varPattern = /(const|let|var)\s+(\w+)\s*=\s*([^;]+(?:{[^}]*})?[^;]*);?\s*/g;
      let match;
      
      while ((match = varPattern.exec(beforeExport)) !== null) {
        // 跳过函数定义
        if (!match[3].includes('=>') && !match[3].includes('function')) {
          topLevelVars.push({
            full: match[0],
            name: match[2],
            value: match[3].trim()
          });
        }
      }
      
      // 如果找到顶层变量，将它们移到组件内部
      if (topLevelVars.length > 0) {
        // 移除顶层变量定义
        let cleanedBeforeExport = beforeExport;
        topLevelVars.forEach(v => {
          cleanedBeforeExport = cleanedBeforeExport.replace(v.full, '');
        });
        
        // 构建组件内部代码
        const varsCode = topLevelVars.map(v => `const ${v.name} = ${v.value};`).join('\n    ');
        
        // 提取组件函数体
        const componentBodyMatch = afterExport.match(/export\s+const\s+MyVideo\s*=\s*\(\)\s*=>\s*{([\s\S]*?)};?\s*$/);
        if (componentBodyMatch) {
          const existingBody = componentBodyMatch[1].trim();
          codeToCompile = cleanedBeforeExport + 
            `export const MyVideo = () => {\n    ${varsCode}\n    ${existingBody}\n};`;
        } else {
          // 如果没有函数体，直接添加变量
          codeToCompile = cleanedBeforeExport + 
            afterExport.replace(
              /export\s+const\s+MyVideo\s*=\s*\(\)\s*=>\s*/,
              `export const MyVideo = () => {\n    ${varsCode}\n    `
            ).replace(/;?\s*$/, '\n};');
        }
      }
    }
    
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

    // 处理编译后的代码
    // 注意：esbuild 编译后的代码应该已经是有效的 JavaScript，不需要移除 return
    // 之前的逻辑可能会错误地移除函数内部的 return 语句
    let compiledCode = result.code;
    
    // 只移除真正的顶层 return（在模块级别，不在任何函数/块内）
    // 使用更精确的检测：只有在函数/块外部且没有缩进的 return 才移除
    const lines = compiledCode.split('\n');
    const cleanedLines: string[] = [];
    let braceDepth = 0;
    let parenDepth = 0;
    let inFunction = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // 检测是否进入函数定义
      if (trimmed.match(/^(const|let|var|function|export\s+(const|let|var|function))\s+\w+\s*[=:]\s*(\([^)]*\)\s*)?=>/)) {
        inFunction = true;
      }
      
      // 计算大括号深度
      for (const char of line) {
        if (char === '{') {
          braceDepth++;
          inFunction = true; // 进入块作用域，可能是在函数内
        }
        if (char === '}') {
          braceDepth--;
          if (braceDepth === 0) {
            inFunction = false; // 退出到顶层
          }
        }
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
      }
      
      // 只有在真正的顶层（不在任何函数/块内）且有 return，才移除
      // 保留所有函数内部的 return 语句
      if (braceDepth === 0 && parenDepth === 0 && !inFunction && trimmed.startsWith('return ')) {
        // 检查这是否真的是顶层的 return（前面没有函数定义）
        const prevLines = lines.slice(Math.max(0, i - 10), i).join('\n');
        if (!prevLines.match(/=>\s*\{|\bfunction\s+\w+\s*\(/)) {
          continue; // 跳过真正的顶层 return
        }
      }
      
      cleanedLines.push(line);
    }
    
    compiledCode = cleanedLines.join('\n');

    return {
      success: true,
      code: compiledCode,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown compilation error',
    };
  }
}

