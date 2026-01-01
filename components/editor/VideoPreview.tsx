'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { useCodeStore } from '@/lib/store/code-store';
import { useEditorStore } from '@/lib/store/editor-store';
import { compileTypeScript } from '@/lib/compiler/code-compiler';
import { validateCode } from '@/lib/security/code-validator';
import { Loader2, AlertCircle, Settings } from 'lucide-react';
import { debounce } from 'lodash-es';
import Timeline from './Timeline';
import ExportDialog, { ExportSettings } from './ExportDialog';
import { exportWithSettings } from '@/lib/video/export-formats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorBoundary } from './ErrorBoundary';
import { SafeComponentWrapper } from './SafeComponentWrapper';
import { useTimelineStore } from '@/lib/store/timeline-store';
import { Download } from 'lucide-react';

export default function VideoPreview() {
  const { code, videoConfig, setVideoConfig } = useCodeStore();
  const { setCompiling, setCompilationError, compilationError } =
    useEditorStore();
  const [component, setComponent] = useState<React.ComponentType | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const playerRef = useRef<PlayerRef>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ renderedFrames: number; encodedFrames: number } | null>(null);
  const [showVideoSettings, setShowVideoSettings] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [tempVideoConfig, setTempVideoConfig] = useState(videoConfig);
  const { setDuration } = useTimelineStore();
  
  // 使用可配置的视频设置
  const { durationInFrames, fps, width, height } = videoConfig;

  // 同步视频配置到 Timeline
  useEffect(() => {
    setDuration(durationInFrames, fps);
  }, [durationInFrames, fps, setDuration]);
  
  // 当 videoConfig 变化时，更新临时配置
  useEffect(() => {
    setTempVideoConfig(videoConfig);
  }, [videoConfig]);
  
  // 保存视频配置
  const handleSaveVideoConfig = useCallback(() => {
    setVideoConfig(tempVideoConfig);
    setShowVideoSettings(false);
  }, [tempVideoConfig, setVideoConfig]);

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
        
        // 从 remotion 解构所有常用 API（方便用户直接使用，无需导入）
        // 包括：组件、Hooks、工具函数、动画函数等
        const {
          // 组件
          AbsoluteFill,
          Sequence,
          Video,
          Audio,
          Img,
          OffthreadVideo,
          // Hooks
          useCurrentFrame,
          useVideoConfig,
          // 工具函数
          interpolate,
          spring,
          staticFile: remotionStaticFile,
          // Easing
          Easing,
          // 其他常用 API
          continueRender,
          delayRender,
          getInputProps,
        } = remotion;

        // 创建自定义 staticFile 函数，支持从资源库获取
        let staticFile: (pathOrId: string) => string;
        try {
          const { useAssetsStore } = await import('@/lib/store/assets-store');
          const getAssetUrl = useAssetsStore.getState().getAssetUrl;
          
          // 自定义 staticFile：优先从资源库获取，否则使用 remotion 的 staticFile
          staticFile = (pathOrId: string): string => {
            // 如果是以 asset_ 开头的 ID，从资源库获取
            if (pathOrId.startsWith('asset_')) {
              const url = getAssetUrl(pathOrId);
              if (url) {
                return url;
              }
            }
            // 否则使用 remotion 的 staticFile
            return remotionStaticFile(pathOrId);
          };
        } catch (error) {
          // 如果无法加载 assets store，使用 remotion 的 staticFile
          staticFile = remotionStaticFile;
        }

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
        // 这样用户可以直接使用这些 API，无需导入
        // 注意：如果某个 API 不存在，使用 remotion 对象作为后备（用户可以使用 remotion.spring 等）
        // eslint-disable-next-line no-eval
        const executeModule = new Function(
          'React',
          'remotion',
          'module',
          'exports',
          // 组件
          'AbsoluteFill',
          'Sequence',
          'Video',
          'Audio',
          'Img',
          'OffthreadVideo',
          // Hooks
          'useCurrentFrame',
          'useVideoConfig',
          // 工具函数
          'interpolate',
          'spring',
          'staticFile',
          // Easing
          'Easing',
          // 其他常用 API
          'continueRender',
          'delayRender',
          'getInputProps',
          executableCode
        );

        // 执行模块，获取导出的组件
        // 注入所有 Remotion API，用户可以直接使用
        // 如果某个 API 不存在，用户也可以使用 remotion.spring 等方式访问
        executeModule(
          React,
          remotion,
          module,
          exports,
          // 组件
          AbsoluteFill,
          Sequence,
          Video,
          Audio,
          Img,
          OffthreadVideo,
          // Hooks
          useCurrentFrame,
          useVideoConfig,
          // 工具函数
          interpolate,
          spring,
          staticFile,
          // Easing
          Easing,
          // 其他常用 API
          continueRender,
          delayRender,
          getInputProps
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

        // 直接使用组件，Remotion Player 可以直接使用函数组件
        // 不需要复杂的包装，只需要确保组件是有效的 React 组件
        console.log('✅ Component ready, setting to state:', {
          componentType: typeof ComponentClass,
          componentName: ComponentClass.name || 'Anonymous',
          isFunction: typeof ComponentClass === 'function',
        });

        // 验证组件是否有效
        if (typeof ComponentClass !== 'function') {
          throw new Error(
            `MyVideo is not a valid React component. Got: ${typeof ComponentClass}. ` +
            'Make sure your code exports a function component named "MyVideo".'
          );
        }

        // 测试组件是否可以安全创建（不实际渲染，只检查）
        try {
          // 创建一个测试实例来验证组件
          const testProps = {};
          const testElement = React.createElement(ComponentClass, testProps);
          
          if (!testElement || typeof testElement !== 'object') {
            throw new Error('Component creation test failed');
          }
        } catch (testError: any) {
          console.warn('Component validation warning:', testError);
          // 不阻止，继续使用组件（可能只是测试环境问题）
        }

        // 使用 useMemo 包装组件，确保组件引用稳定，避免 React Hooks 顺序问题
        // 直接设置组件，但使用稳定的引用
        const StableComponent = ComponentClass;
        setComponent(() => StableComponent);
        setRenderError(null); // 清除之前的渲染错误
      } catch (error: any) {
        console.error('❌ Component extraction failed:', error);
        setCompilationError(error.message || 'Unknown error');
        setComponent(null); // 清除组件，防止渲染错误
        setRenderError(null);
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

  // 监听强制重新编译事件
  useEffect(() => {
    const handleForceRecompile = () => {
      console.log('Force recompiling code...');
      setRenderError(null);
      setComponent(null);
      // 触发重新编译
      debouncedCompile(code);
    };

    window.addEventListener('force-recompile', handleForceRecompile);
    return () => {
      window.removeEventListener('force-recompile', handleForceRecompile);
    };
  }, [code, debouncedCompile]);

  if (validationError) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
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
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
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

  // 使用 useMemo 确保组件引用稳定，避免 React Hooks 顺序问题
  // 创建一个安全的组件包装器，确保错误不会传播
  const safeComponent = useMemo(() => {
    if (!component) return null;
    
    // 创建一个包装组件，用错误边界保护
    const SafeWrappedComponent: React.ComponentType = (props: any) => {
      return (
        <SafeComponentWrapper
          component={component}
          onError={(error: Error) => {
            console.error('SafeComponentWrapper caught error in wrapped component:', error);
            setRenderError(error.message);
          }}
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e] text-red-400">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">组件渲染失败</p>
                <p className="text-xs text-[#969696] mt-1">
                  请检查代码并修复错误
                </p>
              </div>
            </div>
          }
          {...props}
        />
      );
    };
    
    // 复制组件名称以便调试
    SafeWrappedComponent.displayName = component.displayName || component.name || 'SafeWrappedComponent';
    
    return SafeWrappedComponent;
  }, [component]);

  // 保持向后兼容
  const stableComponent = safeComponent;

  // 处理视频导出 - 使用新的导出对话框
  const handleExport = useCallback(async (settings: ExportSettings) => {
    if (!stableComponent) {
      alert('请先编译代码，生成视频组件');
      return;
    }

    setIsExporting(true);
    setExportProgress({ renderedFrames: 0, encodedFrames: 0 });
    
    try {
      await exportWithSettings(
        stableComponent,
        settings,
        {
          durationInFrames,
          fps,
          width,
          height,
        },
        (progress) => {
          setExportProgress({
            renderedFrames: progress.renderedFrames,
            encodedFrames: progress.encodedFrames,
          });
          const progressPercent = Math.round((progress.encodedFrames / progress.totalFrames) * 100);
          console.log(`导出进度: ${progressPercent}% (${progress.stage})`);
        }
      );
      
      setExportProgress(null);
      alert('导出成功！');
    } catch (error: any) {
      console.error('导出失败:', error);
      setExportProgress(null);
      alert(`导出失败: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [stableComponent, durationInFrames, fps, width, height]);

  // 调试信息
  useEffect(() => {
    const store = useEditorStore.getState();
    if (component) {
      console.log('📹 VideoPreview: Component ready for Player', {
        componentType: typeof component,
        componentName: component.displayName || component.name || 'Unknown',
        hasComponent: !!component,
        stableComponent: !!stableComponent,
        playerRef: !!playerRef.current,
      });
    } else {
      console.log('⏳ VideoPreview: Waiting for component...', {
        isCompiling: store.isCompiling,
        compilationError: store.compilationError,
        validationError,
        codeLength: code.length,
      });
    }
  }, [component, stableComponent, code, validationError]);

  // 监听 Player 加载状态
  useEffect(() => {
    if (stableComponent && playerRef.current) {
      console.log('✅ Player ref is ready:', {
        hasRef: !!playerRef.current,
        refType: typeof playerRef.current,
      });
    }
  }, [stableComponent, playerRef]);

  if (!component) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#007acc]" />
          <p className="text-[#cccccc]">Compiling and validating code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="p-4 border-b border-[#3e3e42]">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-[#cccccc]">Video Preview</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowVideoSettings(!showVideoSettings)}
                className="h-6 px-2"
              >
                <Settings className="w-3 h-3" />
              </Button>
            </div>
            {component && (
              <p className="text-xs text-[#969696] mt-1">
                Component: {component.displayName || component.name || 'Unknown'}
              </p>
            )}
            <p className="text-xs text-[#969696] mt-1">
              时长: {(durationInFrames / fps).toFixed(1)}秒 ({durationInFrames} 帧 @ {fps} fps) | 分辨率: {width}×{height}
            </p>
            {isExporting && exportProgress && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-[#007acc]" />
                  <span className="text-xs text-[#007acc]">
                    导出中: {Math.round((exportProgress.encodedFrames / durationInFrames) * 100)}%
                  </span>
                </div>
                <div className="mt-1 w-full bg-[#3c3c3c] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#007acc] h-full transition-all duration-300"
                    style={{ width: `${(exportProgress.encodedFrames / durationInFrames) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[#969696] mt-1">
                  已渲染: {exportProgress.renderedFrames}/{durationInFrames} 帧 | 
                  已编码: {exportProgress.encodedFrames}/{durationInFrames} 帧
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* 视频设置面板 */}
        {showVideoSettings && (
          <div className="mt-4 p-4 bg-[#252526] rounded-lg border border-[#3e3e42]">
            <h4 className="text-xs font-medium text-[#cccccc] mb-3">视频设置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#969696] mb-1 block">时长（帧）</label>
                <Input
                  type="number"
                  value={tempVideoConfig.durationInFrames}
                  onChange={(e) => setTempVideoConfig({
                    ...tempVideoConfig,
                    durationInFrames: Math.max(1, parseInt(e.target.value) || 1),
                  })}
                  className="h-8 text-xs"
                  min={1}
                />
                <p className="text-xs text-[#969696] mt-1">
                  {(tempVideoConfig.durationInFrames / tempVideoConfig.fps).toFixed(1)} 秒
                </p>
              </div>
              <div>
                <label className="text-xs text-[#969696] mb-1 block">帧率 (fps)</label>
                <Input
                  type="number"
                  value={tempVideoConfig.fps}
                  onChange={(e) => setTempVideoConfig({
                    ...tempVideoConfig,
                    fps: Math.max(1, Math.min(60, parseInt(e.target.value) || 30)),
                  })}
                  className="h-8 text-xs"
                  min={1}
                  max={60}
                />
              </div>
              <div>
                <label className="text-xs text-[#969696] mb-1 block">宽度 (px)</label>
                <Input
                  type="number"
                  value={tempVideoConfig.width}
                  onChange={(e) => setTempVideoConfig({
                    ...tempVideoConfig,
                    width: Math.max(1, parseInt(e.target.value) || 1920),
                  })}
                  className="h-8 text-xs"
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs text-[#969696] mb-1 block">高度 (px)</label>
                <Input
                  type="number"
                  value={tempVideoConfig.height}
                  onChange={(e) => setTempVideoConfig({
                    ...tempVideoConfig,
                    height: Math.max(1, parseInt(e.target.value) || 1080),
                  })}
                  className="h-8 text-xs"
                  min={1}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                onClick={handleSaveVideoConfig}
                className="h-7 text-xs"
              >
                保存
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTempVideoConfig(videoConfig);
                  setShowVideoSettings(false);
                }}
                className="h-7 text-xs"
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="bg-black rounded-lg overflow-hidden shadow-2xl w-full max-w-4xl">
          {stableComponent ? (
            <ErrorBoundary
              onError={(error: Error, errorInfo: React.ErrorInfo) => {
                console.error('Outer ErrorBoundary caught error:', error, errorInfo);
                setRenderError(error.message || 'Component render failed');
              }}
              fallback={
                <div className="w-full h-96 flex items-center justify-center text-[#969696]">
                  <div className="text-center max-w-md px-4">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-300 mb-2">
                      组件渲染错误
                    </h3>
                    <p className="text-sm text-[#cccccc] mb-4">
                      您的代码在渲染时发生了错误。请检查代码并修复问题。
                    </p>
                    {renderError && (
                      <pre className="text-xs text-red-400 bg-red-900/30 p-3 rounded overflow-auto text-left max-h-32 mb-4">
                        {renderError}
                      </pre>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        setRenderError(null);
                        setComponent(null);
                        // 触发重新编译
                        const event = new CustomEvent('force-recompile');
                        window.dispatchEvent(event);
                      }}
                    >
                      清除错误并重试
                    </Button>
                  </div>
                </div>
              }
            >
              <div className="w-full" style={{ minHeight: '400px', position: 'relative' }}>
                {/* Player 使用已经安全包装的组件 */}
                <Player
                  ref={playerRef}
                  component={stableComponent}
                  durationInFrames={durationInFrames}
                  compositionWidth={width}
                  compositionHeight={height}
                  fps={fps}
                  controls={true}
                  loop
                  clickToPlay={false}
                  doubleClickToFullscreen
                  acknowledgeRemotionLicense={true}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    height: 'auto',
                    minHeight: '400px',
                  }}
                />
                {/* 调试信息覆盖层 */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded z-10">
                    <div>Component: {component?.displayName || component?.name || 'Unknown'}</div>
                    <div>Frame: {playerRef.current?.getCurrentFrame?.()?.toFixed(0) || 'N/A'}</div>
                    <div>Playing: {playerRef.current?.isPlaying?.() ? 'Yes' : 'No'}</div>
                  </div>
                )}
              </div>
            </ErrorBoundary>
          ) : (
            <div className="w-full h-96 flex items-center justify-center text-[#969696]">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>No component to preview</p>
                <p className="text-xs text-[#969696] mt-2">
                  {useEditorStore.getState().isCompiling ? 'Compiling...' : 'Waiting for code...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Timeline */}
      {stableComponent && (
        <Timeline playerRef={playerRef} />
      )}

      {/* 导出按钮（在预览区域） */}
      {stableComponent && (
        <div className="absolute top-4 right-4 z-20">
          <Button
            size="sm"
            onClick={() => setShowExportDialog(true)}
            className="bg-[#007acc] hover:bg-[#005a9e] text-white"
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? '导出中...' : '导出'}
          </Button>
        </div>
      )}

      {/* 导出对话框 */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
      />
    </div>
  );
}

