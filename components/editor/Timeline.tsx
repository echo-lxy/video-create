'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTimelineStore } from '@/lib/store/timeline-store';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TimelineProps {
  playerRef?: React.RefObject<any>;
}

export default function Timeline({ playerRef }: TimelineProps) {
  const {
    currentFrame,
    durationInFrames,
    fps,
    zoom,
    scrollLeft,
    isPlaying,
    playbackSpeed,
    setCurrentFrame,
    setZoom,
    setScrollLeft,
    seekToFrame,
    setIsPlaying,
    play,
    pause,
  } = useTimelineStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const duration = durationInFrames / fps;
  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = duration * pixelsPerSecond;

  // 同步播放器状态
  useEffect(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    
    try {
      const playerIsPlaying = player.isPlaying?.() ?? false;
      
      // 只在状态不一致时同步
      if (isPlaying && !playerIsPlaying) {
        player.play();
      } else if (!isPlaying && playerIsPlaying) {
        player.pause();
      }

      // 同步播放速度
      if (player.setPlaybackRate && typeof player.setPlaybackRate === 'function') {
        player.setPlaybackRate(playbackSpeed);
      }
    } catch (error) {
      console.warn('Player sync error:', error);
      // 如果同步失败，尝试恢复状态
      if (playerRef?.current) {
        try {
          const playerIsPlaying = playerRef.current.isPlaying?.() ?? false;
          if (playerIsPlaying !== isPlaying) {
            setIsPlaying(playerIsPlaying);
          }
        } catch (e) {
          // 忽略错误
        }
      }
    }
  }, [isPlaying, playbackSpeed, playerRef, setIsPlaying]);

  // 监听播放器帧变化和播放状态
  useEffect(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    let lastPlayingState = isPlaying;
    
    const interval = setInterval(() => {
      try {
        const playerIsPlaying = player.isPlaying?.() ?? false;
        
        // 同步播放状态
        if (playerIsPlaying !== lastPlayingState) {
          lastPlayingState = playerIsPlaying;
          setIsPlaying(playerIsPlaying);
        }
        
        // 更新当前帧
        if (playerIsPlaying) {
          const frame = player.getCurrentFrame?.() ?? 0;
          const roundedFrame = Math.floor(frame);
          if (roundedFrame !== currentFrame) {
            setCurrentFrame(roundedFrame);
          }
          
          // 检查是否播放到末尾
          if (roundedFrame >= durationInFrames - 1) {
            setIsPlaying(false);
            player.pause?.();
          }
        }
      } catch (error) {
        // 忽略错误
      }
    }, Math.max(16, 1000 / fps / 2));

    return () => clearInterval(interval);
  }, [playerRef, fps, currentFrame, durationInFrames, setCurrentFrame, setIsPlaying, isPlaying]);

  // 处理时间轴点击
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const frame = Math.round((x / pixelsPerSecond) * fps);
    
    seekToFrame(frame);
    
    if (playerRef?.current?.seekTo) {
      playerRef.current.seekTo(frame);
    }
  }, [scrollLeft, pixelsPerSecond, fps, seekToFrame, playerRef]);

  // 处理播放头拖拽
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const frame = Math.round((x / pixelsPerSecond) * fps);
      
      seekToFrame(frame);
      
      if (playerRef?.current?.seekTo) {
        playerRef.current.seekTo(frame);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scrollLeft, pixelsPerSecond, fps, seekToFrame, playerRef]);

  // 处理时间轴滚动
  const handleScroll = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(Math.max(0.1, Math.min(10, zoom + delta)));
    } else {
      e.preventDefault();
      setScrollLeft(Math.max(0, scrollLeft - e.deltaY));
    }
  }, [zoom, scrollLeft, setZoom, setScrollLeft]);

  // 播放控制
  const handleTogglePlay = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const newIsPlaying = !isPlaying;
    
    // 更新store状态
    setIsPlaying(newIsPlaying);
    
    // 控制播放器
    if (playerRef?.current) {
      try {
        if (newIsPlaying) {
          playerRef.current.play();
        } else {
          playerRef.current.pause();
        }
      } catch (error) {
        console.error('Playback control error:', error);
        // 如果播放器操作失败，恢复状态
        setIsPlaying(!newIsPlaying);
      }
    }
  }, [isPlaying, playerRef, setIsPlaying]);

  const handleSeekBackward = () => {
    const newFrame = Math.max(0, currentFrame - fps);
    seekToFrame(newFrame);
    if (playerRef?.current?.seekTo) {
      playerRef.current.seekTo(newFrame);
    }
  };

  const handleSeekForward = () => {
    const newFrame = Math.min(durationInFrames - 1, currentFrame + fps);
    seekToFrame(newFrame);
    if (playerRef?.current?.seekTo) {
      playerRef.current.seekTo(newFrame);
    }
  };

  const handleSeekToStart = () => {
    seekToFrame(0);
    if (playerRef?.current?.seekTo) {
      playerRef.current.seekTo(0);
    }
  };

  const handleSeekToEnd = () => {
    seekToFrame(durationInFrames - 1);
    if (playerRef?.current?.seekTo) {
      playerRef.current.seekTo(durationInFrames - 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(10, zoom + 0.5));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(0.1, zoom - 0.5));
  };

  // 格式化时间显示
  const formatTime = (frame: number) => {
    const seconds = frame / fps;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
  };

  // 生成时间刻度
  const generateTimeMarkers = () => {
    const markers = [];
    const secondsPerMarker = zoom < 1 ? 5 : zoom < 2 ? 2 : 1;
    const totalSeconds = Math.ceil(duration);
    
    for (let i = 0; i <= totalSeconds; i += secondsPerMarker) {
      const x = i * pixelsPerSecond;
      markers.push(
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: `${x}px` }}
        >
          <div className="w-px h-3 bg-[#969696]" />
          <span className="text-xs text-[#969696] mt-1 select-none">
            {`${Math.floor(i / 60)}:${(i % 60).toString().padStart(2, '0')}`}
          </span>
        </div>
      );
    }
    return markers;
  };

  const currentTime = formatTime(currentFrame);
  const totalTime = formatTime(durationInFrames);
  const playheadPosition = (currentFrame / durationInFrames) * timelineWidth;

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* 控制栏 - 更大更清晰 */}
      <div className="flex-shrink-0 h-14 bg-[#2d2d30] border-b border-[#3e3e42] px-4 flex items-center gap-4">
        {/* 播放控制 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeekToStart}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-[#37373d] text-[#cccccc] transition-colors"
            title="跳到开始"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSeekBackward}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-[#37373d] text-[#cccccc] transition-colors"
            title="后退 1 秒"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleTogglePlay}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="w-10 h-10 flex items-center justify-center rounded bg-[#007acc] hover:bg-[#005a9e] active:bg-[#004080] text-white transition-colors"
            title={isPlaying ? '暂停' : '播放'}
            style={{
              pointerEvents: 'auto',
              zIndex: 10,
            }}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          
          <button
            onClick={handleSeekForward}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-[#37373d] text-[#cccccc] transition-colors"
            title="前进 1 秒"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSeekToEnd}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-[#37373d] text-[#cccccc] transition-colors"
            title="跳到结束"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>

        {/* 时间显示 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] rounded">
          <span className="text-sm font-mono text-[#cccccc] tabular-nums">
            {currentTime}
          </span>
          <span className="text-sm text-[#969696]">/</span>
          <span className="text-sm font-mono text-[#969696] tabular-nums">
            {totalTime}
          </span>
        </div>

        {/* 帧数显示 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] rounded">
          <span className="text-xs text-[#969696]">帧</span>
          <span className="text-sm font-mono text-[#cccccc] tabular-nums">
            {currentFrame}
          </span>
          <span className="text-sm text-[#969696]">/</span>
          <span className="text-sm font-mono text-[#969696] tabular-nums">
            {durationInFrames}
          </span>
        </div>

        {/* 速度显示 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] rounded">
          <span className="text-xs text-[#969696]">速度</span>
          <span className="text-sm font-mono text-[#cccccc]">
            {playbackSpeed}x
          </span>
        </div>

        {/* 弹性空间 */}
        <div className="flex-1" />

        {/* 缩放控制 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-[#37373d] text-[#cccccc] transition-colors"
            title="缩小"
            disabled={zoom <= 0.1}
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <div className="px-3 py-1.5 bg-[#1e1e1e] rounded min-w-[60px] text-center">
            <span className="text-sm font-mono text-[#cccccc]">
              {(zoom * 100).toFixed(0)}%
            </span>
          </div>
          
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-[#37373d] text-[#cccccc] transition-colors"
            title="放大"
            disabled={zoom >= 10}
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 时间轴区域 */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={timelineRef}
          className="relative w-full h-full overflow-x-auto overflow-y-hidden bg-[#252526] cursor-pointer"
          onClick={handleTimelineClick}
          onWheel={handleScroll}
        >
          {/* 时间轴内容 */}
          <div
            className="relative h-full"
            style={{ width: `${timelineWidth}px`, minWidth: '100%' }}
          >
            {/* 时间刻度 */}
            <div className="absolute top-0 left-0 right-0 h-10 border-b border-[#3e3e42]">
              {generateTimeMarkers()}
            </div>

            {/* 帧刻度线 */}
            <div className="absolute top-10 left-0 right-0 bottom-0">
              {Array.from({ length: durationInFrames }).map((_, i) => {
                const x = (i / durationInFrames) * timelineWidth;
                const isSecondMark = i % fps === 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      'absolute top-0 w-px',
                      isSecondMark ? 'h-4 bg-[#3e3e42]' : 'h-2 bg-[#2d2d30]'
                    )}
                    style={{ left: `${x}px` }}
                  />
                );
              })}
            </div>

            {/* 播放头 */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#007acc] cursor-ew-resize z-10"
              style={{ left: `${playheadPosition}px` }}
              onMouseDown={handlePlayheadMouseDown}
            >
              {/* 播放头顶部三角形 */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#007acc]" />
              
              {/* 当前帧提示 */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#007acc] text-white text-xs font-mono rounded whitespace-nowrap pointer-events-none">
                帧 {currentFrame}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
