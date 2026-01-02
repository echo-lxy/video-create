import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import localforage from 'localforage';

// 配置 LocalForage
localforage.config({
  name: 'ai-video-editor',
  storeName: 'assets_store',
  description: 'Store for asset files',
});

export interface Asset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  size: number; // bytes
  url: string;
  uploadedAt: Date;
  description?: string;
  tags?: string[];
}

export interface AssetsState {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'uploadedAt'>) => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  searchAssets: (query?: string, type?: 'all' | 'video' | 'audio' | 'image') => Asset[];
  getAssetById: (id: string) => Asset | undefined;
  getAssetsByType: (type: 'video' | 'audio' | 'image') => Asset[];
}

export const useAssetsStore = create<AssetsState>()(
  persist(
    (set, get) => ({
      assets: [],
      
      addAsset: (asset) => {
        const newAsset: Asset = {
          ...asset,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          uploadedAt: new Date(),
        };
        set((state) => ({
          assets: [...state.assets, newAsset],
        }));
      },

      removeAsset: (id) => {
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== id),
        }));
      },

      updateAsset: (id, updates) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      searchAssets: (query, type = 'all') => {
        const { assets } = get();
        let filtered = assets;

        // 类型筛选
        if (type !== 'all') {
          filtered = filtered.filter((a) => a.type === type);
        }

        // 关键词搜索
        if (query) {
          const lowerQuery = query.toLowerCase();
          filtered = filtered.filter(
            (a) =>
              a.name.toLowerCase().includes(lowerQuery) ||
              a.description?.toLowerCase().includes(lowerQuery) ||
              a.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
          );
        }

        return filtered;
      },

      getAssetById: (id) => {
        return get().assets.find((a) => a.id === id);
      },

      getAssetsByType: (type) => {
        return get().assets.filter((a) => a.type === type);
      },
    }),
    {
      name: 'assets-storage',
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
