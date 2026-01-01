'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Player, PlayerRef } from '@remotion/player';
import { useCodeStore } from '@/lib/store/code-store';
import { useEditorStore } from '@/lib/store/editor-store';
import { compileTypeScript } from '@/lib/compiler/code-compiler';
import { validateCode } from '@/lib/security/code-validator';
import { Loader2, AlertCircle, Settings, Download } from 'lucide-react';
import { debounce } from 'lodash-es';
import Timeline from './Timeline';
import ExportDialog, { ExportSettings } from './ExportDialog';
import { exportWithSettings } from '@/lib/video/export-formats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorBoundary } from 'react-error-boundary';
import { useTimelineStore } from '@/lib/store/timeline-store';

export default function VideoPreview() {
  const { code, videoConfig, setVideoConfig } = useCodeStore();
  const { setCompiling, setCompilationError, compilationError } = useEditorStore();
  const [component, setComponent] = useState<React.ComponentType | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const playerRef = useRef<PlayerRef>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ renderedFrames: number; encodedFrames: number } | null>(null);
  const [showVideoSettings, setShowVideoSettings] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [tempVideoConfig, setTempVideoConfig] = useState(videoConfig);
  const [playerHeight, setPlayerHeight] = useState(60); // 播放器区域占比（百分比）
  const { setDuration } = useTimelineStore();
  
  const { durationInFrames, fps, width, height } = videoConfig;

  useEffect(() => {
    setDuration(durationInFrames, fps);
  }, [durationInFrames, fps, setDuration]);
  
  useEffect(() => {
    setTempVideoConfig(videoConfig);
  }, [videoConfig]);
  
  const handleSaveVideoConfig = useCallback(() => {
    setVideoConfig(tempVideoConfig);
    setShowVideoSettings(false);
  }, [tempVideoConfig, setVideoConfig]);

  const compileAndValidate = useCallback(
    async (codeToCompile: string) => {
      setCompiling(true);
      setValidationError(null);
      setCompilationError(null);
      setRenderError(null);

      try {
        const validation = await validateCode(codeToCompile);
        if (!validation.isValid) {
          setValidationError(validation.errors.join('\n'));
          setCompiling(false);
          return;
        }

        const result = await compileTypeScript(codeToCompile);
        if (!result.success) {
          setCompilationError(result.error || 'Compilation failed');
          setCompiling(false);
          return;
        }

        const compiledCode = result.code || '';
        const ReactModule = await import('react');
        const remotionModule = await import('remotion');
        const React = ReactModule.default || ReactModule;
        const remotion = remotionModule.default || remotionModule;

        const {
          AbsoluteFill, Sequence, Video, Audio, Img, staticFile,
          useCurrentFrame, useVideoConfig, interpolate, spring,
          Easing, continueRender, delayRender, getInputProps
        } = remotion;

        const executableCode = `
          ${compiledCode}
          
          // 确保 MyVideo 被导出
          if (typeof MyVideo === 'undefined') {
            throw new Error('MyVideo component is not defined. Make sure you export a component named "MyVideo".');
          }
        `;

        const moduleExports: any = {};
        const moduleFactory = new Function(
          'React',
          'remotion',
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
          'module',
          'exports',
          executableCode
        );

        moduleFactory(
          React,
          remotion,
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
          { exports: moduleExports },
          moduleExports
        );

        let ComponentClass = moduleExports.MyVideo;
        
        if (!ComponentClass) {
          try {
            const globalScope = eval('(function() { ' + executableCode + '; return typeof MyVideo !== "undefined" ? MyVideo : null; })()');
            ComponentClass = globalScope;
          } catch (evalError) {
            console.warn('Failed to get component from global scope:', evalError);
          }
        }
        
        if (!ComponentClass) {
          throw new Error(
            'Failed to extract MyVideo component. Make sure your code exports a component named "MyVideo".\n' +
            'Example: export const MyVideo = () => { ... } or export { MyVideo }'
          );
        }

        if (typeof ComponentClass !== 'function') {
          throw new Error(
            `MyVideo is not a valid React component. Got: ${typeof ComponentClass}. ` +
            'Make sure your code exports a function component named "MyVideo".'
          );
        }

        const StableComponent = ComponentClass;
        setComponent(() => StableComponent);
        setRenderError(null);
      } catch (error: any) {
        console.error('❌ Component extraction failed:', error);
        setCompilationError(error.message || 'Unknown error');
        setComponent(null);
        setRenderError(null);
      } finally {
        setCompiling(false);
      }
    },
    [setCompiling, setCompilationError]
  );

  const debouncedCompile = useCallback(
    debounce((code: string) => compileAndValidate(code), 1000),
    [compileAndValidate]
  );

  useEffect(() => {
    debouncedCompile(code);
    return () => debouncedCompile.cancel();
  }, [code, debouncedCompile]);

  useEffect(() => {
    const handleForceRecompile = () => {
      console.log('Force recompiling code...');
      setRenderError(null);
      setComponent(null);
      debouncedCompile(code);
    };

    window.addEventListener('force-recompile', handleForceRecompile);
    return () => {
      window.removeEventListener('force-recompile', handleForceRecompile);
    };
  }, [code, debouncedCompile]);

  const stableComponent = useMemo(() => {
    if (!component) return null;
    return component;
  }, [component]);

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
        (progress: { renderedFrames: number; encodedFrames: number; totalFrames: number; stage: string }) => {
          setExportProgress({
            renderedFrames: progress.renderedFrames,
            encodedFrames: progress.encodedFrames,
          });
        }
      );
      setExportProgress(null);
      alert('视频导出成功！');
    } catch (error: any) {
      console.error('导出失败:', error);
      setExportProgress(null);
      alert(`视频导出失败: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [stableComponent, durationInFrames, fps, width, height]);

  if (!component) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#007acc]" />
          <p className="text-[#cccccc]">Compiling and validating code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* 顶部工具栏 - VSCode 风格 */}
      <div className="h-9 flex-shrink-0 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-[#cccccc]">视频预览</h3>
          {component && (
            <span className="text-xs text-[#969696]">
              {component.displayName || component.name || 'Unknown'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowVideoSettings(!showVideoSettings)}
            className="h-6 px-2 text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            设置
          </Button>
          {stableComponent && (
            <Button
              size="sm"
              onClick={() => setShowExportDialog(true)}
              className="h-6 px-2 text-xs bg-[#007acc] hover:bg-[#005a9e] text-white"
              disabled={isExporting}
            >
              <Download className="w-3 h-3 mr-1" />
              {isExporting ? '导出中...' : '导出'}
            </Button>
          )}
        </div>
      </div>

      {/* 错误提示（非阻塞） */}
      {(validationError || compilationError || renderError) && (
        <div className="flex-shrink-0 px-4 pt-2 pb-2 bg-[#1e1e1e] border-b border-[#3e3e42]">
          {validationError && (
            <div className="mb-1 rounded border border-red-500/40 bg-red-900/20 px-3 py-1.5 text-xs text-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">安全校验失败</div>
                  <pre className="mt-0.5 whitespace-pre-wrap text-[10px] text-red-200/90 overflow-auto max-h-20">
                    {validationError}
                  </pre>
                </div>
              </div>
            </div>
          )}
          {compilationError && (
            <div className="mb-1 rounded border border-orange-500/40 bg-orange-900/20 px-3 py-1.5 text-xs text-orange-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">编译错误</div>
                  <pre className="mt-0.5 whitespace-pre-wrap text-[10px] text-orange-200/90 overflow-auto max-h-20">
                    {compilationError}
                  </pre>
                </div>
              </div>
            </div>
          )}
          {renderError && (
            <div className="mb-1 rounded border border-red-500/40 bg-red-900/20 px-3 py-1.5 text-xs text-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">渲染错误</div>
                  <p className="mt-0.5 whitespace-pre-wrap text-[10px] text-red-200/90">
                    {renderError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 视频设置面板（可折叠） */}
      {showVideoSettings && (
        <div className="flex-shrink-0 p-3 bg-[#252526] border-b border-[#3e3e42]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#969696] mb-1 block">时长（帧）</label>
              <Input
                type="number"
                value={tempVideoConfig.durationInFrames}
                onChange={(e) => setTempVideoConfig({
                  ...tempVideoConfig,
                  durationInFrames: Math.max(1, parseInt(e.target.value) || 1),
                })}
                className="h-7 text-xs"
                min={1}
              />
              <p className="text-[10px] text-[#969696] mt-0.5">
                {(tempVideoConfig.durationInFrames / tempVideoConfig.fps).toFixed(1)} 秒
              </p>
            </div>
            <div>
              <label className="text-[10px] text-[#969696] mb-1 block">帧率 (fps)</label>
              <Input
                type="number"
                value={tempVideoConfig.fps}
                onChange={(e) => setTempVideoConfig({
                  ...tempVideoConfig,
                  fps: Math.max(1, Math.min(60, parseInt(e.target.value) || 30)),
                })}
                className="h-7 text-xs"
                min={1}
                max={60}
              />
            </div>
            <div>
              <label className="text-[10px] text-[#969696] mb-1 block">宽度 (px)</label>
              <Input
                type="number"
                value={tempVideoConfig.width}
                onChange={(e) => setTempVideoConfig({
                  ...tempVideoConfig,
                  width: Math.max(1, parseInt(e.target.value) || 1920),
                })}
                className="h-7 text-xs"
                min={1}
              />
            </div>
            <div>
              <label className="text-[10px] text-[#969696] mb-1 block">高度 (px)</label>
              <Input
                type="number"
                value={tempVideoConfig.height}
                onChange={(e) => setTempVideoConfig({
                  ...tempVideoConfig,
                  height: Math.max(1, parseInt(e.target.value) || 1080),
                })}
                className="h-7 text-xs"
                min={1}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleSaveVideoConfig}
              className="h-6 text-xs"
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
              className="h-6 text-xs"
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {/* 导出进度 */}
      {isExporting && exportProgress && (
        <div className="flex-shrink-0 px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className="w-3 h-3 animate-spin text-[#007acc]" />
            <span className="text-xs text-[#007acc]">
              导出中: {Math.round((exportProgress.encodedFrames / durationInFrames) * 100)}%
            </span>
          </div>
          <div className="w-full bg-[#3c3c3c] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#007acc] h-full transition-all duration-300"
              style={{ width: `${(exportProgress.encodedFrames / durationInFrames) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-[#969696] mt-1">
            已渲染: {exportProgress.renderedFrames}/{durationInFrames} 帧 | 
            已编码: {exportProgress.encodedFrames}/{durationInFrames} 帧
          </p>
        </div>
      )}

      {/* 主内容区 - 支持拖动分割（视频播放器 + 时间轴） */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Allotment
          vertical
          proportionalLayout={false}
          onChange={(sizes) => {
            if (sizes.length === 2) {
              const total = sizes[0] + sizes[1];
              setPlayerHeight((sizes[0] / total) * 100);
            }
          }}
        >
          {/* 视频播放器区域 */}
          <Allotment.Pane 
            minSize={200}
            preferredSize={playerHeight ? `${playerHeight}%` : '60%'}
          >
            <div className="w-full h-full flex items-center justify-center p-4 bg-[#1e1e1e] overflow-auto">
              {stableComponent ? (
                <ErrorBoundary
                  onError={(error: Error) => {
                    console.error('Player ErrorBoundary caught error:', error);
                    setRenderError(error.message || 'Component render failed');
                  }}
                  fallbackRender={({ error, resetErrorBoundary }) => (
                    <div className="w-full h-full flex items-center justify-center text-[#969696]">
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
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              setRenderError(null);
                              resetErrorBoundary();
                            }}
                          >
                            重试
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRenderError(null);
                              setComponent(null);
                              const event = new CustomEvent('force-recompile');
                              window.dispatchEvent(event);
                            }}
                          >
                            清除并重新编译
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                >
                  <div className="w-full max-w-6xl bg-black rounded-lg overflow-hidden shadow-2xl" style={{ minHeight: '400px' }}>
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
                  </div>
                </ErrorBoundary>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#969696]">
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
          </Allotment.Pane>

          {/* 时间轴区域 */}
          <Allotment.Pane 
            minSize={120}
            preferredSize={playerHeight ? `${100 - playerHeight}%` : '40%'}
          >
            <div className="w-full h-full bg-[#1e1e1e]">
              {stableComponent && <Timeline playerRef={playerRef} />}
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>

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
