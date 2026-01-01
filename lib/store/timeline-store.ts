import { create } from 'zustand';

export interface TimelineState {
  // 时间轴状态
  currentFrame: number;
  durationInFrames: number;
  fps: number;
  
  // 缩放和视图
  zoom: number; // 缩放级别 (0.1 - 10)
  scrollLeft: number; // 水平滚动位置
  
  // 播放状态
  isPlaying: boolean;
  playbackSpeed: number; // 播放速度倍数
  
  // Actions
  setCurrentFrame: (frame: number) => void;
  setDuration: (durationInFrames: number, fps: number) => void;
  setZoom: (zoom: number) => void;
  setScrollLeft: (scrollLeft: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  seekToFrame: (frame: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
}

export const useTimelineStore = create<TimelineState>()((set, get) => ({
  // 初始状态
  currentFrame: 0,
  durationInFrames: 300,
  fps: 30,
  zoom: 1,
  scrollLeft: 0,
  isPlaying: false,
  playbackSpeed: 1,

  // Actions
  setCurrentFrame: (frame) => {
    const { durationInFrames } = get();
    const clampedFrame = Math.max(0, Math.min(frame, durationInFrames - 1));
    set({ currentFrame: clampedFrame });
  },

  setDuration: (durationInFrames, fps) => {
    set({ durationInFrames, fps });
    // 确保当前帧在有效范围内
    const { currentFrame } = get();
    if (currentFrame >= durationInFrames) {
      set({ currentFrame: durationInFrames - 1 });
    }
  },

  setZoom: (zoom) => {
    const clampedZoom = Math.max(0.1, Math.min(zoom, 10));
    set({ zoom: clampedZoom });
  },

  setScrollLeft: (scrollLeft) => {
    set({ scrollLeft: Math.max(0, scrollLeft) });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setPlaybackSpeed: (speed) => {
    const clampedSpeed = Math.max(0.25, Math.min(speed, 4));
    set({ playbackSpeed: clampedSpeed });
  },

  seekToFrame: (frame) => {
    get().setCurrentFrame(frame);
  },

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  togglePlay: () => {
    const { isPlaying } = get();
    set({ isPlaying: !isPlaying });
  },
}));

