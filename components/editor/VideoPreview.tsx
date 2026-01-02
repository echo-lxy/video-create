'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Player, PlayerRef } from '@remotion/player';
import { useCodeStore } from '@/lib/store/code-store';
import { useEditorStore } from '@/lib/store/editor-store';
import { compileTypeScript } from '@/lib/compiler/code-compiler';
import { validateCode } from '@/lib/security/code-validator';
import { Loader2, AlertCircle, Settings, Download, X, Info, Play, RefreshCw } from 'lucide-react';
import { debounce } from 'lodash-es';
import Timeline from './Timeline';
import ExportDialog, { ExportSettings } from './ExportDialog';
import { exportWithSettings } from '@/lib/video/export-formats';
import { Input } from '@/components/ui/input';
import { useTimelineStore } from '@/lib/store/timeline-store';
import { useCompilationStore } from '@/lib/store/compilation-store';
import { cn } from '@/lib/utils/cn';

export default function VideoPreview() {
  const { code, videoConfig, setVideoConfig } = useCodeStore();
  const { setCompiling } = useEditorStore();
  const [component, setComponent] = useState<React.ComponentType | null>(null);
  const [lastValidComponent, setLastValidComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compiling, setCompilingState] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [tempConfig, setTempConfig] = useState(videoConfig);
  const { setDuration } = useTimelineStore();
  const compileAbortRef = useRef<(() => void) | null>(null);
  
  const { durationInFrames, fps, width, height } = videoConfig;
  
  // 更新时长
  useEffect(() => {
    setDuration(durationInFrames, fps);
  }, [durationInFrames, fps, setDuration]);

  // 同步临时配置
  useEffect(() => {
    setTempConfig(videoConfig);
  }, [videoConfig]);
  
  // 编译和验证函数 - 使用useCallback稳定化
  const compileAndValidate = useCallback(async (codeToCompile: string) => {
      // 如果有正在进行的编译，先取消它
      if (compileAbortRef.current) {
        compileAbortRef.current();
      }

      let aborted = false;
      compileAbortRef.current = () => {
        aborted = true;
      };

      setCompiling(true);
      setCompilingState(true);
      // 不立即清除错误，保留给用户看

      try {
        // 验证代码
        const validation = await validateCode(codeToCompile);
        if (aborted) return;
        
        if (!validation.isValid) {
          throw new Error('代码验证失败:\n' + validation.errors.join('\n'));
        }

        // 编译代码
        const result = await compileTypeScript(codeToCompile);
        if (aborted) return;
        
        // 存储编译结果到 store（供 AI 工具读取）
        const { setCompilationResult } = useCompilationStore.getState();
        if (!result.success) {
          // 编译失败，存储错误信息
          setCompilationResult({
            code: codeToCompile,
            success: false,
            errors: [result.error || 'Unknown compilation error'],
            warnings: [],
          });
          throw new Error('编译失败:\n' + (result.error || 'Unknown compilation error'));
        } else {
          // 编译成功
          setCompilationResult({
            code: codeToCompile,
            success: true,
            errors: [],
            warnings: [],
          });
        }

        // 加载React和Remotion模块
        const [ReactModule, remotionModule] = await Promise.all([
          import('react'),
          import('remotion')
        ]);
        
        if (aborted) return;

        const React = ReactModule.default || ReactModule;
        const {
          AbsoluteFill, Sequence, Video, Audio, Img, staticFile,
          useCurrentFrame, useVideoConfig, interpolate, spring,
          Easing, continueRender, delayRender, getInputProps,
          interpolateColors: remotionInterpolateColors
        } = remotionModule;
        
        // 如果 remotion 模块没有 interpolateColors，提供一个简单的实现
        const interpolateColors = remotionInterpolateColors || ((frame: number, inputRange: number[], outputRange: string[]) => {
          // 简单的颜色插值实现（如果 remotion 没有提供）
          if (inputRange.length !== outputRange.length || inputRange.length < 2) {
            return outputRange[0] || '#000000';
          }
          
          // 找到 frame 所在的区间
          let index = 0;
          for (let i = 0; i < inputRange.length - 1; i++) {
            if (frame >= inputRange[i] && frame <= inputRange[i + 1]) {
              index = i;
              break;
            }
            if (frame < inputRange[i]) {
              return outputRange[0];
            }
          }
          if (frame > inputRange[inputRange.length - 1]) {
            return outputRange[outputRange.length - 1];
          }
          
          // 线性插值（简化版，实际应该进行 RGB 插值）
          const t = (frame - inputRange[index]) / (inputRange[index + 1] - inputRange[index]);
          return t < 0.5 ? outputRange[index] : outputRange[index + 1];
        });

        // 处理export语句
        let executableCode = result.code || '';
        
        // 记录原始代码用于调试
        console.log('📝 Compiled code (before processing):', executableCode.substring(0, 500));
        
        // 移除各种 export 语句，但保留 MyVideo 的定义
        executableCode = executableCode
          // 处理 export const/let/var/function MyVideo = ...
          .replace(/export\s+(const|let|var|function|class)\s+MyVideo\s*=/g, 'const MyVideo =')
          // 处理 export default MyVideo
          .replace(/export\s+default\s+MyVideo;?/g, '')
          // 处理 export { MyVideo }
          .replace(/export\s*{\s*MyVideo\s*};?/g, '')
          // 处理 export { MyVideo as default }
          .replace(/export\s*{\s*MyVideo\s+as\s+default\s*};?/g, '')
          // 处理 export { MyVideo, ... } (保留其他导出，只移除 MyVideo)
          .replace(/export\s*{\s*([^}]*?)\bMyVideo\b([^}]*?)\s*};?/g, (match, before, after) => {
            const rest = (before + after).trim().replace(/^,\s*|,\s*$/g, '');
            return rest ? `export { ${rest} };` : '';
          });
        
        // 检查代码中是否包含 MyVideo 定义
        const hasMyVideoDefinition = /(?:const|let|var|function|class)\s+MyVideo\s*=/.test(executableCode);
        if (!hasMyVideoDefinition) {
          console.error('❌ MyVideo component not found in compiled code');
          console.error('📝 Executable code:', executableCode);
          throw new Error('编译后的代码中未找到 MyVideo 组件定义。请确保代码中定义了名为 MyVideo 的组件。');
        }

        // 从 React 模块中解构所有常用的 hooks
        const {
          useMemo,
          useState,
          useEffect,
          useCallback,
          useRef,
          useReducer,
          useContext,
          useLayoutEffect,
          useImperativeHandle,
          useDebugValue,
          memo,
          forwardRef,
          lazy,
          Suspense,
          Fragment,
        } = React;

        // 创建组件函数
        // 方案：使用 new Function 创建函数，但确保在正确的 React 上下文中执行
        // 关键：将所有 API 作为参数传入，并在函数体内直接使用（不使用解构）
        // 安全地转义代码以便插入到字符串中
        // 使用 JSON.stringify 来转义代码片段（用于错误消息）
        const codePreview = JSON.stringify(executableCode.substring(0, 200));
        
        // 转义 executableCode 以便安全地插入到字符串中
        // 关键：我们需要将代码直接插入到函数体中
        // 注意：换行符、制表符等应该保留原样，不需要转义
        // 只需要转义可能在字符串字面量中导致问题的字符
        // 转义顺序很重要：先转义反斜杠，再转义其他字符
        let escapedCode = executableCode
          .replace(/\\/g, '\\\\')    // 先转义反斜杠（必须在最前面）
          .replace(/'/g, "\\'");      // 转义单引号
          // 注意：不转义换行符、制表符等，因为它们应该保留原样
          // 不转义反引号和美元符号，因为代码是直接插入的，不是作为字符串
        
        // 调试：记录转义后的代码
        console.log('📝 Original executable code (first 500 chars):', executableCode.substring(0, 500));
        console.log('🔍 Escaped code (first 500 chars):', escapedCode.substring(0, 500));
        
        // 使用字符串拼接构建函数体（使用单引号字符串）
        // 代码直接插入，不需要引号包裹
        const functionBody = '// 所有 API 现在都可以直接使用，无需导入\n' +
          '// 这些变量已经在函数参数中定义，可以直接使用\n' +
          '// 注意：hooks 必须从同一个 React 实例传入，否则会报错\n' +
          '\n' +
          'try {\n' +
          '  // 执行用户代码\n' +
          escapedCode + '\n' +
          '\n' +
          '  // 检查 MyVideo 是否已定义\n' +
          '  if (typeof MyVideo === "undefined") {\n' +
          '    // 尝试从全局作用域查找\n' +
          '    if (typeof window !== "undefined" && window.MyVideo) {\n' +
          '      return window.MyVideo;\n' +
          '    }\n' +
          '    console.error("MyVideo is undefined. Code preview:", ' + codePreview + ');\n' +
          '    throw new Error("未找到 MyVideo 组件。请确保导出了名为 MyVideo 的组件。\\n\\n编译后的代码片段：" + ' + codePreview + ');\n' +
          '  }\n' +
          '\n' +
          '  // 验证 MyVideo 是一个函数\n' +
          '  if (typeof MyVideo !== "function") {\n' +
          '    console.error("MyVideo is not a function. Type:", typeof MyVideo, "Value:", MyVideo);\n' +
          '    throw new Error("MyVideo 不是一个函数组件。当前类型：" + typeof MyVideo);\n' +
          '  }\n' +
          '\n' +
          '  console.log("✅ MyVideo component found and is a function");\n' +
          '  return MyVideo;\n' +
          '} catch (error) {\n' +
          '  console.error("Component execution error:", error);\n' +
          '  console.error("Executable code preview:", ' + codePreview + ');\n' +
          '  throw new Error("组件执行错误: " + error.message + "\\n\\n代码片段：" + ' + codePreview + ');\n' +
          '}';
        
        const componentFunc = new Function(
          'React',
          'AbsoluteFill',
          'Sequence',
          'Video',
          'Audio',
          'Img',
          'staticFile',
          'useCurrentFrame',
          'useVideoConfig',
          'interpolate',
          'spring',
          'Easing',
          'continueRender',
          'delayRender',
          'getInputProps',
          // React hooks - 必须从同一个 React 实例传入
          'useMemo',
          'useState',
          'useEffect',
          'useCallback',
          'useRef',
          'useReducer',
          'useContext',
          'useLayoutEffect',
          'memo',
          'forwardRef',
          'lazy',
          'Suspense',
          'Fragment',
          // 添加 interpolateColors 支持
          'interpolateColors',
          functionBody
        );

        // 从同一个 React 实例中获取所有 hooks
        // 这确保了 hooks 能正确识别 React 上下文
        const Component = componentFunc(
          React,
          AbsoluteFill,
          Sequence,
          Video,
          Audio,
          Img,
          staticFile,
          useCurrentFrame,
          useVideoConfig,
          interpolate,
          spring,
          Easing,
          continueRender,
          delayRender,
          getInputProps,
          // React hooks - 从同一个 React 实例传入
          React.useMemo,
          React.useState,
          React.useEffect,
          React.useCallback,
          React.useRef,
          React.useReducer,
          React.useContext,
          React.useLayoutEffect,
          React.memo,
          React.forwardRef,
          React.lazy,
          React.Suspense,
          React.Fragment,
          // 添加 interpolateColors
          interpolateColors
        );

        if (aborted) return;

        if (!Component) {
          console.error('❌ Component is null or undefined');
          throw new Error('组件创建失败：Component 为 null 或 undefined');
        }

        if (typeof Component !== 'function') {
          console.error('❌ Component is not a function. Type:', typeof Component, 'Value:', Component);
          throw new Error('组件创建失败：Component 不是一个函数，类型为 ' + typeof Component);
        }

        console.log('✅ Component compiled successfully!', {
          type: typeof Component,
          name: Component.name || 'anonymous',
          isFunction: typeof Component === 'function',
        });

        // 成功：更新组件并清除错误
        // 使用函数形式确保状态正确更新
        console.log('📦 About to set component state, Component type:', typeof Component, Component);
        setComponent(() => {
          console.log('📦 Setting component state - inside setter');
          return Component;
        });
        setLastValidComponent(() => {
          console.log('💾 Setting lastValidComponent state - inside setter');
          return Component;
        });
        setError(null);
        setCompilingState(false);
        
        // 强制触发一次状态检查
        setTimeout(() => {
          console.log('🔍 Post-set state check:', {
            componentSet: true,
            ComponentType: typeof Component
          });
        }, 100);
        
      } catch (err) {
        if (aborted) return;
        
        console.error('❌ 编译错误:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.log('Error set to:', errorMessage);
        
        // 错误时不清除组件，保持显示上一个有效的组件
        // 这样用户可以边看预览边修复代码
      } finally {
        if (!aborted) {
          setCompiling(false);
          setCompilingState(false);
          compileAbortRef.current = null;
        }
      }
  }, [setCompiling]);

  // 防抖编译
  const debouncedCompile = useMemo(
    () => debounce((code: string) => {
      if (code && code.trim()) {
        console.log('🚀 Starting compilation from debounced function');
        compileAndValidate(code);
      }
    }, 1000),
    [compileAndValidate]
  );

  // 初始加载时立即编译一次（如果还没有组件）
  useEffect(() => {
    if (code && code.trim() && !component && !compiling) {
      console.log('🔄 Initial load: compiling code');
      // 延迟一点，确保所有依赖都已加载
      const timer = setTimeout(() => {
        compileAndValidate(code);
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  // 监听代码变化
  useEffect(() => {
    if (code && code.trim()) {
      console.log('🔄 Code changed, triggering compile...', code.substring(0, 50));
      debouncedCompile(code);
    }
    
    return () => {
      debouncedCompile.cancel();
      // 组件卸载时取消编译
      if (compileAbortRef.current) {
        compileAbortRef.current();
      }
    };
  }, [code, debouncedCompile]);

  // 监听videoConfig变化，需要重新编译以更新视频参数
  useEffect(() => {
    if (component && code) {
      // 延迟重新编译，避免连续变化
      const timer = setTimeout(() => {
        compileAndValidate(code);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [durationInFrames, fps, width, height]); // 不要依赖compileAndValidate，它是稳定的

  // 导出处理
  const handleExport = async (settings: ExportSettings) => {
    const exportComponent = component || lastValidComponent;
    if (!exportComponent) {
      setError('没有可导出的组件');
      return;
    }

    setIsExporting(true);
    setError(null);
    
    try {
      await exportWithSettings(
        exportComponent,
        settings,
        {
          durationInFrames: videoConfig.durationInFrames,
          fps: videoConfig.fps,
          width: videoConfig.width,
          height: videoConfig.height
        },
        (progress) => {
          console.log('Export progress:', progress);
        }
      );
      alert('导出成功！');
    } catch (err) {
      console.error('Export error:', err);
      setError('导出失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  };

  // 保存设置
  const handleSaveSettings = () => {
    setVideoConfig(tempConfig);
    setShowSettings(false);
  };

  // 重新编译
  const handleRetry = () => {
    if (code) {
      setError(null);
      compileAndValidate(code);
    }
  };

  // 使用最后有效的组件或当前组件
  const displayComponent = component || lastValidComponent;

  // 调试：只在状态变化时打印
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const stateInfo = {
        hasComponent: !!component,
        hasLastValidComponent: !!lastValidComponent,
        hasDisplayComponent: !!displayComponent,
        compiling,
        error,
        componentType: component ? typeof component : 'null',
        componentName: component?.name || 'anonymous',
        lastValidType: lastValidComponent ? typeof lastValidComponent : 'null',
        lastValidName: lastValidComponent?.name || 'anonymous',
        videoConfig: {
          width,
          height,
          fps,
          durationInFrames,
        }
      };
      console.log('🎬 VideoPreview state updated:', stateInfo);
      
      // 如果组件存在但不显示，打印警告
      if ((component || lastValidComponent) && !displayComponent) {
        console.warn('⚠️ Component exists but displayComponent is null!', {
          component,
          lastValidComponent,
          displayComponent
        });
      }
      
      // 如果组件存在但编译中，打印信息
      if (displayComponent && compiling) {
        console.log('⏳ Component exists but still compiling...');
      }
      
      // 如果有错误，打印详细信息
      if (error) {
        console.error('❌ Current error:', error);
      }
    }
  }, [component, lastValidComponent, displayComponent, compiling, error, width, height, fps, durationInFrames]);

    return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* 错误提示 - 非阻塞式 */}
      {error && (
        <div className="flex-shrink-0 bg-red-900/40 border-b border-red-700 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-300 mb-1">编译错误</p>
            <p className="text-xs text-red-400 font-mono whitespace-pre-wrap break-words max-h-24 overflow-auto">
              {error}
            </p>
            <button
              onClick={handleRetry}
              className="mt-2 h-7 px-2 flex items-center gap-1.5 rounded bg-red-800/50 hover:bg-red-800/70 text-red-200 text-xs transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>重新编译</span>
            </button>
          </div>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 p-1 rounded hover:bg-red-800/50 text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 工具栏 */}
      <div className="flex-shrink-0 h-12 bg-[#2d2d30] border-b border-[#3e3e42] px-4 flex items-center justify-between">
        {/* 左侧：视频信息 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-[#007acc]" />
            <span className="text-sm font-medium text-[#cccccc]">视频预览</span>
            {compiling && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#007acc]" />
            )}
      </div>
          
          <div className="h-4 w-px bg-[#3e3e42]" />
          
          <div className="flex items-center gap-2 text-xs text-[#969696]">
            <span className="font-mono">{width}×{height}</span>
            <span>·</span>
            <span className="font-mono">{fps} fps</span>
            <span>·</span>
            <span className="font-mono">{(durationInFrames / fps).toFixed(2)}s</span>
          </div>
        </div>

        {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            disabled={isExporting}
            className={cn(
              'h-8 px-3 flex items-center gap-2 rounded text-sm transition-colors',
              isExporting
                ? 'bg-[#3e3e42] text-[#969696] cursor-not-allowed'
                : 'bg-[#37373d] text-[#cccccc] hover:bg-[#3e3e42]'
            )}
          >
            <Settings className="w-4 h-4" />
            <span>设置</span>
          </button>
          
          <button
            onClick={() => setShowExportDialog(true)}
            disabled={!displayComponent || isExporting}
            className={cn(
              'h-8 px-3 flex items-center gap-2 rounded text-sm transition-colors',
              !displayComponent || isExporting
                ? 'bg-[#3e3e42] text-[#969696] cursor-not-allowed'
                : 'bg-[#007acc] text-white hover:bg-[#005a9e]'
            )}
          >
            <Download className="w-4 h-4" />
            <span>导出</span>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        <Allotment vertical>
          {/* 播放器 */}
          <Allotment.Pane minSize={200} preferredSize="60%">
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1e1e] p-6">
              {compiling ? (
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-[#007acc]" />
                  <p className="text-sm text-[#969696]">编译中...</p>
                  <p className="text-xs text-[#5a5a5a] mt-1">首次编译可能需要几秒钟</p>
                </div>
              ) : !displayComponent ? (
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-[#007acc]" />
                  <p className="text-sm text-[#969696]">等待编译...</p>
                  <p className="text-xs text-[#5a5a5a] mt-1">请检查代码是否正确</p>
                  <button
                    onClick={handleRetry}
                    className="mt-4 h-8 px-4 rounded bg-[#007acc] hover:bg-[#005a9e] text-white text-sm transition-colors"
                  >
                    重新编译
                  </button>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  {/* 播放器容器 */}
                  <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl" style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: `${width}/${height}`,
                    minWidth: 320,
                    minHeight: 180
                  }}>
                    {displayComponent ? (
                      <div className="w-full h-full relative">
                        <Player
                          key={`${width}-${height}-${fps}-${durationInFrames}-${component ? 'has-component' : 'no-component'}`}
                          ref={playerRef}
                          component={displayComponent}
                          durationInFrames={durationInFrames}
                          compositionWidth={width}
                          compositionHeight={height}
                          fps={fps}
                          style={{
                            width: '100%',
                            height: '100%',
                          }}
                          controls
                          acknowledgeRemotionLicense
                        />
                        {/* 调试信息（开发环境） */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-1 rounded font-mono z-10">
                            Component: {displayComponent?.name || 'anonymous'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <p>组件未加载</p>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </div>
          </Allotment.Pane>

          {/* 时间轴 */}
          <Allotment.Pane minSize={120} preferredSize={180}>
            <Timeline playerRef={playerRef} />
          </Allotment.Pane>
        </Allotment>
      </div>

      {/* 设置对话框 */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl w-[480px] max-w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* 标题栏 */}
            <div className="sticky top-0 bg-[#2d2d30] border-b border-[#3e3e42] px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#cccccc]">视频设置</h3>
              <button
                onClick={() => {
                  setTempConfig(videoConfig);
                  setShowSettings(false);
                }}
                className="p-1 rounded hover:bg-[#3e3e42] text-[#969696] hover:text-[#cccccc] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
        </div>
        
            {/* 内容 */}
            <div className="p-6 space-y-6">
              {/* 分辨率 */}
              <div>
                <label className="text-sm font-medium text-[#cccccc] mb-3 block">分辨率</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#969696] mb-1.5 block">宽度 (px)</label>
                    <Input
                      type="number"
                      value={tempConfig.width}
                      onChange={(e) => setTempConfig({ ...tempConfig, width: Number(e.target.value) })}
                      className="bg-[#3c3c3c] border-[#3e3e42] text-[#cccccc] h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#969696] mb-1.5 block">高度 (px)</label>
                <Input
                  type="number"
                      value={tempConfig.height}
                      onChange={(e) => setTempConfig({ ...tempConfig, height: Number(e.target.value) })}
                      className="bg-[#3c3c3c] border-[#3e3e42] text-[#cccccc] h-9"
                    />
                  </div>
                </div>
                <p className="text-xs text-[#5a5a5a] mt-2">
                  常用: 1920×1080 (Full HD), 1280×720 (HD), 3840×2160 (4K)
                </p>
              </div>

              {/* 帧率和时长 */}
              <div>
                <label className="text-sm font-medium text-[#cccccc] mb-3 block">时间设置</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#969696] mb-1.5 block">帧率 (fps)</label>
                <Input
                  type="number"
                      value={tempConfig.fps}
                      onChange={(e) => setTempConfig({ ...tempConfig, fps: Number(e.target.value) })}
                      className="bg-[#3c3c3c] border-[#3e3e42] text-[#cccccc] h-9"
                />
              </div>
              <div>
                    <label className="text-xs text-[#969696] mb-1.5 block">时长 (帧)</label>
                <Input
                  type="number"
                      value={tempConfig.durationInFrames}
                      onChange={(e) => setTempConfig({ ...tempConfig, durationInFrames: Number(e.target.value) })}
                      className="bg-[#3c3c3c] border-[#3e3e42] text-[#cccccc] h-9"
                />
              </div>
                </div>
                <p className="text-xs text-[#5a5a5a] mt-2">
                  当前时长: {(tempConfig.durationInFrames / tempConfig.fps).toFixed(2)} 秒
                </p>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="sticky bottom-0 bg-[#2d2d30] border-t border-[#3e3e42] px-6 py-4 flex gap-3">
              <button
                onClick={handleSaveSettings}
                className="flex-1 h-9 bg-[#007acc] hover:bg-[#005a9e] text-white rounded text-sm font-medium transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setTempConfig(videoConfig);
                  setShowSettings(false);
                }}
                className="flex-1 h-9 bg-[#3e3e42] hover:bg-[#4e4e52] text-[#cccccc] rounded text-sm font-medium transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导出对话框 */}
      {showExportDialog && (
        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          onExport={handleExport}
          durationInFrames={videoConfig.durationInFrames}
          fps={videoConfig.fps}
          width={videoConfig.width}
          height={videoConfig.height}
        />
      )}
    </div>
  );
}
