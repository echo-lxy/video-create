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
    editorRef.current = editor;

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
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
        loading={
          <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }
      />
    </div>
  );
}

