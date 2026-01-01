# AI Video Code Generator

> 基于 AI 驱动的 Remotion 视频代码生成器，提供类 VSCode 的交互式编码体验。

## ✨ 核心特性

- 🎬 **实时视频预览**：基于 Remotion Player 的实时渲染
- 💻 **专业代码编辑器**：Monaco Editor（VSCode 内核）
- 🎨 **VSCode 风格界面**：可调整大小的面板布局
- 🔒 **安全沙箱**：代码执行隔离，错误不影响应用
- 📤 **多格式导出**：支持 MP4、WebM、GIF、图片序列
- ⏱️ **时间轴控制**：精确的帧级别控制
- 🎯 **TypeScript 支持**：完整的类型检查和自动补全

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

### 静态导出（GitHub Pages）

```bash
npm run export
```

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页面
│   └── globals.css        # 全局样式
├── components/
│   ├── editor/            # 编辑器核心组件
│   │   ├── VideoEditor.tsx      # 主编辑器
│   │   ├── CodeEditor.tsx       # 代码编辑器
│   │   ├── VideoPreview.tsx     # 视频预览
│   │   ├── Timeline.tsx         # 时间轴
│   │   ├── ExportDialog.tsx     # 导出对话框
│   │   ├── ActivityBar.tsx      # 活动栏
│   │   ├── Sidebar.tsx          # 侧边栏
│   │   ├── StatusBar.tsx        # 状态栏
│   │   └── ErrorBoundary.tsx    # 错误边界
│   ├── ui/                # UI 组件
│   └── ...
├── lib/
│   ├── compiler/          # TypeScript 编译器
│   ├── security/          # 代码安全验证
│   ├── store/             # Zustand 状态管理
│   ├── utils/             # 工具函数
│   └── video/             # 视频导出
└── public/                # 静态资源
```

## 🛠️ 技术栈

### 核心框架
- **Next.js 14** - React 框架（App Router）
- **React 18** - UI 库
- **TypeScript** - 类型安全

### 视频处理
- **Remotion** - 视频渲染引擎
- **@remotion/player** - 视频播放器
- **@remotion/web-renderer** - 浏览器端渲染

### 编辑器
- **Monaco Editor** - 代码编辑器（VSCode 内核）
- **esbuild-wasm** - 浏览器端 TypeScript 编译

### UI/UX
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库
- **react-resizable-panels** - 可调整大小的面板

### 状态管理
- **Zustand** - 轻量级状态管理

### 工具库
- **lodash-es** - 工具函数
- **file-saver** - 文件下载
- **localforage** - 本地存储

## 🎯 核心功能

### 1. 代码编辑

- TypeScript/JSX 语法高亮
- 智能代码补全
- 实时错误提示
- 格式化支持

### 2. 实时预览

- 自动编译代码
- 实时视频渲染
- 帧级别控制
- 播放速度调整

### 3. 视频导出

支持多种格式：
- **视频**：MP4（H.264/H.265）、WebM（VP8/VP9）
- **GIF**：可调整质量和帧率
- **图片序列**：PNG/JPEG

### 4. 错误处理

- 多层错误边界保护
- 非阻塞错误提示
- 代码沙箱隔离
- 友好的错误信息

## 🔧 配置

### 环境变量

创建 `.env.local` 文件：

```bash
# 可选：AI API 配置
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
```

### Next.js 配置

`next.config.js` 关键配置：

```javascript
module.exports = {
  output: 'export',  // 静态导出
  basePath: '/video-create',  // GitHub Pages 路径
  images: {
    unoptimized: true,  // 静态导出必需
  },
  // ...
}
```

## 📦 部署

### GitHub Pages

1. 构建静态文件：
```bash
npm run export
```

2. 部署 `out/` 目录到 GitHub Pages

### Vercel/Netlify

直接连接 Git 仓库，自动部署。

## 🐛 已知问题

### ResizeObserver 警告

这是浏览器的已知问题，不影响功能。已通过全局错误处理屏蔽。

### 首次加载较慢

需要加载 Monaco Editor（~2MB）和 esbuild-wasm（~1MB）。
后续访问会使用缓存，加载时间显著缩短。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Remotion](https://www.remotion.dev/) - 视频渲染引擎
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架

---

**开发者**: 资深研发专家团队
**版本**: 0.1.0
