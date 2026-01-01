'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'Unknown error occurred';
      const errorStack = this.state.error?.stack || '';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div className="h-full flex items-center justify-center bg-[#1e1e1e] p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-[#252526] border border-red-500/50 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-300 mb-2">
                    组件渲染错误
                  </h3>
                  <p className="text-sm text-[#cccccc] mb-4">
                    您的代码在渲染时发生了错误。请检查代码并修复问题。
                  </p>
                  <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded p-3 mb-4">
                    <div className="text-xs font-mono text-red-400 mb-2">
                      {errorMessage}
                    </div>
                    {errorStack && (
                      <details className="mt-2">
                        <summary className="text-xs text-[#969696] cursor-pointer hover:text-[#cccccc] mb-2">
                          查看错误堆栈
                        </summary>
                        <pre className="text-xs text-[#969696] whitespace-pre-wrap overflow-auto max-h-40">
                          {errorStack}
                        </pre>
                      </details>
                    )}
                    {componentStack && (
                      <details className="mt-2">
                        <summary className="text-xs text-[#969696] cursor-pointer hover:text-[#cccccc] mb-2">
                          查看组件堆栈
                        </summary>
                        <pre className="text-xs text-[#969696] whitespace-pre-wrap overflow-auto max-h-40">
                          {componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={this.handleReset}
                      className="bg-[#007acc] hover:bg-[#005a9e]"
                    >
                      重试
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // 清空组件，让用户重新编译
                        this.handleReset();
                        // 触发代码重新编译（通过修改代码触发）
                        const event = new CustomEvent('force-recompile');
                        window.dispatchEvent(event);
                      }}
                    >
                      清除并重新编译
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

