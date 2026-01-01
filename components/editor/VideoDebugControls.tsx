'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface VideoDebugControlsProps {
  playerRef: React.RefObject<any>;
  durationInFrames: number;
  fps: number;
  onFrameChange?: (frame: number) => void;
  onExport?: () => void;
}

export default function VideoDebugControls({
  playerRef,
  durationInFrames,
  fps,
  onFrameChange,
  onExport,
}: VideoDebugControlsProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const frameInputRef = useRef<HTMLInputElement>(null);

  // 监听播放器状态
  useEffect(() => {
    if (!playerRef.current) return;

    const interval = setInterval(() => {
      try {
        // 尝试获取当前帧
        const player = playerRef.current;
        if (player && typeof player.getCurrentFrame === 'function') {
          const frame = player.getCurrentFrame();
          setCurrentFrame(Math.floor(frame));
        }
        if (player && typeof player.isPlaying === 'function') {
          setIsPlaying(player.isPlaying());
        }
      } catch (e) {
        // 忽略错误
      }
    }, 100);

    return () => clearInterval(interval);
  }, [playerRef]);

  const handlePlay = () => {
    playerRef.current?.play?.();
    setIsPlaying(true);
  };

  const handlePause = () => {
    playerRef.current?.pause?.();
    setIsPlaying(false);
  };

  const handleSeek = (frame: number) => {
    const clampedFrame = Math.max(0, Math.min(frame, durationInFrames - 1));
    playerRef.current?.seekTo?.(clampedFrame);
    setCurrentFrame(clampedFrame);
    onFrameChange?.(clampedFrame);
  };

  const handleFrameInput = (value: string) => {
    const frame = parseInt(value, 10);
    if (!isNaN(frame)) {
      handleSeek(frame);
    }
  };

  const handleSkipBack = () => {
    handleSeek(currentFrame - fps); // 跳回 1 秒
  };

  const handleSkipForward = () => {
    handleSeek(currentFrame + fps); // 跳前 1 秒
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    try {
      const player = playerRef.current;
      if (player && typeof player.setPlaybackRate === 'function') {
        player.setPlaybackRate(rate);
      }
    } catch (e) {
      console.warn('Set playback rate failed:', e);
    }
  };

  const currentTime = (currentFrame / fps).toFixed(2);
  const totalTime = (durationInFrames / fps).toFixed(2);
  const progress = (currentFrame / durationInFrames) * 100;

  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4 space-y-3">
      {/* 播放控制 */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={isPlaying ? handlePause : handlePlay}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        
        <Button size="sm" variant="outline" onClick={handleSkipBack}>
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button size="sm" variant="outline" onClick={handleSkipForward}>
          <SkipForward className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-gray-400">速度:</span>
          <div className="flex gap-1">
            {[0.25, 0.5, 1, 1.5, 2].map((rate) => (
              <Button
                key={rate}
                size="sm"
                variant={playbackRate === rate ? 'default' : 'outline'}
                onClick={() => handlePlaybackRateChange(rate)}
                className="text-xs px-2"
              >
                {rate}x
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        <Button size="sm" variant="outline" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          导出视频
        </Button>
      </div>

      {/* 时间线和帧控制 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-gray-400 w-16">
            {currentTime}s / {totalTime}s
          </span>
          <div className="flex-1 relative h-2 bg-gray-700 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              handleSeek(Math.floor(percentage * durationInFrames));
            }}
          >
            <div
              className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-20 text-right">
            {currentFrame} / {durationInFrames}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">帧:</span>
          <Input
            ref={frameInputRef}
            type="number"
            value={currentFrame}
            onChange={(e) => handleFrameInput(e.target.value)}
            className="w-20 h-8 text-xs"
            min={0}
            max={durationInFrames - 1}
          />
        </div>
      </div>
    </div>
  );
}

