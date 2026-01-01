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

        // 3. 创建组件
        const compiledCode = result.code || '';
        const componentFunc = new Function(
          'React',
          'remotion',
          `
          ${compiledCode}
          return MyVideo;
        `
        );

        // 动态导入依赖
        const React = await import('react');
        const remotion = await import('remotion');
        const ComponentClass = componentFunc(React, remotion);

        setComponent(() => ComponentClass);
      } catch (error: any) {
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
          <Player
            component={component}
            durationInFrames={300}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            controls
            style={{
              width: '100%',
              maxWidth: '800px',
            }}
          />
        </div>
      </div>
    </div>
  );
}

