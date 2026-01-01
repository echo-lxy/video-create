import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import localforage from 'localforage';

// 配置 LocalForage for assets
const assetsStorage = localforage.createInstance({
  name: 'ai-video-editor',
  storeName: 'assets_store',
  description: 'Store for uploaded assets (images, audio, video)',
});

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'video';
  mimeType: string;
  size: number;
  url: string; // Blob URL
  blob: Blob; // 原始 Blob 数据
  createdAt: number;
  updatedAt: number;
}

export interface AssetsState {
  assets: Asset[];
  // 添加资源
  addAsset: (file: File) => Promise<Asset>;
  // 删除资源
  removeAsset: (id: string) => Promise<void>;
  // 获取资源
  getAsset: (id: string) => Asset | undefined;
  // 获取资源 URL（用于 staticFile）
  getAssetUrl: (id: string) => string | undefined;
  // 清空所有资源
  clearAssets: () => Promise<void>;
  // 获取资源统计
  getAssetsStats: () => { total: number; totalSize: number; byType: Record<string, number> };
}

// 生成资源 ID
function generateAssetId(): string {
  return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 从文件创建 Blob URL
function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

// 从文件类型判断资源类型
function getAssetType(mimeType: string): 'image' | 'audio' | 'video' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  throw new Error(`Unsupported file type: ${mimeType}`);
}

export const useAssetsStore = create<AssetsState>()(
  persist(
    (set, get) => ({
      assets: [],

      addAsset: async (file: File): Promise<Asset> => {
        const id = generateAssetId();
        const type = getAssetType(file.type);
        const blob = new Blob([file], { type: file.type });
        const url = createBlobUrl(blob);

        const asset: Asset = {
          id,
          name: file.name,
          type,
          mimeType: file.type,
          size: file.size,
          url,
          blob,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // 保存到 IndexedDB
        await assetsStorage.setItem(id, asset);

        // 更新状态
        set((state) => ({
          assets: [...state.assets, asset],
        }));

        return asset;
      },

      removeAsset: async (id: string): Promise<void> => {
        const asset = get().assets.find((a) => a.id === id);
        if (asset) {
          // 释放 Blob URL
          URL.revokeObjectURL(asset.url);
          // 从 IndexedDB 删除
          await assetsStorage.removeItem(id);
          // 更新状态
          set((state) => ({
            assets: state.assets.filter((a) => a.id !== id),
          }));
        }
      },

      getAsset: (id: string): Asset | undefined => {
        return get().assets.find((a) => a.id === id);
      },

      getAssetUrl: (id: string): string | undefined => {
        const asset = get().assets.find((a) => a.id === id);
        return asset?.url;
      },

      clearAssets: async (): Promise<void> => {
        const assets = get().assets;
        // 释放所有 Blob URL
        assets.forEach((asset) => URL.revokeObjectURL(asset.url));
        // 从 IndexedDB 删除所有
        await Promise.all(assets.map((asset) => assetsStorage.removeItem(asset.id)));
        // 更新状态
        set({ assets: [] });
      },

      getAssetsStats: () => {
        const assets = get().assets;
        const total = assets.length;
        const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
        const byType = assets.reduce((acc, asset) => {
          acc[asset.type] = (acc[asset.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return { total, totalSize, byType };
      },
    }),
    {
      name: 'assets-storage',
      storage: {
        getItem: async (name) => {
          // 从 IndexedDB 加载所有资源
          try {
            const keys = await assetsStorage.keys();
            const assets: Asset[] = [];
            for (const key of keys) {
              const asset = await assetsStorage.getItem<Asset>(key);
              if (asset && asset.blob) {
                // 重新创建 Blob URL（因为 Blob URL 不能持久化）
                asset.url = createBlobUrl(asset.blob);
                assets.push(asset);
              }
            }
            return { state: { assets }, version: 0 };
          } catch (error) {
            console.warn('Failed to load assets from IndexedDB:', error);
            return { state: { assets: [] }, version: 0 };
          }
        },
        setItem: async (name, value) => {
          // 只保存元数据到 localStorage，实际文件在 IndexedDB
          const metadata = {
            assets: value.state.assets.map((asset: Asset) => ({
              id: asset.id,
              name: asset.name,
              type: asset.type,
              mimeType: asset.mimeType,
              size: asset.size,
              createdAt: asset.createdAt,
              updatedAt: asset.updatedAt,
            })),
          };
          // 保存到 localStorage（仅元数据）
          localStorage.setItem(name, JSON.stringify(metadata));
        },
        removeItem: async (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

