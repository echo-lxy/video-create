import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import localforage from 'localforage';

// 配置 LocalForage
localforage.config({
  name: 'ai-video-editor',
  storeName: 'code_store',
  description: 'Store for video code and settings',
});

export interface VideoConfig {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

export interface CodeState {
  code: string;
  setCode: (code: string) => void;
  resetCode: () => void;
  // 视频配置
  videoConfig: VideoConfig;
  setVideoConfig: (config: Partial<VideoConfig>) => void;
}

const DEFAULT_CODE = `// React 和 remotion 会自动注入，无需导入
// 直接使用 React 和 remotion 的 API

export const MyVideo = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1
        style={{
          fontSize: 100,
          color: '#fff',
          opacity,
        }}
      >
        Hello Remotion!
      </h1>
    </AbsoluteFill>
  );
};
`;

const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  durationInFrames: 300, // 10 秒 @ 30fps
  fps: 30,
  width: 1920,
  height: 1080,
};

export const useCodeStore = create<CodeState>()(
  persist(
    (set) => ({
      code: DEFAULT_CODE,
      setCode: (code: string) => set({ code }),
      resetCode: () => set({ code: DEFAULT_CODE }),
      // 视频配置
      videoConfig: DEFAULT_VIDEO_CONFIG,
      setVideoConfig: (config: Partial<VideoConfig>) =>
        set((state) => ({
          videoConfig: { ...state.videoConfig, ...config },
        })),
    }),
    {
      name: 'code-storage',
      storage: {
        getItem: async (name) => {
          const value = await localforage.getItem<string>(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await localforage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await localforage.removeItem(name);
        },
      },
    }
  )
);

