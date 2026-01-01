# 静态网页实时视频调试技术原理

## 概述

本项目实现了在**纯静态网页**（GitHub Pages）中实时编译 TypeScript 代码并预览 Remotion 视频的功能。这看起来像是一个"魔法"，但实际上是通过一系列现代 Web 技术实现的。

## 核心原理

### 1. 客户端编译（Client-Side Compilation）

#### 1.1 esbuild-wasm：浏览器中的 TypeScript 编译器

**关键点**：`esbuild-wasm` 是 `esbuild` 的 WebAssembly 版本，可以在浏览器中运行。

```typescript
// lib/compiler/code-compiler.ts
import * as esbuild from 'esbuild-wasm';

// 初始化 esbuild（下载 WASM 文件）
await esbuild.initialize({
  wasmURL: 'https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm'
});

// 在浏览器中编译 TypeScript
const result = await esbuild.transform(code, {
  loader: 'tsx',        // 支持 TypeScript + JSX
  target: 'es2020',
  format: 'esm',        // 输出 ES Module 格式
  jsxFactory: 'React.createElement',
});
```

**原理**：
- `esbuild` 是用 Go 编写的超快编译器
- 编译成 WebAssembly（WASM）后可以在浏览器中运行
- WASM 文件约 1-2MB，从 CDN 加载
- 编译速度：通常在 100-500ms 内完成

**优势**：
- ✅ 无需服务器，纯客户端运行
- ✅ 编译速度快（比 Babel 快 10-100 倍）
- ✅ 支持 TypeScript、JSX、ES6+ 等现代语法

#### 1.2 为什么不用服务端编译？

**传统方案**（需要服务器）：
```
用户代码 → 发送到服务器 → 服务器编译 → 返回结果 → 渲染
```

**我们的方案**（纯客户端）：
```
用户代码 → 浏览器编译（esbuild-wasm）→ 直接渲染
```

**优势**：
- ✅ 无需服务器成本
- ✅ 可以部署到 GitHub Pages（静态托管）
- ✅ 隐私保护（代码不上传服务器）
- ✅ 离线可用（WASM 缓存后）

---

### 2. 动态代码执行（Dynamic Code Execution）

#### 2.1 从字符串到可执行代码

编译后的代码是**字符串**，需要转换为**可执行的 JavaScript 函数**。

```typescript
// 编译后的代码（字符串）
const compiledCode = `
  const MyVideo = () => {
    const frame = useCurrentFrame();
    return <AbsoluteFill>...</AbsoluteFill>;
  };
  export { MyVideo };
`;

// 转换为可执行函数
const executeModule = new Function(
  'React',      // 注入 React
  'remotion',   // 注入 remotion
  'module',     // 注入 CommonJS module
  'exports',    // 注入 exports
  compiledCode  // 用户代码
);

// 执行并获取组件
const moduleExports = {};
executeModule(React, remotion, { exports: moduleExports }, moduleExports);
const MyVideo = moduleExports.MyVideo;
```

#### 2.2 依赖注入（Dependency Injection）

**问题**：用户代码需要 `React` 和 `remotion`，但无法使用 `import`。

**解决方案**：通过函数参数注入依赖。

```typescript
// 用户写的代码（不需要 import）
export const MyVideo = () => {
  const frame = useCurrentFrame();  // 来自 remotion
  return <AbsoluteFill>...</AbsoluteFill>;  // 来自 remotion
};

// 实际执行时注入依赖
executeModule(
  React,      // React 作为参数传入
  remotion,   // remotion 作为参数传入
  // ...
);
```

**原理**：
- 使用 `new Function()` 创建函数（类似 `eval`，但更安全）
- 函数参数成为"全局变量"
- 用户代码可以直接使用这些"全局变量"

#### 2.3 模块系统转换

**问题**：编译后的代码是 ESM（`export`），但浏览器需要 CommonJS（`module.exports`）。

**解决方案**：字符串替换 + 模块包装器。

```typescript
// 1. 处理 export const MyVideo = ...
executableCode = executableCode.replace(
  /export\s+const\s+MyVideo\s*=/g,
  'const MyVideo ='
);

// 2. 处理 export { MyVideo }
executableCode = executableCode.replace(
  /export\s+\{\s*MyVideo\s*\};?/g,
  'module.exports = { MyVideo };'
);

// 3. 创建 CommonJS 环境
const moduleExports = {};
const module = { exports: moduleExports };
executeModule(React, remotion, module, moduleExports, ...);
const MyVideo = moduleExports.MyVideo;
```

---

### 3. React 组件动态渲染

#### 3.1 从函数到 React 组件

执行代码后，我们得到了一个**函数**，这个函数就是 React 组件。

```typescript
// MyVideo 是一个函数
const MyVideo = () => {
  return <AbsoluteFill>Hello</AbsoluteFill>;
};

// 直接传递给 Remotion Player
<Player component={MyVideo} />
```

**原理**：
- React 组件本质上是函数（函数组件）
- 函数可以动态创建和传递
- Remotion Player 接受任何 React 组件

#### 3.2 实时更新流程

```
用户修改代码
    ↓
防抖（1秒延迟）
    ↓
代码验证（安全检查）
    ↓
esbuild-wasm 编译
    ↓
字符串替换（ESM → CommonJS）
    ↓
new Function() 执行
    ↓
提取组件（module.exports.MyVideo）
    ↓
更新 React state
    ↓
Remotion Player 重新渲染
    ↓
视频预览更新
```

**关键点**：
- 使用 `useState` 存储组件
- 组件更新触发 React 重新渲染
- Remotion Player 自动更新视频

---

### 4. 实时预览机制

#### 4.1 防抖编译（Debounced Compilation）

```typescript
// 使用 lodash-es/debounce
const debouncedCompile = debounce(
  (code: string) => compileAndValidate(code),
  1000  // 1秒延迟
);

// 代码变化时触发
useEffect(() => {
  debouncedCompile(code);
  return () => debouncedCompile.cancel();
}, [code]);
```

**原理**：
- 用户输入时，不立即编译
- 等待 1 秒无新输入后，才开始编译
- 减少不必要的编译，提高性能

#### 4.2 状态管理

```typescript
// 使用 Zustand 管理状态
const { code } = useCodeStore();           // 代码
const [component, setComponent] = useState(); // 组件
const { isCompiling } = useEditorStore();  // 编译状态
```

**流程**：
1. 用户修改代码 → 更新 `code` state
2. `code` 变化 → 触发 `useEffect`
3. 开始编译 → `isCompiling = true`
4. 编译完成 → `setComponent(newComponent)`
5. 组件更新 → Remotion Player 重新渲染

---

### 5. 安全性保障

#### 5.1 代码验证（静态分析）

```typescript
// lib/security/code-validator.ts
export async function validateCode(code: string) {
  // 1. 检查危险 API
  const dangerousAPIs = ['eval', 'Function', 'document.write', ...];
  
  // 2. 检查导入白名单
  const allowedImports = ['react', 'remotion'];
  
  // 3. 正则表达式检查
  if (code.includes('eval(')) {
    return { isValid: false, errors: ['不允许使用 eval'] };
  }
  
  return { isValid: true };
}
```

**原理**：
- 编译前进行静态分析
- 阻止危险代码执行
- 只允许安全的 API 和导入

#### 5.2 沙箱执行

虽然使用了 `new Function()`，但执行环境是**浏览器主线程**，不是真正的沙箱。

**限制**：
- 无法访问 `window`、`document` 等（除非显式注入）
- 无法使用 `import`（依赖注入）
- 无法访问文件系统、网络等

**注意**：这不是完全安全的沙箱，但对于视频生成场景已经足够。

---

### 6. 技术栈总结

| 技术 | 作用 | 为什么选择 |
|------|------|-----------|
| **esbuild-wasm** | 浏览器中编译 TypeScript | 速度快，支持现代语法 |
| **new Function()** | 动态执行代码 | 比 eval 更安全，性能更好 |
| **React** | UI 框架 | Remotion 基于 React |
| **Remotion Player** | 视频预览 | 官方预览组件 |
| **Zustand** | 状态管理 | 轻量，支持持久化 |
| **lodash-es/debounce** | 防抖 | 减少编译次数 |

---

### 7. 为什么这能在静态网页中工作？

#### 7.1 所有处理都在客户端

```
传统方案（需要服务器）：
浏览器 → 网络请求 → 服务器编译 → 网络响应 → 浏览器渲染

我们的方案（纯客户端）：
浏览器 → 本地编译 → 本地执行 → 本地渲染
```

#### 7.2 WebAssembly 的力量

- **WASM** 让浏览器可以运行编译型语言（Go、Rust 等）
- **esbuild-wasm** 是 Go 编译器编译成 WASM
- 性能接近原生，但可以在浏览器中运行

#### 7.3 现代浏览器 API

- **WebAssembly API**：运行 WASM 代码
- **MediaRecorder API**：录制视频（导出功能）
- **IndexedDB**：本地存储（代码持久化）
- **Service Worker**：缓存资源（加速加载）

---

### 8. 性能优化

#### 8.1 代码分割

```typescript
// 动态导入，按需加载
const VideoEditor = dynamic(() => import('@/components/editor/VideoEditor'), {
  ssr: false,
});
```

#### 8.2 资源缓存

```typescript
// Service Worker 缓存
// 第二次访问时，esbuild-wasm 和 Monaco Editor 从缓存加载
```

#### 8.3 防抖编译

```typescript
// 1秒内多次修改，只编译最后一次
debounce(compile, 1000);
```

---

### 9. 限制和注意事项

#### 9.1 浏览器限制

- **WASM 文件大小**：esbuild-wasm 约 1-2MB
- **编译速度**：比服务端慢，但可接受（100-500ms）
- **内存使用**：编译大型项目可能占用较多内存

#### 9.2 功能限制

- **无法使用 Node.js API**：`fs`、`path` 等
- **无法访问文件系统**：只能使用注入的资源
- **网络请求受限**：需要 CORS 支持

#### 9.3 安全性

- **不是完全沙箱**：代码在浏览器主线程执行
- **依赖静态分析**：可能绕过检查
- **适合场景**：视频生成、代码预览等非敏感场景

---

### 10. 类似项目参考

这种技术方案被广泛使用：

1. **CodeSandbox**：在线 IDE，使用 esbuild-wasm 编译
2. **StackBlitz**：在线 IDE，使用 WebContainer
3. **Replit**：在线编程环境
4. **JSFiddle / CodePen**：代码片段编辑器

**共同点**：
- 客户端编译
- 实时预览
- 无需服务器

---

## 总结

静态网页实现实时视频调试的核心原理：

1. **客户端编译**：esbuild-wasm 在浏览器中编译 TypeScript
2. **动态执行**：new Function() 将字符串转换为可执行代码
3. **依赖注入**：通过函数参数注入 React 和 remotion
4. **实时更新**：React state 更新触发 Remotion Player 重新渲染
5. **安全性**：静态分析 + 白名单限制

**关键洞察**：
- 现代浏览器足够强大，可以在客户端完成编译和执行
- WebAssembly 让浏览器可以运行编译型语言
- React 的组件模型让动态组件成为可能

这就是为什么一个"静态网页"可以实现如此复杂的功能！

