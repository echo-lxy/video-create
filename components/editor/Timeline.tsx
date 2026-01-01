'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTimelineStore } from '@/lib/store/timeline-store';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    setIsPlaying,
    seekToFrame,
    togglePlay,
  } = useTimelineStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const duration = durationInFrames / fps;
  const pixelsPerSecond = 50 * zoom; // 基础 50px/秒，根据 zoom 缩放
  const timelineWidth = duration * pixelsPerSecond;

  // 同步播放器状态
  useEffect(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    
    // 同步播放状态
    try {
      if (isPlaying && !player.isPlaying?.()) {
        player.play();
      } else if (!isPlaying && player.isPlaying?.()) {
        player.pause();
      }

      // 同步播放速度
      if (player.setPlaybackRate) {
        player.setPlaybackRate(playbackSpeed);
      }
    } catch (error) {
      // 忽略播放器错误
      console.warn('Player sync error:', error);
    }
  }, [isPlaying, playbackSpeed, playerRef]);

  // 监听播放器帧变化
  useEffect(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    const interval = setInterval(() => {
      try {
        if (player.isPlaying?.()) {
          const frame = player.getCurrentFrame?.() ?? 0;
          const roundedFrame = Math.floor(frame);
          if (roundedFrame !== currentFrame) {
            setCurrentFrame(roundedFrame);
          }
        }
      } catch (error) {
        // 忽略错误
      }
    }, Math.max(16, 1000 / fps / 2)); // 至少 16ms，以帧率的一半频率更新

    return () => clearInterval(interval);
  }, [playerRef, fps, currentFrame, setCurrentFrame]);

  // 处理时间轴点击
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const frame = Math.round((x / pixelsPerSecond) * fps);
    
    seekToFrame(frame);
    
    // 同步到播放器
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
      
      // 同步到播放器
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
      // Ctrl/Cmd + 滚轮：缩放
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(Math.max(0.1, Math.min(10, zoom + delta)));
    } else {
      // 普通滚轮：水平滚动
      e.preventDefault();
      setScrollLeft(Math.max(0, scrollLeft - e.deltaY));
    }
  }, [zoom, scrollLeft, setZoom, setScrollLeft]);

  // 自动滚动到当前帧
  useEffect(() => {
    if (!timelineRef.current || isDragging) return;

    const currentPosition = (currentFrame / fps) * pixelsPerSecond;
    const containerWidth = timelineRef.current.clientWidth;
    
    // 如果当前帧不在可视区域内，自动滚动
    if (currentPosition < scrollLeft) {
      setScrollLeft(currentPosition - 50);
    } else if (currentPosition > scrollLeft + containerWidth) {
      setScrollLeft(currentPosition - containerWidth + 50);
    }
  }, [currentFrame, fps, pixelsPerSecond, scrollLeft, isDragging, setScrollLeft]);

  // 格式化时间
  const formatTime = (frame: number) => {
    const seconds = frame / fps;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = frame % fps;
    return `${minutes}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  // 生成时间刻度
  const generateTimeMarkers = () => {
    const markers: Array<{ time: number; label: string }> = [];
    const interval = zoom < 0.5 ? 10 : zoom < 1 ? 5 : zoom < 2 ? 1 : 0.5; // 根据缩放调整间隔
    
    for (let t = 0; t <= duration; t += interval) {
      markers.push({
        time: t,
        label: `${Math.floor(t / 60)}:${(Math.floor(t % 60)).toString().padStart(2, '0')}`,
      });
    }
    
    return markers;
  };

  const timeMarkers = generateTimeMarkers();
  const playheadPosition = (currentFrame / fps) * pixelsPerSecond;

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] border-t border-[#3e3e42] relative overflow-hidden">
      {/* 控制栏 - 使用相对定位，确保始终可见 */}
      <div className="h-12 flex-shrink-0 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between px-4 relative z-10">
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-[#cccccc]" />
            ) : (
              <Play className="w-4 h-4 text-[#cccccc]" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => seekToFrame(Math.max(0, currentFrame - fps))}
            className="h-8 w-8 p-0 flex-shrink-0"
            title="后退 1 秒"
          >
            <SkipBack className="w-4 h-4 text-[#cccccc]" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => seekToFrame(Math.min(durationInFrames - 1, currentFrame + fps))}
            className="h-8 w-8 p-0 flex-shrink-0"
            title="前进 1 秒"
          >
            <SkipForward className="w-4 h-4 text-[#cccccc]" />
          </Button>

          <div className="ml-2 text-sm text-[#cccccc] font-mono whitespace-nowrap flex-shrink-0">
            {formatTime(currentFrame)} / {formatTime(durationInFrames - 1)}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-xs text-[#969696] whitespace-nowrap">
            速度: {playbackSpeed}x
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            className="h-8 w-8 p-0 flex-shrink-0"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4 text-[#cccccc]" />
          </Button>
          
          <div className="text-xs text-[#969696] w-12 text-center flex-shrink-0">
            {zoom.toFixed(1)}x
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom(Math.min(10, zoom + 0.1))}
            className="h-8 w-8 p-0 flex-shrink-0"
            title="放大"
          >
            <ZoomIn className="w-4 h-4 text-[#cccccc]" />
          </Button>
        </div>
      </div>

      {/* 时间轴 */}
      <div
        ref={timelineRef}
        className="flex-1 relative overflow-hidden bg-[#1e1e1e] cursor-pointer min-h-0"
        onClick={handleTimelineClick}
        onWheel={handleScroll}
      >
        {/* 时间刻度背景 */}
        <div
          className="absolute top-0 bottom-0 bg-[#252526]"
          style={{
            left: 0,
            width: timelineWidth,
            transform: `translateX(-${scrollLeft}px)`,
          }}
        >
          {/* 时间刻度线 */}
          {timeMarkers.map((marker) => {
            const x = marker.time * pixelsPerSecond;
            return (
              <div
                key={marker.time}
                className="absolute top-0 bottom-0 border-l border-[#3e3e42]"
                style={{ left: x }}
              >
                <div className="absolute top-0 left-0 text-xs text-[#969696] px-1 bg-[#252526]">
                  {marker.label}
                </div>
              </div>
            );
          })}

          {/* 帧网格 */}
          <div className="absolute inset-0">
            {Array.from({ length: durationInFrames }).map((_, frame) => {
              if (frame % fps !== 0) return null; // 只显示整秒的帧
              const x = (frame / fps) * pixelsPerSecond;
              return (
                <div
                  key={frame}
                  className="absolute top-0 bottom-0 border-l border-[#3e3e42]/30"
                  style={{ left: x }}
                />
              );
            })}
          </div>
        </div>

        {/* 播放头 */}
        <div
          className={cn(
            'absolute top-0 bottom-0 w-0.5 bg-[#007acc] z-10 cursor-grab',
            isDragging && 'cursor-grabbing'
          )}
          style={{
            left: playheadPosition - scrollLeft,
            transform: 'translateX(-50%)',
          }}
          onMouseDown={handlePlayheadMouseDown}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#007acc]" />
        </div>

        {/* 当前帧指示器 */}
        <div
          className="absolute top-0 left-0 bg-[#007acc] text-white text-xs px-2 py-1 rounded-b"
          style={{
            left: playheadPosition - scrollLeft,
            transform: 'translateX(-50%)',
          }}
        >
          帧 {currentFrame}
        </div>
      </div>
    </div>
  );
}

