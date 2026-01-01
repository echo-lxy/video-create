# AI 交互式视频代码生成应用 MVP

基于 Remotion 和开源技术栈，构建一个类似 Cursor 的 AI 交互式代码编辑器。用户通过 AI 对话生成和修改 Remotion 视频代码，支持实时预览，代码执行前进行安全性验证。

## 一、产品定位

### 核心价值
- **AI 交互式编程**：类似 Cursor 的体验，AI 帮助编写和修改代码
- **代码编辑模式**：直接编辑 Remotion 代码，完全控制
- **安全性保障**：代码执行前验证，防止恶意代码
- **实时预览**：代码修改后立即预览效果
- **单文件编辑**：专注于单个视频组件文件
- **可选代码视图**：用户可以选择显示或隐藏代码编辑器

### 目标用户
- 熟悉代码的视频创作者
- 需要快速迭代的视频开发者
- 喜欢 AI 辅助编程的用户

## 二、技术栈

### 核心技术（全部使用第三方开源库，基于 Remotion Studio UI）

**重要**：本项目基于 Remotion Studio 的开源 UI 进行改造，充分利用其现有的时间线、预览、属性编辑器等组件。

```typescript
const techStack = {
  // 前端框架
  framework: "Next.js 14 (App Router)",
  language: "TypeScript",
  
  // UI 和样式（基于 Remotion Studio）
  remotionStudio: "@remotion/studio",            // Remotion Studio UI 组件（核心）
  remotionTimeline: "@remotion/studio/timeline", // 时间线编辑器组件
  remotionPreview: "@remotion/player",          // 预览播放器（Remotion 官方）
  remotionControls: "@remotion/studio/controls", // 播放控制组件
  styling: "Tailwind CSS",
  uiComponents: "shadcn/ui",                    // 补充 UI 组件库
  icons: "Lucide React",
  
  // 视频引擎
  videoEngine: "Remotion",
  preview: "@remotion/player",
  export: "@remotion/renderer",
  exportClient: "ffmpeg.wasm",
  
  // 代码编辑器
  codeEditor: "@monaco-editor/react",           // Monaco Editor React 封装
  codeFormatting: "prettier",                   // 代码格式化
  codeLinting: "eslint",                        // 代码检查
  codeSecurity: "eslint-plugin-security",      // 安全性检查插件
  codeDiff: "react-diff-view",                  // 代码差异显示
  codeHighlight: "prismjs / highlight.js",     // 代码高亮（备用）
  
  // 代码编译和执行
  typescriptCompiler: "esbuild-wasm",          // TypeScript 编译（WASM）
  codeBundler: "esbuild",                      // 代码打包
  codeTranspiler: "@swc/wasm",                 // 快速转译（备用）
  
  // AI 集成
  aiSDK: "ai (Vercel AI SDK)",                 // 统一的 AI SDK
  aiStreaming: "ai/stream-text",               // 流式文本生成
  aiProviders: {
    openai: "@ai-sdk/openai",                  // OpenAI 提供者
    anthropic: "@ai-sdk/anthropic",            // Anthropic 提供者
    custom: "ai/custom-provider",              // 自定义提供者
  },
  
  // 文件处理
  fileUpload: "react-dropzone",
  fileStorage: "localforage",                  // IndexedDB 封装
  fileUtils: "file-saver",                     // 文件下载
  
  // 状态管理
  stateManagement: "zustand",
  statePersistence: "zustand/middleware/persist", // 状态持久化
  
  // 代码分析
  astParser: "@typescript-eslint/parser",      // TypeScript AST 解析
  astTraverse: "@typescript-eslint/typescript-estree", // AST 遍历
  codeAnalysis: "ts-morph",                    // TypeScript 项目分析
  
  // 工具库
  utilities: "lodash-es",
  dateUtils: "date-fns",
  diffUtils: "diff",                           // 文本差异计算
  jsonUtils: "jsonc-parser",                   // JSON 解析（支持注释）
  
  // 安全相关
  sandbox: "iframe-sandbox",                   // iframe 沙箱（如果需要）
  codeValidation: "ajv",                       // JSON Schema 验证
  
  // 其他
  debounce: "lodash-es/debounce",              // 防抖
  throttle: "lodash-es/throttle",              // 节流
  uuid: "uuid",                                // UUID 生成
};
```

## 三、基于 Remotion Studio UI 改造

### 1. Remotion Studio 简介

Remotion Studio 是 Remotion 官方提供的开源开发工具，包含完整的视频编辑界面：

- **时间线编辑器**：可视化编辑视频时间线
- **预览窗口**：实时预览视频效果
- **属性面板**：编辑组件属性
- **代码编辑器**：编辑 Remotion 代码
- **播放控制**：播放、暂停、跳转等控制

**GitHub**: https://github.com/remotion-dev/remotion

### 2. Remotion Studio 的获取方式

Remotion Studio 是 Remotion 项目的一部分，可以通过以下方式使用：

#### 方式 1：Fork Remotion 仓库（推荐用于深度定制）

```bash
# 1. Fork Remotion 仓库
git clone https://github.com/remotion-dev/remotion.git

# 2. Remotion Studio 代码在 packages/studio 目录
cd remotion/packages/studio

# 3. 查看可用的组件
# - Timeline 组件
# - Preview 组件
# - Property Panel 组件
# - 等等
```

#### 方式 2：使用 Remotion CLI（如果 Studio 作为独立包）

```bash
# 安装 Remotion CLI
npm install -g @remotion/cli

# 或者作为依赖
npm install @remotion/cli @remotion/studio
```

#### 方式 3：直接使用 Remotion Studio 的源码

```typescript
// 从 Remotion 仓库中复制需要的组件
// packages/studio/src/components/Timeline/
// packages/studio/src/components/Preview/
// packages/studio/src/components/PropertyPanel/

// 然后在自己的项目中引入
import { Timeline } from '@/lib/remotion-studio/Timeline';
import { Preview } from '@/lib/remotion-studio/Preview';
```

### 3. 可重用的 UI 组件

Remotion Studio 源码中包含以下可重用的组件（位于 `packages/studio/src/`）：

```typescript
// Remotion Studio 源码结构
packages/studio/src/
  ├── components/
  │   ├── Timeline/          // 时间线编辑器
  │   │   ├── Timeline.tsx
  │   │   ├── TimelineTrack.tsx
  │   │   └── TimelineSequence.tsx
  │   ├── Preview/           // 预览窗口
  │   │   ├── Preview.tsx
  │   │   └── PreviewControls.tsx
  │   ├── PropertyPanel/     // 属性面板
  │   │   ├── PropertyPanel.tsx
  │   │   └── PropertyEditor.tsx
  │   └── Controls/          // 播放控制
  │       ├── PlayButton.tsx
  │       ├── PauseButton.tsx
  │       └── SeekBar.tsx
  └── Studio.tsx             // Studio 主组件
```

**使用示例**：

```typescript
// 从 Remotion 源码中复制组件到自己的项目
import { Timeline } from '@/lib/remotion-studio/Timeline';
import { Preview } from '@/lib/remotion-studio/Preview';
import { PropertyPanel } from '@/lib/remotion-studio/PropertyPanel';
```

### 3. 改造策略

#### 方案 A：Fork Remotion Studio（完全控制）

```bash
# 1. Fork Remotion Studio 仓库
git clone https://github.com/remotion-dev/remotion.git

# 2. 在 packages/studio 目录下进行改造
cd packages/studio

# 3. 添加 AI 对话界面
# 4. 集成 AI 代码生成
# 5. 保留原有的时间线、预览等功能
```

**优点**：
- 完全控制 UI
- 可以深度定制
- 保留所有 Remotion Studio 功能

**缺点**：
- 需要维护整个 Studio 代码库
- 升级 Remotion 版本时需要合并

#### 方案 B：使用 Remotion Studio 作为依赖（推荐）

```typescript
// 安装 Remotion Studio 作为依赖
npm install @remotion/studio

// 在自己的应用中集成
import { Studio } from '@remotion/studio';
import { RemotionRoot } from './remotion/Root';

function App() {
  return (
    <div className="flex">
      {/* 左侧：AI 对话界面（自定义） */}
      <AIChatPanel />
      
      {/* 中间：Remotion Studio（使用官方 UI） */}
      <Studio
        component={RemotionRoot}
        // 可以传入配置自定义行为
        options={{
          // 隐藏某些面板
          // 自定义主题
          // 等等
        }}
      />
    </div>
  );
}
```

**优点**：
- 快速集成，无需维护 UI 代码
- 自动获得 Remotion Studio 的更新
- 专注于 AI 功能开发

**缺点**：
- 定制化程度有限
- 需要适配 Remotion Studio 的 API

#### 方案 C：混合方案（最佳实践）

```typescript
// 使用 Remotion Studio 的核心组件，但自定义布局
import { 
  Timeline,
  Preview,
  PropertyPanel 
} from '@remotion/studio';

function CustomEditor() {
  return (
    <div className="grid grid-cols-3">
      {/* 左侧：AI 对话（自定义） */}
      <div className="col-span-1">
        <AIChatPanel />
      </div>
      
      {/* 中间：预览（使用 Remotion Studio 组件） */}
      <div className="col-span-1">
        <Preview component={RemotionRoot} />
      </div>
      
      {/* 右侧：时间线和属性（使用 Remotion Studio 组件） */}
      <div className="col-span-1">
        <Timeline />
        <PropertyPanel />
      </div>
    </div>
  );
}
```

**优点**：
- 灵活组合，按需使用
- 保留 Remotion Studio 的核心功能
- 可以自定义布局和交互

**缺点**：
- 需要理解 Remotion Studio 的组件 API
- 可能需要一些适配工作

### 4. 实际集成示例

#### 示例 1：使用 Remotion Studio 源码组件

```tsx
// app/components/editor/RemotionStudioIntegration.tsx
"use client";

import { useState } from 'react';
import { Player } from '@remotion/player';
import { RemotionRoot } from '@/remotion/Root';
import { useCodeStore } from '@/store/code-store';
import AIChatPanel from '@/components/ai/AIChatInterface';

// 从 Remotion Studio 源码中复制的组件
import { Timeline } from '@/lib/remotion-studio/Timeline';
import { PropertyPanel } from '@/lib/remotion-studio/PropertyPanel';
import { PlayButton, PauseButton, SeekBar } from '@/lib/remotion-studio/Controls';

export default function RemotionStudioIntegration() {
  const { code } = useCodeStore();
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* 顶部工具栏 */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold">AI 视频编辑器</h1>
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className="px-3 py-1 bg-blue-600 rounded"
        >
          {showAIPanel ? '隐藏 AI' : '显示 AI'}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：AI 对话面板（自定义） */}
        {showAIPanel && (
          <div className="w-96 border-r border-gray-800">
            <AIChatPanel />
          </div>
        )}

        {/* 中间：预览窗口（使用 Remotion Player） */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black flex items-center justify-center">
            <Player
              component={RemotionRoot}
              durationInFrames={300}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={30}
              controls
              playing={isPlaying}
              currentTime={currentFrame}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onSeek={(frame) => setCurrentFrame(frame)}
            />
          </div>

          {/* 播放控制（使用 Remotion Studio 组件） */}
          <div className="h-16 bg-gray-900 border-t border-gray-800 flex items-center gap-2 px-4">
            {isPlaying ? (
              <PauseButton onClick={() => setIsPlaying(false)} />
            ) : (
              <PlayButton onClick={() => setIsPlaying(true)} />
            )}
            <SeekBar
              currentFrame={currentFrame}
              durationInFrames={300}
              onSeek={setCurrentFrame}
            />
          </div>

          {/* 时间线（使用 Remotion Studio 组件） */}
          <div className="h-64 bg-gray-900 border-t border-gray-800">
            <Timeline
              durationInFrames={300}
              currentFrame={currentFrame}
              onSeek={setCurrentFrame}
            />
          </div>
        </div>

        {/* 右侧：属性面板（使用 Remotion Studio 组件） */}
        <div className="w-80 border-l border-gray-800">
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
}
```

#### 示例 2：Fork Remotion Studio 并添加 AI 功能

```bash
# 1. Fork Remotion 仓库
git clone https://github.com/remotion-dev/remotion.git
cd remotion

# 2. 创建新分支
git checkout -b ai-integration

# 3. 在 packages/studio/src/ 中添加 AI 面板
# 创建 packages/studio/src/components/AIPanel/AIPanel.tsx

# 4. 修改 packages/studio/src/Studio.tsx
# 添加 AI 面板到布局中

# 5. 构建和运行
npm install
npm run build
npm run studio
```

### 5. 使用 Remotion Studio 的核心组件

如果不想使用完整的 Studio，可以只使用核心组件：

```tsx
// 只使用时间线组件
import { Timeline } from '@remotion/studio/timeline';

// 只使用预览组件
import { Preview } from '@remotion/studio/preview';

// 只使用属性面板
import { PropertyPanel } from '@remotion/studio/property-panel';
```

### 6. 改造建议

1. **保留 Remotion Studio 的核心功能**
   - 时间线编辑：直接使用 Remotion Studio 的 Timeline 组件
   - 预览播放：使用 `@remotion/player`（官方提供）
   - 属性编辑：使用 Remotion Studio 的 PropertyPanel 组件
   - 这些功能已经很完善，无需重造

2. **添加 AI 功能**
   - AI 对话界面（自定义开发）
   - AI 代码生成（自定义开发）
   - 代码差异显示（使用 react-diff-view）
   - 代码编辑器（可以使用 Remotion Studio 的编辑器或 Monaco Editor）

3. **自定义布局**
   - 将 AI 面板集成到 Remotion Studio 布局中
   - 可以隐藏不需要的功能
   - 可以添加新的功能面板
   - 保持 Remotion Studio 的响应式设计

4. **保持兼容性**
   - 确保生成的代码符合 Remotion 规范
   - 利用 Remotion Studio 的验证和错误提示
   - 跟随 Remotion 的版本更新

### 7. 实施步骤

#### 步骤 1：获取 Remotion Studio 源码

```bash
# 克隆 Remotion 仓库
git clone https://github.com/remotion-dev/remotion.git
cd remotion

# 查看 Studio 源码结构
ls packages/studio/src/
```

#### 步骤 2：复制需要的组件

```bash
# 在你的项目中创建目录
mkdir -p lib/remotion-studio

# 复制需要的组件（根据 Remotion 的许可证，可以自由使用）
# 从 packages/studio/src/components/ 复制到 lib/remotion-studio/
```

#### 步骤 3：集成 AI 功能

```tsx
// 在你的应用中组合使用
import { Timeline } from '@/lib/remotion-studio/Timeline';
import { PropertyPanel } from '@/lib/remotion-studio/PropertyPanel';
import AIChatPanel from '@/components/ai/AIChatInterface';

// 组合成完整的编辑器
```

#### 步骤 4：自定义和扩展

- 修改组件样式以匹配你的设计
- 添加 AI 相关的功能
- 集成代码生成和验证

### 8. 优势

使用 Remotion Studio UI 的优势：

1. **成熟稳定**：Remotion Studio 已经过大量用户验证
2. **功能完整**：时间线、预览、属性编辑等功能齐全
3. **开源免费**：MIT 许可证，可以自由使用和修改
4. **持续更新**：跟随 Remotion 项目持续改进
5. **节省开发时间**：无需从零开发视频编辑 UI
6. **用户体验一致**：与 Remotion Studio 保持一致的用户体验

## 四、核心架构

### 1. 系统架构图
```
┌─────────────────────────────────────────┐
│          AI 对话界面层                   │
│  • 聊天输入框                            │
│  • 对话历史                              │
│  • AI 代码建议和修改                      │
│  • 代码差异预览                           │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│          AI 代码生成层                   │
│  • 理解用户需求                          │
│  • 生成 Remotion 代码                    │
│  • 代码补全和建议                        │
│  • 代码修改和重构                        │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│         代码编辑器层（可选）              │
│  • Monaco Editor                        │
│  • 语法高亮和智能提示                    │
│  • 代码验证                              │
│  • AI 修改标记                           │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│         代码安全性验证层                  │
│  • AST 静态分析                          │
│  • 危险 API 检测                        │
│  • 沙箱执行验证                          │
│  • 白名单/黑名单检查                     │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│         代码执行层                        │
│  • 动态编译 TypeScript                   │
│  • 生成 Remotion 组件                    │
│  • 实时预览渲染                          │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│         预览和导出层                     │
│  • Remotion Player 预览                 │
│  • 视频导出                              │
└─────────────────────────────────────────┘
```

### 2. 核心工作流程
```
用户输入需求
    ↓
AI 生成/修改代码
    ↓
代码安全性验证
    ↓
（可选）用户查看/编辑代码
    ↓
动态编译和执行
    ↓
实时预览
    ↓
导出视频
```

## 四、核心功能模块

### 1. **AI 对话界面（主界面）**

```tsx
// app/components/ai/AIChatInterface.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Code, Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { useCodeStore } from '@/store/code-store';
import { generateCodeWithAI } from '@/lib/ai/code-generator';
import { validateCodeSecurity } from '@/lib/security/code-validator';
import { Diff, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeChanges?: CodeChange; // AI 生成的代码变更
  status?: 'pending' | 'applied' | 'rejected';
}

interface CodeChange {
  type: 'create' | 'modify' | 'delete';
  file: string;
  oldCode?: string;
  newCode: string;
  diff?: string;
}

export default function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const { code, updateCode, applyCodeChange } = useCodeStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // AI 生成代码变更
      const codeChange = await generateCodeWithAI(
        input,
        code,
        messages.map((m) => ({ role: m.role, content: m.content }))
      );

      // 安全性验证
      const securityCheck = await validateCodeSecurity(codeChange.newCode);

      if (!securityCheck.safe) {
        const errorMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: `代码生成失败：${securityCheck.reason}\n\n${securityCheck.suggestions || ''}`,
          timestamp: new Date(),
          codeChanges: codeChange,
          status: 'rejected',
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: '我已经为你生成了代码。你可以查看代码编辑器确认，然后应用更改。',
        timestamp: new Date(),
        codeChanges: codeChange,
        status: 'pending',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('生成失败:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: '抱歉，生成时出现错误。请检查你的 API 配置或稍后重试。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyChange = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message?.codeChanges) return;

    applyCodeChange(message.codeChanges);
    updateCode(message.codeChanges.newCode);

    // 更新消息状态
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, status: 'applied' as const } : m
      )
    );
  };

  const handleRejectChange = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, status: 'rejected' as const } : m
      )
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* 顶部工具栏 */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold">AI 视频代码生成器</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className={`px-3 py-1 rounded flex items-center gap-2 ${
              showCodeEditor ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {showCodeEditor ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">代码编辑器</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：AI 对话 */}
        <div className="flex-1 flex flex-col border-r border-gray-800">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-8">
                <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm mb-4">用自然语言描述你想要创建的视频</p>
                <div className="space-y-2 max-w-md mx-auto">
                  <button
                    onClick={() => setInput('创建一个 10 秒的产品介绍视频，包含标题和 Logo')}
                    className="block w-full text-left px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
                  >
                    创建一个 10 秒的产品介绍视频，包含标题和 Logo
                  </button>
                  <button
                    onClick={() => setInput('生成一个科技感的开场动画，带有粒子特效')}
                    className="block w-full text-left px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
                  >
                    生成一个科技感的开场动画，带有粒子特效
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {msg.codeChanges && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        <span>代码变更：{msg.codeChanges.type}</span>
                      </div>

                      {/* 代码差异预览（使用 react-diff-view） */}
                      {msg.codeChanges.diff && (
                        <CodeDiffViewer
                          oldCode={msg.codeChanges.oldCode || ''}
                          newCode={msg.codeChanges.newCode}
                        />
                      )}

                      {msg.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleApplyChange(msg.id)}
                            className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            应用
                          </button>
                          <button
                            onClick={() => handleRejectChange(msg.id)}
                            className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center justify-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            拒绝
                          </button>
                        </div>
                      )}

                      {msg.status === 'applied' && (
                        <div className="text-xs text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          已应用
                        </div>
                      )}

                      {msg.status === 'rejected' && (
                        <div className="text-xs text-red-400 flex items-center gap-1">
                          <X className="w-3 h-3" />
                          已拒绝
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-400">正在生成代码...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="描述你想要创建或修改的视频..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                disabled={isGenerating}
              />
              <button
                onClick={handleSend}
                disabled={isGenerating || !input.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：代码编辑器（可选） */}
        {showCodeEditor && (
          <div className="w-1/2 border-l border-gray-800">
            <CodeEditor />
          </div>
        )}
      </div>
    </div>
  );
}

// 代码差异查看器组件（使用 react-diff-view）
function CodeDiffViewer({ oldCode, newCode }: { oldCode: string; newCode: string }) {
  const diffText = `--- old\n+++ new\n${generateUnifiedDiff(oldCode, newCode)}`;
  const files = parseDiff(diffText);

  return (
    <div className="mt-2 border border-gray-700 rounded overflow-hidden">
      <Diff viewType="unified" diffType="modify" hunks={files[0]?.hunks || []}>
        {(hunks) =>
          hunks.map((hunk) => (
            <div key={hunk.content} className="font-mono text-xs">
              {hunk.lines.map((line) => (
                <div
                  key={line.lineNumber}
                  className={`px-2 py-0.5 ${
                    line.type === 'insert'
                      ? 'bg-green-900/30'
                      : line.type === 'delete'
                      ? 'bg-red-900/30'
                      : 'bg-gray-800'
                  }`}
                >
                  <span className="text-gray-400 mr-2">
                    {line.type === 'insert' ? '+' : line.type === 'delete' ? '-' : ' '}
                  </span>
                  <span className={line.type === 'insert' ? 'text-green-300' : line.type === 'delete' ? 'text-red-300' : 'text-gray-300'}>
                    {line.content}
                  </span>
                </div>
              ))}
            </div>
          ))
        }
      </Diff>
    </div>
  );
}

function generateUnifiedDiff(oldCode: string, newCode: string): string {
  const { diffLines } = require('diff');
  const changes = diffLines(oldCode, newCode);
  const lines: string[] = [];

  changes.forEach((part: any) => {
    const prefix = part.added ? '+' : part.removed ? '-' : ' ';
    part.value.split('\n').forEach((line: string) => {
      if (line.trim() || part.added || part.removed) {
        lines.push(`${prefix}${line}`);
      }
    });
  });

  return lines.join('\n');
}
```

### 2. **代码编辑器（Monaco Editor）**

```tsx
// app/components/editor/CodeEditor.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useCodeStore } from '@/store/code-store';
import { Code, AlertCircle, Check } from 'lucide-react';
import { validateCodeSecurity } from '@/lib/security/code-validator';

export default function CodeEditor() {
  const { code, updateCode } = useCodeStore();
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const editorRef = useRef<any>(null);

  const handleCodeChange = async (value: string | undefined) => {
    if (!value) return;

    setIsValidating(true);
    updateCode(value);

    // 安全性验证
    try {
      const securityCheck = await validateCodeSecurity(value);

      if (securityCheck.safe) {
        setIsValid(true);
        setError(null);
      } else {
        setIsValid(false);
        setError(securityCheck.reason);
      }
    } catch (e) {
      setIsValid(false);
      setError(e instanceof Error ? e.message : '验证失败');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">代码编辑器</h2>
        </div>
        <div className="flex items-center gap-2">
          {isValidating ? (
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <AlertCircle className="w-4 h-4 animate-pulse" />
              <span>验证中...</span>
            </div>
          ) : isValid ? (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              <span>安全</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>不安全</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-900/30 border-b border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>
    </div>
  );
}
```

### 3. **代码 Store**

```typescript
// store/code-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import localforage from 'localforage';

interface CodeChange {
  type: 'create' | 'modify' | 'delete';
  file: string;
  oldCode?: string;
  newCode: string;
  diff?: string;
}

interface CodeStore {
  code: string;
  setCode: (code: string) => void;
  updateCode: (code: string) => void;
  applyCodeChange: (change: CodeChange) => void;
  history: string[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
}

const defaultCode = `import { Composition, AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <div
        style={{
          color: 'white',
          fontSize: 60,
          textAlign: 'center',
          opacity,
        }}
      >
        Hello Remotion
      </div>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
`;

export const useCodeStore = create<CodeStore>()(
  persist(
    (set, get) => ({
      code: defaultCode,
      history: [defaultCode],
      historyIndex: 0,

      setCode: (code) => {
        const { history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(code);
        set({
          code,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      updateCode: (code) => {
        set({ code });
      },

      applyCodeChange: (change) => {
        get().setCode(change.newCode);
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          set({
            code: history[historyIndex - 1],
            historyIndex: historyIndex - 1,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          set({
            code: history[historyIndex + 1],
            historyIndex: historyIndex + 1,
          });
        }
      },
    }),
    {
      name: 'video-code-storage',
      storage: {
        getItem: async (name) => {
          const value = await localforage.getItem(name);
          return value ? JSON.parse(value as string) : null;
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
```

### 4. **AI 代码生成器（使用 Vercel AI SDK）**

```typescript
// lib/ai/code-generator.ts

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { getAIConfig } from '@/store/ai-config-store';
import { diffLines } from 'diff'; // 使用 diff 库生成差异

interface CodeChange {
  type: 'create' | 'modify' | 'delete';
  file: string;
  oldCode?: string;
  newCode: string;
  diff?: string;
}

/**
 * 使用 AI 生成或修改 Remotion 代码（使用 Vercel AI SDK）
 */
export async function generateCodeWithAI(
  prompt: string,
  currentCode: string | null,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<CodeChange> {
  const config = getAIConfig();

  if (!config.apiKey || !config.model) {
    throw new Error('请先配置 AI 模型');
  }

  // 根据配置选择 AI 提供者
  const model = getAIModel(config);

  const systemPrompt = buildSystemPrompt(currentCode);
  const messages = buildMessages(prompt, conversationHistory, currentCode, systemPrompt);

  // 使用 AI SDK 生成代码
  const { text } = await generateText({
    model,
    system: systemPrompt,
    messages,
    temperature: 0.3,
    maxTokens: 4000,
  });

  const codeChange = parseCodeResponse(text, currentCode);

  return codeChange;
}

/**
 * 流式生成代码（用于实时显示）
 */
export async function* streamCodeWithAI(
  prompt: string,
  currentCode: string | null,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): AsyncGenerator<string, void, unknown> {
  const config = getAIConfig();
  const model = getAIModel(config);
  const systemPrompt = buildSystemPrompt(currentCode);
  const messages = buildMessages(prompt, conversationHistory, currentCode, systemPrompt);

  const { textStream } = await streamText({
    model,
    system: systemPrompt,
    messages,
    temperature: 0.3,
    maxTokens: 4000,
  });

  for await (const chunk of textStream) {
    yield chunk;
  }
}

function getAIModel(config: any) {
  switch (config.provider) {
    case 'openai':
      return openai(config.model, {
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
    case 'anthropic':
      return anthropic(config.model, {
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
    default:
      throw new Error(`不支持的 AI 提供者: ${config.provider}`);
  }
}

function buildSystemPrompt(currentCode: string | null): string {
  const basePrompt = `你是一个专业的 Remotion 视频代码生成助手。根据用户的描述，生成或修改 Remotion React 组件代码。

Remotion 核心 API：
- Composition: 定义视频组合
- AbsoluteFill: 全屏容器
- useCurrentFrame(): 获取当前帧数
- interpolate(): 插值函数，用于动画
- useVideoConfig(): 获取视频配置

代码要求：
1. 使用 TypeScript
2. 导出 RemotionRoot 组件，包含所有 Composition
3. 每个 Composition 需要 id、component、durationInFrames、fps、width、height
4. 使用 React Hooks 和函数组件
5. 代码要清晰、可读、可维护

${currentCode ? `当前代码：\n\`\`\`typescript\n${currentCode}\n\`\`\`\n\n请基于现有代码进行修改。` : '生成全新的代码。'}

只返回代码，不要包含任何解释文字。`;

  return basePrompt;
}

function buildMessages(
  prompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentCode: string | null,
  systemPrompt: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversationHistory,
  ];

  if (currentCode) {
    messages.push({
      role: 'user',
      content: `用户要求：${prompt}\n\n请修改代码以满足要求。只返回修改后的完整代码。`,
    });
  } else {
    messages.push({
      role: 'user',
      content: prompt,
    });
  }

  return messages;
}

function parseCodeResponse(response: string, currentCode: string | null): CodeChange {
  // 提取代码块（使用正则）
  const codeMatch = response.match(/```(?:typescript|tsx|ts)?\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : response.trim();

  // 使用 diff 库生成差异
  const diff = currentCode ? generateDiff(currentCode, code) : undefined;

  return {
    type: currentCode ? 'modify' : 'create',
    file: 'Video.tsx',
    oldCode: currentCode || undefined,
    newCode: code,
    diff,
  };
}

function generateDiff(oldCode: string, newCode: string): string {
  // 使用 diff 库生成行级差异
  const changes = diffLines(oldCode, newCode);
  const diffLines: string[] = [];

  changes.forEach((part) => {
    const prefix = part.added ? '+' : part.removed ? '-' : ' ';
    const lines = part.value.split('\n');
    lines.forEach((line) => {
      if (line.trim() || part.added || part.removed) {
        diffLines.push(`${prefix} ${line}`);
      }
    });
  });

  return diffLines.join('\n');
}
```

### 5. **代码安全性验证器（使用 ESLint + eslint-plugin-security）**

```typescript
// lib/security/code-validator.ts

import { ESLint } from 'eslint';
import { parse } from '@typescript-eslint/parser';
import { TSESTree } from '@typescript-eslint/types';

interface SecurityCheck {
  safe: boolean;
  reason?: string;
  suggestions?: string;
  warnings?: string[];
}

// 初始化 ESLint（使用安全插件）
let eslintInstance: ESLint | null = null;

async function getESLint(): Promise<ESLint> {
  if (!eslintInstance) {
    eslintInstance = new ESLint({
      useEslintrc: false,
      baseConfig: {
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true,
          },
        },
        plugins: ['security'],
        extends: ['plugin:security/recommended'],
        rules: {
          // 自定义安全规则
          'no-eval': 'error',
          'no-implied-eval': 'error',
          'no-new-func': 'error',
          'no-script-url': 'error',
          // 安全插件规则
          'security/detect-eval-with-expression': 'error',
          'security/detect-non-literal-fs-filename': 'error',
          'security/detect-non-literal-regexp': 'error',
          'security/detect-non-literal-require': 'error',
          'security/detect-possible-timing-attacks': 'warn',
        },
      },
    });
  }
  return eslintInstance;
}

/**
 * 验证代码安全性（使用 ESLint + 安全插件）
 */
export async function validateCodeSecurity(code: string): Promise<SecurityCheck> {
  const warnings: string[] = [];

  try {
    // 1. 使用 ESLint 检查安全性
    const eslint = await getESLint();
    const results = await eslint.lintText(code, {
      filePath: 'Video.tsx',
    });

    const securityIssues: string[] = [];
    const lintWarnings: string[] = [];

    results.forEach((result) => {
      result.messages.forEach((message) => {
        if (message.severity === 2) {
          // 错误
          securityIssues.push(
            `${message.ruleId || 'unknown'}: ${message.message} (行 ${message.line})`
          );
        } else if (message.severity === 1) {
          // 警告
          lintWarnings.push(
            `${message.ruleId || 'unknown'}: ${message.message} (行 ${message.line})`
          );
        }
      });
    });

    if (securityIssues.length > 0) {
      return {
        safe: false,
        reason: `检测到安全问题：\n${securityIssues.join('\n')}`,
        suggestions: '请修复这些问题后再执行代码。',
      };
    }

    // 2. 检查白名单导入（使用 AST 解析）
    const ast = parse(code, {
      ecmaVersion: 2020,
      sourceType: 'module',
      jsx: true,
    });

    const allowedImports = [
      'react',
      'remotion',
      '@remotion/player',
      'react-dom',
    ];
    const imports = checkImports(ast);
    const disallowedImports = imports.filter(
      (imp) => !allowedImports.some((allowed) => imp.startsWith(allowed))
    );

    if (disallowedImports.length > 0) {
      warnings.push(`检测到非标准导入：${disallowedImports.join(', ')}`);
    }

    // 3. 合并警告
    if (lintWarnings.length > 0) {
      warnings.push(...lintWarnings);
    }

    return {
      safe: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      safe: false,
      reason: `代码验证失败：${error instanceof Error ? error.message : '未知错误'}`,
      suggestions: '请检查代码语法是否正确。',
    };
  }
}

/**
 * 检查危险 API
 */
function checkDangerousAPIs(ast: TSESTree.Program): string[] {
  const dangerous: string[] = [];

  function traverse(node: any) {
    if (!node) return;

    // 检查函数调用
    if (node.type === 'CallExpression') {
      const callee = node.callee;
      if (callee.type === 'Identifier') {
        const name = callee.name;
        const dangerousAPIs = [
          'fetch',
          'XMLHttpRequest',
          'WebSocket',
          'localStorage',
          'sessionStorage',
          'indexedDB',
          'document.cookie',
        ];

        if (dangerousAPIs.includes(name)) {
          dangerous.push(name);
        }
      }

      // 检查成员表达式，如 window.location
      if (callee.type === 'MemberExpression') {
        const object = callee.object;
        const property = callee.property;

        if (
          object.type === 'Identifier' &&
          object.name === 'window' &&
          property.type === 'Identifier'
        ) {
          const dangerousWindowAPIs = ['open', 'location', 'navigator'];
          if (dangerousWindowAPIs.includes(property.name)) {
            dangerous.push(`window.${property.name}`);
          }
        }
      }
    }

    // 递归遍历子节点
    for (const key in node) {
      if (key === 'parent' || key === 'range' || key === 'loc') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(traverse);
      } else if (child && typeof child === 'object') {
        traverse(child);
      }
    }
  }

  traverse(ast);
  return [...new Set(dangerous)];
}

/**
 * 检查网络请求
 */
function checkNetworkCalls(ast: TSESTree.Program): string[] {
  const calls: string[] = [];

  function traverse(node: any) {
    if (!node) return;

    if (node.type === 'CallExpression') {
      const callee = node.callee;
      if (callee.type === 'Identifier' && callee.name === 'fetch') {
        calls.push('fetch');
      }
    }

    for (const key in node) {
      if (key === 'parent' || key === 'range' || key === 'loc') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(traverse);
      } else if (child && typeof child === 'object') {
        traverse(child);
      }
    }
  }

  traverse(ast);
  return calls;
}

/**
 * 检查文件系统访问
 */
function checkFileSystemAccess(ast: TSESTree.Program): string[] {
  const accesses: string[] = [];

  function traverse(node: any) {
    if (!node) return;

    if (node.type === 'CallExpression') {
      const callee = node.callee;
      if (callee.type === 'Identifier') {
        const fsAPIs = ['readFile', 'writeFile', 'readdir', 'mkdir'];
        if (fsAPIs.includes(callee.name)) {
          accesses.push(callee.name);
        }
      }
    }

    for (const key in node) {
      if (key === 'parent' || key === 'range' || key === 'loc') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(traverse);
      } else if (child && typeof child === 'object') {
        traverse(child);
      }
    }
  }

  traverse(ast);
  return accesses;
}

/**
 * 检查导入
 */
function checkImports(ast: TSESTree.Program): string[] {
  const imports: string[] = [];

  function traverse(node: any) {
    if (!node) return;

    if (node.type === 'ImportDeclaration') {
      const source = node.source;
      if (source.type === 'Literal' && typeof source.value === 'string') {
        imports.push(source.value);
      }
    }

    for (const key in node) {
      if (key === 'parent' || key === 'range' || key === 'loc') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(traverse);
      } else if (child && typeof child === 'object') {
        traverse(child);
      }
    }
  }

  traverse(ast);
  return imports;
}
```

### 6. **代码执行和预览**

```tsx
// app/components/preview/CodePreview.tsx
"use client";

import { useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { useCodeStore } from '@/store/code-store';
import { compileAndExecuteCode } from '@/lib/execution/code-executor';
import { Loader2, AlertCircle } from 'lucide-react';

export default function CodePreview() {
  const { code } = useCodeStore();
  const [component, setComponent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  useEffect(() => {
    const execute = async () => {
      setIsCompiling(true);
      setError(null);

      try {
        const result = await compileAndExecuteCode(code);
        setComponent(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : '执行失败');
        setComponent(null);
      } finally {
        setIsCompiling(false);
      }
    };

    // 防抖执行
    const timeoutId = setTimeout(execute, 500);
    return () => clearTimeout(timeoutId);
  }, [code]);

  if (isCompiling) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">正在编译代码...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 font-medium mb-2">代码执行错误</p>
          <pre className="text-sm text-red-400 bg-red-900/30 p-4 rounded overflow-auto">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <p>还没有可执行的代码</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">实时预览</h3>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
          <Player
            component={component}
            durationInFrames={300}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            controls
            style={{
              width: '100%',
              maxWidth: '800px',
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

### 7. **代码执行器（使用 esbuild-wasm）**

```typescript
// lib/execution/code-executor.ts

import * as esbuild from 'esbuild-wasm';
import { debounce } from 'lodash-es';

// 初始化 esbuild
let isInitialized = false;

async function initializeEsbuild() {
  if (isInitialized) return;

  await esbuild.initialize({
    wasmURL: 'https://unpkg.com/esbuild-wasm@0.19.0/esbuild.wasm',
    worker: true,
  });

  isInitialized = true;
}

/**
 * 编译和执行代码（使用 esbuild-wasm）
 */
export async function compileAndExecuteCode(code: string): Promise<any> {
  try {
    await initializeEsbuild();

    // 1. 使用 esbuild 编译 TypeScript
    const result = await esbuild.transform(code, {
      loader: 'tsx',
      format: 'esm',
      target: 'es2020',
      jsx: 'automatic',
      bundle: false,
    });

    if (result.warnings.length > 0) {
      console.warn('编译警告:', result.warnings);
    }

    // 2. 在沙箱中执行编译后的代码
    const module = await executeInSandbox(result.code);
    return module.RemotionRoot;
  } catch (error) {
    throw new Error(
      `代码执行失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 在沙箱中执行代码（使用 iframe）
 */
async function executeInSandbox(code: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // 创建 iframe 沙箱
    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-scripts');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // 在 iframe 中执行代码
    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) {
      reject(new Error('无法创建 iframe 沙箱'));
      return;
    }

    // 设置必要的全局变量
    iframeWindow.eval(`
      // 注入必要的依赖（简化处理，实际应该更完整）
      const React = window.React;
      const Remotion = window.Remotion;
      
      // 执行代码
      ${code}
      
      // 返回 RemotionRoot
      if (typeof RemotionRoot !== 'undefined') {
        window.__remotionRoot = RemotionRoot;
      } else {
        throw new Error('未找到 RemotionRoot 导出');
      }
    `);

    try {
      const RemotionRoot = (iframeWindow as any).__remotionRoot;
      if (RemotionRoot) {
        resolve(RemotionRoot);
      } else {
        reject(new Error('代码执行后未返回 RemotionRoot'));
      }
    } catch (error) {
      reject(error);
    } finally {
      // 清理 iframe
      document.body.removeChild(iframe);
    }
  });
}

/**
 * 防抖编译（用于实时预览）
 */
export const debouncedCompile = debounce(
  async (code: string, callback: (result: any) => void) => {
    try {
      const component = await compileAndExecuteCode(code);
      callback(component);
    } catch (error) {
      callback(null);
    }
  },
  500
);
```

## 五、主应用界面

```tsx
// app/page.tsx
"use client";

import dynamic from 'next/dynamic';
import { Settings } from 'lucide-react';
import { useState } from 'react';

const AIChatInterface = dynamic(() => import('@/components/ai/AIChatInterface'), {
  ssr: false,
});

const CodePreview = dynamic(() => import('@/components/preview/CodePreview'), {
  ssr: false,
});

const AIConfigPanel = dynamic(() => import('@/components/settings/AIConfigPanel'), {
  ssr: false,
});

export default function HomePage() {
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  if (showSettings) {
    return (
      <div className="h-screen bg-gray-950">
        <AIConfigPanel />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：AI 对话界面（包含可选的代码编辑器） */}
        <div className="flex-1">
          <AIChatInterface />
        </div>

        {/* 右侧：预览（可选） */}
        {showPreview && (
          <div className="w-1/2 border-l border-gray-800">
            <CodePreview />
          </div>
        )}
      </div>
    </div>
  );
}
```

## 六、项目配置

### package.json（全部使用第三方开源库）
```json
{
  "name": "ai-video-code-generator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    // 前端框架
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    
    // UI 和样式
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.344.0",
    
    // 视频引擎（Remotion 核心）
    "remotion": "^4.0.0",
    "@remotion/player": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    
    // Remotion Studio UI（基于官方 UI 改造）
    "@remotion/studio": "^4.0.0",                // Remotion Studio 完整 UI
    // 或者使用独立组件（如果可用）
    // "@remotion/studio-timeline": "^4.0.0",
    // "@remotion/studio-preview": "^4.0.0",
    // "@remotion/studio-property-panel": "^4.0.0",
    
    // 代码编辑器（可选，Remotion Studio 已包含）
    "@monaco-editor/react": "^4.5.2",
    
    // 代码编译和执行
    "esbuild-wasm": "^0.19.0",
    
    // AI 集成（Vercel AI SDK）
    "ai": "^3.0.0",
    "@ai-sdk/openai": "^0.0.0",
    "@ai-sdk/anthropic": "^0.0.0",
    
    // 代码分析和验证
    "@typescript-eslint/parser": "^6.0.0",
    "@typescript-eslint/typescript-estree": "^6.0.0",
    "eslint": "^8.57.0",
    "eslint-plugin-security": "^2.1.0",
    
    // 代码格式化
    "prettier": "^3.0.0",
    
    // 代码差异
    "diff": "^5.1.0",
    "react-diff-view": "^2.0.0",
    
    // 状态管理
    "zustand": "^4.4.7",
    
    // 文件处理
    "react-dropzone": "^14.2.3",
    "localforage": "^1.10.0",
    "file-saver": "^2.0.5",
    
    // 工具库
    "lodash-es": "^4.17.21",
    "date-fns": "^3.0.0",
    "uuid": "^9.0.0",
    "ajv": "^8.12.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/lodash-es": "^4.17.12",
    "@types/uuid": "^9.0.0",
    "@types/diff": "^5.0.0",
    "autoprefixer": "^10.0.1",
    "eslint-config-next": "14.1.0",
    "postcss": "^8",
    "@typescript-eslint/eslint-plugin": "^6.0.0"
  }
}
```

## 七、开发路线图（3周 MVP）

### 第1周：核心 AI 和代码编辑
- [ ] 实现 AI 对话界面
- [ ] 实现 Monaco 代码编辑器
- [ ] 实现 AI 代码生成器
- [ ] 实现代码 Store 和状态管理

### 第2周：安全性和执行
- [ ] 实现代码安全性验证器
- [ ] 实现代码编译和执行
- [ ] 实现实时预览
- [ ] 完善错误处理

### 第3周：优化和导出
- [ ] 实现视频导出功能
- [ ] 性能优化
- [ ] UI/UX 优化
- [ ] 文档和部署准备

## 八、核心优势

1. **类似 Cursor 的体验**：AI 交互式编程，自然语言生成代码
2. **代码完全控制**：直接编辑 Remotion 代码，完全灵活
3. **安全性保障**：代码执行前验证，防止恶意代码
4. **可选代码视图**：用户可以选择显示或隐藏代码编辑器
5. **实时预览**：代码修改后立即看到效果
6. **单文件编辑**：专注于单个视频组件，简单直接

## 九、安全性设计

1. **AST 静态分析**：解析代码 AST，检测危险 API
2. **白名单机制**：只允许导入安全的库（React、Remotion 等）
3. **沙箱执行**：代码在隔离环境中执行
4. **实时验证**：代码修改时立即验证安全性
5. **用户确认**：AI 生成的代码需要用户确认才能应用

## 十、服务器成本分析

### 1. 架构特点（低成本设计）

本项目采用**浏览器端优先**的架构，大部分计算在客户端完成：

- ✅ **代码编译**：使用 `esbuild-wasm`，在浏览器中编译
- ✅ **代码执行**：在浏览器 iframe 沙箱中执行
- ✅ **视频预览**：使用 `@remotion/player`，浏览器端渲染
- ✅ **文件存储**：使用 `localForage + IndexedDB`，浏览器本地存储
- ✅ **AI API**：用户自己配置，不占用服务器资源
- ⚠️ **视频导出**：可选择浏览器端（ffmpeg.wasm）或服务端（@remotion/renderer）

### 2. 服务器资源需求

#### 方案 A：纯静态部署（最低成本）

**适用场景**：仅使用浏览器端功能，视频导出也在浏览器完成

**资源需求**：
- Next.js 静态导出（`next export`）
- 静态文件托管（HTML/CSS/JS）

**成本估算**：

| 服务商 | 方案 | 月成本 | 年成本 | 说明 |
|--------|------|--------|--------|------|
| **Vercel** | Hobby (免费) | $0 | $0 | 100GB 带宽/月，适合 MVP |
| **Vercel** | Pro | $20 | $240 | 1TB 带宽/月，团队功能 |
| **Netlify** | Starter (免费) | $0 | $0 | 100GB 带宽/月 |
| **Netlify** | Pro | $19 | $228 | 1TB 带宽/月 |
| **Cloudflare Pages** | 免费 | $0 | $0 | 无限带宽，适合静态站点 |
| **GitHub Pages** | 免费 | $0 | $0 | 1GB 存储，100GB 带宽/月 |

**推荐**：Cloudflare Pages（免费，无限带宽）

**总成本**：**$0/月**（MVP 阶段）

---

#### 方案 B：Next.js 服务端部署（中等成本）

**适用场景**：需要 API Routes、服务端渲染、或服务端视频导出

**资源需求**：
- Next.js 应用服务器
- 可选：视频渲染服务器（如果使用 @remotion/renderer）

**成本估算**：

| 服务商 | 方案 | 配置 | 月成本 | 年成本 | 说明 |
|--------|------|------|--------|--------|------|
| **Vercel** | Hobby | - | $0 | $0 | 100GB 带宽，适合 MVP |
| **Vercel** | Pro | - | $20 | $240 | 1TB 带宽，团队功能 |
| **Railway** | Starter | 512MB RAM | $5 | $60 | 适合小规模 |
| **Railway** | Hobby | 1GB RAM | $10 | $120 | 适合中等规模 |
| **Render** | Free | 512MB RAM | $0 | $0 | 有休眠限制 |
| **Render** | Starter | 512MB RAM | $7 | $84 | 无休眠 |
| **Fly.io** | 共享 CPU | 256MB RAM | ~$2 | ~$24 | 按使用量计费 |

**推荐**：Vercel Pro（$20/月）或 Railway Hobby（$10/月）

**总成本**：**$0-20/月**（取决于功能需求）

---

#### 方案 C：服务端视频渲染（较高成本）

**适用场景**：需要高质量视频导出，使用 @remotion/renderer

**资源需求**：
- Next.js 应用服务器
- 视频渲染服务器（CPU 密集型）

**成本估算**：

| 服务商 | 方案 | 配置 | 月成本 | 年成本 | 说明 |
|--------|------|------|--------|--------|------|
| **Railway** | 视频渲染 | 2GB RAM, 2 CPU | $20 | $240 | 按使用量计费 |
| **Render** | Web Service | 2GB RAM | $25 | $300 | 固定费用 |
| **Fly.io** | 高性能 | 2GB RAM, 2 CPU | ~$15 | ~$180 | 按使用量计费 |
| **AWS Lambda** | 按需 | - | ~$5-50 | ~$60-600 | 按渲染次数计费 |
| **Google Cloud Run** | 按需 | - | ~$5-50 | ~$60-600 | 按渲染次数计费 |

**推荐**：Fly.io（按需计费）或 Railway（固定费用）

**总成本**：**$5-50/月**（取决于渲染量）

---

### 3. 成本对比表

| 方案 | MVP 阶段 | 小规模（100用户/月） | 中等规模（1000用户/月） | 大规模（10000用户/月） |
|------|----------|---------------------|----------------------|----------------------|
| **方案 A（纯静态）** | $0 | $0 | $0-20 | $20-100 |
| **方案 B（服务端）** | $0-10 | $10-20 | $20-50 | $50-200 |
| **方案 C（视频渲染）** | $5-20 | $20-50 | $50-200 | $200-1000 |

### 4. 推荐方案

#### MVP 阶段（0-100 用户）
- **部署**：Vercel Hobby（免费）或 Cloudflare Pages（免费）
- **视频导出**：使用 `ffmpeg.wasm`（浏览器端）
- **总成本**：**$0/月**

#### 小规模（100-1000 用户）
- **部署**：Vercel Pro（$20/月）或 Railway Hobby（$10/月）
- **视频导出**：浏览器端优先，必要时使用服务端
- **总成本**：**$10-20/月**

#### 中等规模（1000-10000 用户）
- **部署**：Vercel Pro（$20/月）+ Railway（$20/月，视频渲染）
- **视频导出**：混合方案（浏览器 + 服务端）
- **总成本**：**$40-50/月**

#### 大规模（10000+ 用户）
- **部署**：Vercel Enterprise + 专用渲染服务器
- **视频导出**：服务端渲染 + CDN
- **总成本**：**$200-1000/月**（取决于使用量）

### 5. 成本优化建议

1. **优先使用浏览器端功能**
   - 代码编译、执行、预览都在浏览器完成
   - 减少服务器计算压力

2. **视频导出策略**
   - MVP：使用 `ffmpeg.wasm`（浏览器端，免费）
   - 小规模：浏览器端 + 服务端混合
   - 大规模：服务端渲染 + CDN 缓存

3. **使用 CDN 加速**
   - Cloudflare（免费 CDN）
   - Vercel Edge Network（内置）
   - 减少带宽成本

4. **按需扩展**
   - 从免费方案开始
   - 根据实际使用量逐步升级
   - 使用按需计费服务（如 Fly.io、AWS Lambda）

5. **缓存策略**
   - 静态资源 CDN 缓存
   - API 响应缓存
   - 减少服务器请求

### 6. 额外成本（用户承担）

- **AI API 费用**：用户自己配置，不占用服务器资源
  - OpenAI GPT-4：~$0.03/1K tokens
  - Anthropic Claude：~$0.015/1K tokens
  - 用户自行承担

- **文件存储**：浏览器 IndexedDB，无需服务器存储

### 7. 总结

**MVP 阶段总成本：$0/月**（使用免费托管方案）

**小规模运营成本：$10-20/月**（使用基础付费方案）

**优势**：
- ✅ 大部分计算在浏览器端，服务器压力小
- ✅ 可以完全免费启动（静态部署）
- ✅ 按需扩展，成本可控
- ✅ AI API 费用由用户承担，不占用服务器资源

**建议**：从免费方案开始，根据实际使用量逐步升级。
