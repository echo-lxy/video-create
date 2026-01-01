# API 客户端调用方案

## 问题

GitHub Pages 是静态站点，不支持服务端 API 路由。`/api/chat` 路由在 GitHub Pages 上不可用。

## 解决方案

将 AI API 调用改为客户端直接调用，绕过 Next.js API 路由。

## 实现步骤

### 方案 1：直接在客户端调用 AI API（推荐）

修改 `components/ai/AIChatPanel.tsx`，直接调用 AI 提供商的 API：

```typescript
// 替换 useChat hook
const { messages, input, handleInputChange, handleSubmit, isLoading } =
  useChat({
    api: '/api/chat', // 改为直接调用 AI API
    // 或者使用自定义 fetch
  });
```

### 方案 2：使用环境变量配置 API 端点

1. 创建客户端 API 调用函数
2. 使用环境变量配置 API 端点
3. 直接调用 OpenAI/Anthropic API

### 方案 3：部署到支持服务端的平台

- **Vercel**（推荐）：完全支持 Next.js API Routes
- **Netlify**：支持 Netlify Functions
- **Cloudflare Pages**：支持 Workers

## 当前状态

- ✅ 静态资源路径已修复（basePath）
- ⚠️ API 路由已禁用（GitHub Pages 限制）
- 🔄 需要实现客户端 API 调用

## 临时解决方案

在实现客户端调用之前，AI 功能暂时不可用。但其他功能（代码编辑、预览）正常工作。

## 下一步

1. 实现客户端 AI API 调用
2. 或者部署到 Vercel/Netlify
3. 或者使用第三方 API 网关服务

