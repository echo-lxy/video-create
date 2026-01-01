import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import localforage from 'localforage';

// 配置 LocalForage for prompt templates
localforage.config({
  name: 'ai-video-editor',
  storeName: 'prompt_template_store',
  description: 'Store for prompt templates',
});

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface PromptTemplateState {
  templates: PromptTemplate[];
  currentTemplateId: string | null;
  // 创建模板
  createTemplate: (name: string, content: string) => PromptTemplate;
  // 更新模板
  updateTemplate: (id: string, content: string) => void;
  // 删除模板
  deleteTemplate: (id: string) => void;
  // 获取当前模板
  getCurrentTemplate: () => PromptTemplate | undefined;
  // 设置当前模板
  setCurrentTemplate: (id: string | null) => void;
  // 在模板中插入资源引用
  insertAssetReference: (assetId: string, assetName: string) => void;
  // 获取渲染后的提示词（替换资源引用为实际 URL）
  getRenderedPrompt: () => string;
}

// 生成模板 ID
function generateTemplateId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 资源引用格式：{{asset:assetId:assetName}}
const ASSET_REFERENCE_REGEX = /\{\{asset:([^:]+):([^}]+)\}\}/g;

export const usePromptTemplateStore = create<PromptTemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
      currentTemplateId: null,

      createTemplate: (name: string, content: string): PromptTemplate => {
        const template: PromptTemplate = {
          id: generateTemplateId(),
          name,
          content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          templates: [...state.templates, template],
          currentTemplateId: template.id,
        }));

        return template;
      },

      updateTemplate: (id: string, content: string): void => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, content, updatedAt: Date.now() } : t
          ),
        }));
      },

      deleteTemplate: (id: string): void => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          currentTemplateId:
            state.currentTemplateId === id ? null : state.currentTemplateId,
        }));
      },

      getCurrentTemplate: (): PromptTemplate | undefined => {
        const state = get();
        return state.templates.find((t) => t.id === state.currentTemplateId);
      },

      setCurrentTemplate: (id: string | null): void => {
        set({ currentTemplateId: id });
      },

      insertAssetReference: (assetId: string, assetName: string): void => {
        const template = get().getCurrentTemplate();
        if (!template) {
          // 如果没有当前模板，创建一个新的
          const newTemplate = get().createTemplate('Untitled', '');
          get().insertAssetReference(assetId, assetName);
          return;
        }

        const reference = `{{asset:${assetId}:${assetName}}}`;
        const newContent = template.content + reference;
        get().updateTemplate(template.id, newContent);
      },

      getRenderedPrompt: (): string => {
        const template = get().getCurrentTemplate();
        if (!template) return '';

        // 动态导入 useAssetsStore（避免循环依赖）
        try {
          const { useAssetsStore } = require('./assets-store');
          const getAssetUrl = useAssetsStore.getState().getAssetUrl;

          // 替换所有资源引用为实际 URL
          return template.content.replace(ASSET_REFERENCE_REGEX, (match, assetId, assetName) => {
            const url = getAssetUrl(assetId);
            if (url) {
              return `[${assetName}](${url})`;
            }
            return `[${assetName}](资源未找到)`;
          });
        } catch (error) {
          // 如果无法加载 assets store，返回原始内容
          return template.content;
        }
      },
    }),
    {
      name: 'prompt-template-storage',
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

