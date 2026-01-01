import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import localforage from 'localforage';

// 配置 LocalForage
localforage.config({
  name: 'ai-video-editor',
  storeName: 'code_store',
  description: 'Store for video code and settings',
});

export interface CodeState {
  code: string;
  setCode: (code: string) => void;
  resetCode: () => void;
}

const DEFAULT_CODE = `import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const MyVideo: React.FC = () => {
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

export const useCodeStore = create<CodeState>()(
  persist(
    (set) => ({
      code: DEFAULT_CODE,
      setCode: (code: string) => set({ code }),
      resetCode: () => set({ code: DEFAULT_CODE }),
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

