'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 安全的组件包装器
 * 用于包装用户编写的组件，确保任何错误都不会导致应用崩溃
 * 
 * 这是业内最佳实践：
 * 1. 使用 React Error Boundary 捕获渲染错误
 * 2. 使用 try-catch 捕获执行错误
 * 3. 提供错误恢复机制
 */
interface SafeComponentWrapperProps {
  component: React.ComponentType;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  [key: string]: any; // 允许传递其他 props 给组件
}

interface SafeComponentWrapperState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class SafeComponentWrapper extends Component<
  SafeComponentWrapperProps,
  SafeComponentWrapperState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: SafeComponentWrapperProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<SafeComponentWrapperState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SafeComponentWrapper caught error:', error, errorInfo);
    
    this.setState((prev) => ({
      error,
      errorCount: prev.errorCount + 1,
    }));

    // 调用外部错误处理
    if (this.props.onError) {
      this.props.onError(error);
    }

    // 如果错误次数过多，阻止自动重试
    if (this.state.errorCount >= 3) {
      console.error('Too many errors, stopping auto-retry');
    }
  }

  componentDidUpdate(prevProps: SafeComponentWrapperProps) {
    // 如果组件引用变化，重置错误状态
    if (prevProps.component !== this.props.component && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
        errorCount: 0,
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { component: _, fallback: __, onError: ___, ...restProps } = this.props;
      const errorMessage = this.state.error?.message || 'Component render error';

      return (
        <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] p-4">
          <div className="max-w-md w-full">
            <div className="bg-[#252526] border border-red-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-300 mb-2">
                    组件渲染错误
                  </h4>
                  <p className="text-xs text-[#cccccc] mb-3">
                    {errorMessage}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={this.handleReset}
                      className="bg-[#007acc] hover:bg-[#005a9e] text-white h-7 text-xs"
                    >
                      重试
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        this.handleReset();
                        // 触发重新编译
                        window.dispatchEvent(new CustomEvent('force-recompile'));
                      }}
                      className="h-7 text-xs"
                    >
                      重新编译
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 安全渲染组件
    try {
      const { component: UserComponent, fallback, onError, children, ...restProps } = this.props;
      
      if (!UserComponent) {
        return null;
      }

      // 如果有 children，直接渲染 children（用于包裹其他组件）
      if (children) {
        return <>{children}</>;
      }

      // 否则使用 React.createElement 安全创建组件
      return React.createElement(UserComponent, restProps);
    } catch (error) {
      // 如果创建组件时出错，显示错误
      console.error('Error creating component:', error);
      return (
        <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-red-400 text-sm">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>组件创建失败</p>
            <p className="text-xs text-[#969696] mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      );
    }
  }
}

/**
 * 创建一个安全的组件包装器函数
 * 用于包装用户组件，确保错误不会传播
 */
export function createSafeComponent(
  UserComponent: React.ComponentType,
  onError?: (error: Error) => void
): React.ComponentType {
  return function SafeWrappedComponent(props: any) {
    return (
      <SafeComponentWrapper
        component={UserComponent}
        onError={onError}
        {...props}
      />
    );
  };
}


