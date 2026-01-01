'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface LoadingStep {
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

export default function LoadingDebug() {
  const [steps, setSteps] = useState<LoadingStep[]>([
    { name: 'React Hydration', status: 'loading' },
    { name: 'Monaco Editor', status: 'pending' },
    { name: 'Remotion Player', status: 'pending' },
    { name: 'esbuild-wasm', status: 'pending' },
    { name: 'Zustand Store', status: 'pending' },
  ]);

  useEffect(() => {
    // 检查 React
    setSteps((prev) =>
      prev.map((s) =>
        s.name === 'React Hydration'
          ? { ...s, status: 'success' }
          : s
      )
    );

    // 检查 Monaco Editor
    const checkMonaco = async () => {
      try {
        const monaco = await import('@monaco-editor/react');
        setSteps((prev) =>
          prev.map((s) =>
            s.name === 'Monaco Editor'
              ? { ...s, status: 'success' }
              : s
          )
        );
      } catch (error: any) {
        setSteps((prev) =>
          prev.map((s) =>
            s.name === 'Monaco Editor'
              ? { ...s, status: 'error', error: error.message }
              : s
          )
        );
      }
    };
    checkMonaco();

    // 检查 Remotion
    const checkRemotion = async () => {
      try {
        const remotion = await import('@remotion/player');
        setSteps((prev) =>
          prev.map((s) =>
            s.name === 'Remotion Player'
              ? { ...s, status: 'success' }
              : s
          )
        );
      } catch (error: any) {
        setSteps((prev) =>
          prev.map((s) =>
            s.name === 'Remotion Player'
              ? { ...s, status: 'error', error: error.message }
              : s
          )
        );
      }
    };
    checkRemotion();

    // 检查 esbuild
    const checkEsbuild = async () => {
      try {
        const esbuild = await import('esbuild-wasm');
        setSteps((prev) =>
          prev.map((s) =>
            s.name === 'esbuild-wasm'
              ? { ...s, status: 'loading' }
              : s
          )
        );
        await esbuild.initialize({
          wasmURL: 'https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm',
        });
        setSteps((prev) =>
          prev.map((s) =>
            s.name === 'esbuild-wasm'
              ? { ...s, status: 'success' }
              : s
          )
        );
      } catch (error: any) {
        setSteps((prev) =>
          prev.map((s) =>
            s.name === 'esbuild-wasm'
              ? { ...s, status: 'error', error: error.message }
              : s
          )
        );
      }
    };
    checkEsbuild();

    // 检查 Zustand
    try {
      const store = require('@/lib/store/editor-store');
      setSteps((prev) =>
        prev.map((s) =>
          s.name === 'Zustand Store'
            ? { ...s, status: 'success' }
            : s
        )
      );
    } catch (error: any) {
      setSteps((prev) =>
        prev.map((s) =>
          s.name === 'Zustand Store'
            ? { ...s, status: 'error', error: error.message }
            : s
        )
      );
    }
  }, []);

  const allLoaded = steps.every((s) => s.status === 'success');
  const hasError = steps.some((s) => s.status === 'error');

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          Loading Status
        </h2>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              {step.status === 'loading' && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              )}
              {step.status === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {step.status === 'error' && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              {step.status === 'pending' && (
                <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-200">
                  {step.name}
                </div>
                {step.error && (
                  <div className="text-xs text-red-400 mt-1">{step.error}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        {allLoaded && (
          <div className="mt-4 p-3 bg-green-900/30 rounded text-green-400 text-sm">
            ✓ All components loaded successfully
          </div>
        )}
        {hasError && (
          <div className="mt-4 p-3 bg-red-900/30 rounded text-red-400 text-sm">
            ⚠ Some components failed to load. Check console for details.
          </div>
        )}
        <div className="mt-4 text-xs text-gray-500">
          Open browser console (F12) for detailed error messages
        </div>
      </div>
    </div>
  );
}

