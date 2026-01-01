'use client';

import { useEffect, useState, useCallback } from 'react';
import { Player } from '@remotion/player';
import { useCodeStore } from '@/lib/store/code-store';
import { useEditorStore } from '@/lib/store/editor-store';
import { compileTypeScript } from '@/lib/compiler/code-compiler';
import { validateCode } from '@/lib/security/code-validator';
import { Loader2, AlertCircle } from 'lucide-react';
import { debounce } from 'lodash-es';

export default function VideoPreview() {
  const { code } = useCodeStore();
  const { setCompiling, setCompilationError, compilationError } =
    useEditorStore();
  const [component, setComponent] = useState<React.ComponentType | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const compileAndValidate = useCallback(
    async (codeToCompile: string) => {
      setCompiling(true);
      setValidationError(null);
      setCompilationError(null);

      try {
        // 1. 验证代码安全性
        const validation = await validateCode(codeToCompile);
        if (!validation.isValid) {
          setValidationError(validation.errors.join('\n'));
          setCompiling(false);
          return;
        }

        // 2. 编译代码
        const result = await compileTypeScript(codeToCompile);
        if (!result.success) {
          setCompilationError(result.error || 'Compilation failed');
          setCompiling(false);
          return;
        }

        // 3. 创建组件（使用 ESM + 动态 import，最佳实践）
        // 这是 CodeSandbox、StackBlitz 等在线 IDE 使用的标准方法
        const compiledCode = result.code || '';
        
        // 动态导入依赖
        const ReactModule = await import('react');
        const remotionModule = await import('remotion');
        
        // React 可能是 default export 或命名 export
        const React = ReactModule.default || ReactModule;
        const remotion = remotionModule.default || remotionModule;

        // 使用模块包装器执行 ESM 代码（最佳实践）
        // 将编译后的 ESM 代码转换为可执行的函数，注入 React 和 remotion
        
        // 从 remotion 解构常用 API（方便用户直接使用）
        const {
          AbsoluteFill,
          useCurrentFrame,
          interpolate,
          useVideoConfig,
          staticFile,
          Sequence,
          Video,
          Audio,
          Img,
          OffthreadVideo,
        } = remotion;

        // 创建模块执行环境（CommonJS 风格）
        const moduleExports: any = {};
        const module = { exports: moduleExports };
        const exports = moduleExports;

        // 将 ESM 代码包装为可执行的函数
        // 处理各种 export 格式
        let executableCode = compiledCode;
        
        // 1. 处理 export const MyVideo = ...
        executableCode = executableCode.replace(
          /export\s+const\s+MyVideo\s*=/g,
          'const MyVideo ='
        );
        
        // 2. 处理 export { MyVideo }
        executableCode = executableCode.replace(
          /export\s+\{\s*MyVideo\s*\};?/g,
          'module.exports = { MyVideo };'
        );
        
        // 3. 处理 export { MyVideo as default } 或其他形式
        executableCode = executableCode.replace(
          /export\s+\{[^}]*MyVideo[^}]*\};?/g,
          'module.exports = { MyVideo };'
        );
        
        // 4. 确保最后有导出语句
        if (!executableCode.includes('module.exports')) {
          // 如果代码中有 MyVideo 但没有导出，添加导出
          if (executableCode.includes('const MyVideo') || executableCode.includes('let MyVideo') || executableCode.includes('var MyVideo')) {
            executableCode += '\nmodule.exports = { MyVideo };';
          }
        }

        // 执行代码，注入 React 和 remotion 以及所有常用 API
        // eslint-disable-next-line no-eval
        const executeModule = new Function(
          'React',
          'remotion',
          'module',
          'exports',
          'AbsoluteFill',
          'useCurrentFrame',
          'interpolate',
          'useVideoConfig',
          'staticFile',
          'Sequence',
          'Video',
          'Audio',
          'Img',
          'OffthreadVideo',
          executableCode
        );

        // 执行模块，获取导出的组件
        executeModule(
          React,
          remotion,
          module,
          exports,
          AbsoluteFill,
          useCurrentFrame,
          interpolate,
          useVideoConfig,
          staticFile,
          Sequence,
          Video,
          Audio,
          Img,
          OffthreadVideo
        );

        // 尝试多种方式获取组件
        let ComponentClass = moduleExports.MyVideo;
        
        // 如果 module.exports 中没有，尝试从全局作用域获取
        if (!ComponentClass) {
          try {
            // eslint-disable-next-line no-eval
            const globalScope = eval('(function() { ' + executableCode + '; return typeof MyVideo !== "undefined" ? MyVideo : null; })()');
            ComponentClass = globalScope;
          } catch (evalError) {
            // eval 失败，继续尝试其他方法
            console.warn('Failed to get component from global scope:', evalError);
          }
        }
        
        // 如果还是没有，检查是否有 MyVideo 变量但没有正确导出
        if (!ComponentClass) {
          // 输出调试信息
          console.error('Failed to extract MyVideo component. Debug info:', {
            moduleExports,
            hasMyVideoInCode: executableCode.includes('MyVideo'),
            compiledCodePreview: compiledCode.substring(0, 300),
          });
          
          throw new Error(
            'Failed to extract MyVideo component. Make sure your code exports a component named "MyVideo".\n' +
            'Example: export const MyVideo = () => { ... } or export { MyVideo }'
          );
        }

        // 验证组件是否有效
        if (typeof ComponentClass !== 'function') {
          throw new Error(
            `MyVideo is not a valid React component. Got: ${typeof ComponentClass}. ` +
            'Make sure your code exports a function component named "MyVideo".'
          );
        }

        console.log('✅ Component extracted successfully:', {
          componentType: typeof ComponentClass,
          componentName: ComponentClass.name || 'Anonymous',
          isFunction: typeof ComponentClass === 'function',
          componentPreview: ComponentClass.toString().substring(0, 200),
        });

        // 包装组件以确保 Remotion Player 可以正确使用
        // Remotion 需要组件接受 props 并返回 React 元素
        const WrappedComponent = React.forwardRef((props: any, ref: any) => {
          try {
            // 确保使用 React.createElement 来创建组件
            if (typeof ComponentClass === 'function') {
              return React.createElement(ComponentClass, props);
            }
            throw new Error('ComponentClass is not a function');
          } catch (error: any) {
            console.error('Error rendering component:', error);
            return React.createElement('div', {
              style: { padding: '20px', color: 'red', backgroundColor: 'black' },
            }, `Error: ${error.message}`);
          }
        });

        // 设置显示名称以便调试
        WrappedComponent.displayName = 'MyVideo';

        console.log('✅ Wrapped component created:', {
          displayName: WrappedComponent.displayName,
          componentType: typeof WrappedComponent,
        });

        setComponent(() => WrappedComponent);
      } catch (error: any) {
        console.error('❌ Component extraction failed:', error);
        setCompilationError(error.message || 'Unknown error');
      } finally {
        setCompiling(false);
      }
    },
    [setCompiling, setCompilationError]
  );

  // 防抖编译
  const debouncedCompile = useCallback(
    debounce((code: string) => compileAndValidate(code), 1000),
    [compileAndValidate]
  );

  useEffect(() => {
    debouncedCompile(code);
    return () => debouncedCompile.cancel();
  }, [code, debouncedCompile]);

  if (validationError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-2xl px-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-300 mb-2">
            Security Validation Failed
          </h3>
          <pre className="text-sm text-red-400 bg-red-900/30 p-4 rounded-lg overflow-auto text-left">
            {validationError}
          </pre>
        </div>
      </div>
    );
  }

  if (compilationError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-2xl px-4">
          <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-orange-300 mb-2">
            Compilation Error
          </h3>
          <pre className="text-sm text-orange-400 bg-orange-900/30 p-4 rounded-lg overflow-auto text-left">
            {compilationError}
          </pre>
        </div>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Compiling and validating code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-medium text-gray-300">Video Preview</h3>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
          {component ? (
            <Player
              component={component}
              durationInFrames={300}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={30}
              controls
              acknowledgeRemotionLicense={true}
              style={{
                width: '100%',
                maxWidth: '800px',
              }}
            />
          ) : (
            <div className="w-full h-96 flex items-center justify-center text-gray-400">
              No component to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

