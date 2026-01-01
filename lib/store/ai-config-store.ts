import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import localforage from 'localforage';

// 配置 LocalForage
localforage.config({
  name: 'ai-video-editor',
  storeName: 'ai_config',
  description: 'Store for AI configuration',
});

export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
}

export interface AIConfigState {
  providers: AIProvider[];
  activeProviderId: string | null;
  addProvider: (provider: AIProvider) => void;
  updateProvider: (id: string, updates: Partial<AIProvider>) => void;
  removeProvider: (id: string) => void;
  setActiveProvider: (id: string) => void;
  getActiveProvider: () => AIProvider | null;
}

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set, get) => ({
      providers: [],
      activeProviderId: null,
      addProvider: (provider) =>
        set((state) => ({
          providers: [...state.providers, provider],
          activeProviderId: state.activeProviderId || provider.id,
        })),
      updateProvider: (id, updates) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removeProvider: (id) =>
        set((state) => ({
          providers: state.providers.filter((p) => p.id !== id),
          activeProviderId:
            state.activeProviderId === id ? null : state.activeProviderId,
        })),
      setActiveProvider: (id) => set({ activeProviderId: id }),
      getActiveProvider: () => {
        const state = get();
        return (
          state.providers.find((p) => p.id === state.activeProviderId) || null
        );
      },
    }),
    {
      name: 'ai-config-storage',
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

