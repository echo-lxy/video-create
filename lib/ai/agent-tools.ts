/**
 * AI Agent 工具系统
 * 提供代码修改、资源查询、代码应用等功能
 */

import { z } from 'zod';

// 工具定义
export const agentTools = {
  // 修改代码工具
  modifyCode: {
    description: '修改或生成 Remotion 视频代码。可以创建新代码或基于现有代码进行修改。',
    parameters: z.object({
      code: z.string().describe('完整的 Remotion 组件代码（MyVideo 函数）'),
      reason: z.string().optional().describe('修改原因或说明'),
    }),
  },

  // 查询资源工具
  searchAssets: {
    description: '在资源库中搜索可用的资源文件（图片、音频、视频）。可以根据类型、名称等条件搜索。',
    parameters: z.object({
      query: z.string().optional().describe('搜索关键词（文件名或描述）'),
      type: z.enum(['all', 'image', 'audio', 'video']).optional().describe('资源类型筛选'),
    }),
  },

  // 应用代码工具
  applyCode: {
    description: '将生成的代码应用到编辑器中。只有在用户明确要求时才使用此工具。',
    parameters: z.object({
      code: z.string().describe('要应用的代码'),
      confirm: z.boolean().default(false).describe('是否确认应用（需要用户明确要求）'),
    }),
  },

  // 获取当前代码工具
  getCurrentCode: {
    description: '获取当前编辑器中的代码，用于了解现有代码结构。',
    parameters: z.object({}),
  },

  // 使用资源工具
  useAsset: {
    description: '在代码中引用资源文件。需要先通过 searchAssets 找到资源，然后使用此工具在代码中引用。',
    parameters: z.object({
      assetId: z.string().describe('资源ID'),
      assetUrl: z.string().describe('资源URL路径'),
      assetType: z.enum(['image', 'audio', 'video']).describe('资源类型'),
      usage: z.string().describe('如何使用这个资源（例如：背景图片、背景音乐等）'),
    }),
  },
};

// 工具执行器类型
export type ToolExecutor = {
  modifyCode: (params: { code: string; reason?: string }) => Promise<{ success: boolean; message: string }>;
  searchAssets: (params: { query?: string; type?: 'all' | 'image' | 'audio' | 'video' }) => Promise<{ assets: Array<{ id: string; name: string; type: string; url: string }> }>;
  applyCode: (params: { code: string; confirm: boolean }) => Promise<{ success: boolean; message: string }>;
  getCurrentCode: () => Promise<{ code: string }>;
  useAsset: (params: { assetId: string; assetUrl: string; assetType: 'image' | 'audio' | 'video'; usage: string }) => Promise<{ success: boolean; code: string; message: string }>;
};

