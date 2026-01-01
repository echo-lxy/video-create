'use client';

import { useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useCodeStore } from '@/lib/store/code-store';
import { useEditorStore } from '@/lib/store/editor-store';
import { Loader2 } from 'lucide-react';

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
      // 在编辑器挂载前进行一些初始化
      if (monaco?.languages?.typescript) {
        console.log('Monaco Editor will mount, TypeScript service available');
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
          // 禁用一些可能导致问题的功能，加快加载
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: 'off',
          // 减少初始加载的功能
          hover: { enabled: false },
          parameterHints: { enabled: false },
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

