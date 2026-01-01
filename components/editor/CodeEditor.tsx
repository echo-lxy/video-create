'use client';

import { useEffect, useRef } from 'react';
import Editor, { Monaco, loader } from '@monaco-editor/react';
import { useCodeStore } from '@/lib/store/code-store';
import { useEditorStore } from '@/lib/store/editor-store';
import { Loader2 } from 'lucide-react';

// 配置 Monaco Editor 使用本地资源（优化版 - 优先本地，快速回退）
if (typeof window !== 'undefined') {
  // 禁用 source map 加载，避免 404 错误
  (window as any).__MONACO_EDITOR_SOURCE_MAP__ = false;
  
  const isProduction = window.location.hostname === 'echo-lxy.github.io' || 
    process.env.NODE_ENV === 'production';
  const basePath = isProduction ? '/video-create' : '';
  const monacoPath = `${basePath}/monaco/vs`;
  
  // 优先使用本地资源（开发环境直接使用，不检查）
  if (process.env.NODE_ENV === 'development') {
    // 开发环境：直接使用本地资源（如果存在）
    loader.config({ 
      paths: { 
        vs: '/monaco/vs' // 开发环境直接使用 /monaco/vs
      } 
    });
    console.log('✅ Monaco Editor: Using local resources (dev mode)');
  } else {
    // 生产环境：使用 basePath
    loader.config({ 
      paths: { 
        vs: monacoPath 
      } 
    });
    
    // 快速检查本地资源（1秒超时，更快）
    const checkLocal = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 缩短到1秒
        
        const response = await fetch(`${monacoPath}/loader.js`, { 
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // 使用更快的 CDN 镜像（unpkg.com 通常比 jsdelivr 快）
          console.log('⚠️ Monaco Editor local files not found, using CDN (unpkg.com)');
          loader.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } });
        } else {
          console.log('✅ Using local Monaco Editor (faster!)');
        }
      } catch {
        // 检查失败，使用更快的 CDN 镜像
        console.log('⚠️ Monaco Editor: Using CDN fallback (unpkg.com)');
        loader.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } });
      }
    };
    
    // 异步检查，不阻塞
    checkLocal();
  }
}

export default function CodeEditor() {
  const { code, setCode } = useCodeStore();
  const { setCompiling, setCompilationError } = useEditorStore();
  const editorRef = useRef<any>(null);

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    try {
      if (!editor || !monaco) {
        console.warn('Editor or Monaco not available');
        return;
      }

      editorRef.current = editor;

      // 延迟配置，确保 Monaco 完全初始化
      setTimeout(() => {
        try {
          // 确保 Monaco 和 TypeScript 服务已加载
          if (!monaco?.languages?.typescript?.typescriptDefaults) {
            console.warn('Monaco TypeScript service not available yet');
            return;
          }

          // 配置 Monaco Editor
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution:
              monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types'],
          });

          // 添加 Remotion 类型提示
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            `
            declare module 'remotion' {
              export const AbsoluteFill: any;
              export const useCurrentFrame: () => number;
              export const interpolate: (input: number, inputRange: number[], outputRange: number[], options?: any) => number;
            }
            `,
            'file:///node_modules/@types/remotion/index.d.ts'
          );
        } catch (error: any) {
          console.error('Failed to configure Monaco:', error);
        }
      }, 100);
    } catch (error: any) {
      console.error('Error in handleEditorDidMount:', error);
    }
  }

  function handleEditorWillMount(monaco: Monaco) {
    try {
      // 禁用 source map 加载，避免 404 错误
      if (monaco?.editor) {
        // 设置环境变量，禁用 source map
        (window as any).__MONACO_EDITOR_SOURCE_MAP__ = false;
      }

      // 在编辑器挂载前进行一些初始化
      // 延迟加载 TypeScript 服务以加快初始加载
      if (monaco?.languages?.typescript) {
        // 延迟配置 TypeScript，减少初始加载时间
        setTimeout(() => {
          try {
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
              target: monaco.languages.typescript.ScriptTarget.ES2020,
              allowNonTsExtensions: true,
              moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
              module: monaco.languages.typescript.ModuleKind.ESNext,
              noEmit: true,
              esModuleInterop: true,
              jsx: monaco.languages.typescript.JsxEmit.React,
              reactNamespace: 'React',
              allowJs: true,
              typeRoots: ['node_modules/@types'],
            });
          } catch (e) {
            console.warn('Failed to configure TypeScript defaults:', e);
          }
        }, 1000); // 延迟 1 秒配置
      }
    } catch (error: any) {
      console.error('Error in handleEditorWillMount:', error);
    }
  }

  function handleEditorChange(value: string | undefined) {
    if (value !== undefined) {
      setCode(value);
      setCompilationError(null);
    }
  }

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        value={code}
        onChange={handleEditorChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        loading={
          <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading Monaco Editor...</p>
              <p className="text-xs text-gray-500 mt-1">~2-3MB, may take 10-20s</p>
            </div>
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          // 深度优化：禁用所有非必需功能以加快加载
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: 'off',
          hover: { enabled: false },
          parameterHints: { enabled: false },
          // 禁用更多功能以加快加载
          codeLens: false,
          colorDecorators: false,
          folding: true, // 保留代码折叠（常用功能）
          links: false,
          occurrencesHighlight: 'off',
          renderWhitespace: 'none',
          selectionHighlight: false,
          // 最小化 TypeScript 服务
          formatOnPaste: false,
          formatOnType: false,
        }}
        onValidate={(markers) => {
          // 静默处理验证错误，避免阻塞
          if (markers.length > 0) {
            console.debug('Editor validation markers:', markers.length);
          }
        }}
      />
    </div>
  );
}

