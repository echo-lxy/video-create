# 浏览器端视频导出技术方案

## 问题分析

### 为什么之前不支持浏览器导出？

1. **Remotion Renderer 需要 Node.js 环境**
   - `@remotion/renderer` 是服务端渲染工具
   - 需要 Node.js 环境，无法在浏览器中直接使用
   - GitHub Pages 是静态托管，不支持 Node.js

2. **浏览器限制**
   - 无法直接访问文件系统
   - 无法使用 Node.js API（fs, path 等）
   - 视频编码需要大量计算资源

## 解决方案

### 方案 1: WebCodecs API（最佳方案）✨

**支持浏览器**：
- Chrome 94+
- Edge 94+
- Safari 16.4+
- Firefox（实验性支持）

**原理**：
- 使用浏览器原生的视频编码器（H.264）
- 直接编码视频帧，无需中间步骤
- 质量高，文件小，性能好

**实现**：
```typescript
// 1. 检查浏览器支持
if ('VideoEncoder' in window) {
  // 2. 创建编码器
  const encoder = new VideoEncoder({
    output: (chunk) => chunks.push(chunk.data),
    error: (error) => reject(error),
  });

  // 3. 配置编码器（H.264）
  encoder.configure({
    codec: 'avc1.42E01E',
    width: 1920,
    height: 1080,
    bitrate: 5000000,
    framerate: 30,
  });

  // 4. 逐帧编码
  for (let frame = 0; frame < totalFrames; frame++) {
    const imageData = await renderFrame(frame);
    const videoFrame = new VideoFrame(imageData, {
      timestamp: (frame / fps) * 1000000,
    });
    encoder.encode(videoFrame);
  }

  // 5. 导出 MP4
  await encoder.flush();
  const blob = new Blob(chunks, { type: 'video/mp4' });
  saveAs(blob, 'video.mp4');
}
```

**优势**：
- ✅ 高质量 H.264 编码
- ✅ 文件体积小
- ✅ 性能好（硬件加速）
- ✅ 无需用户交互

**限制**：
- ❌ 需要现代浏览器
- ❌ 需要从 Remotion Player 获取帧图像（当前实现中需要完善）

### 方案 2: Canvas + MediaRecorder（兼容方案）

**支持浏览器**：
- Chrome 47+
- Firefox 25+
- Safari 14+
- Edge 79+

**原理**：
- 使用 Canvas 渲染每一帧
- 使用 `canvas.captureStream()` 创建视频流
- 使用 MediaRecorder 录制视频流

**实现**：
```typescript
// 1. 创建 Canvas
const canvas = document.createElement('canvas');
canvas.width = 1920;
canvas.height = 1080;
const ctx = canvas.getContext('2d');

// 2. 创建视频流
const stream = canvas.captureStream(30); // 30 fps
const recorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
});

// 3. 逐帧渲染
for (let frame = 0; frame < totalFrames; frame++) {
  await renderFrameToCanvas(frame, canvas, ctx);
  await wait(1000 / fps);
}

// 4. 停止录制并下载
recorder.stop();
const blob = new Blob(chunks, { type: 'video/webm' });
saveAs(blob, 'video.webm');
```

**优势**：
- ✅ 兼容性好
- ✅ 实现相对简单
- ✅ 支持多种编码格式（VP8, VP9）

**限制**：
- ❌ 需要从 Remotion Player 获取帧图像
- ❌ 文件格式通常是 WebM（不是 MP4）
- ❌ 质量可能不如 WebCodecs

### 方案 3: 屏幕录制（当前实现，备用方案）

**支持浏览器**：
- Chrome 72+
- Firefox 66+
- Safari 13+
- Edge 79+

**原理**：
- 使用 `getDisplayMedia` API 录制屏幕
- 用户选择要录制的窗口
- 自动录制并下载

**实现**：
```typescript
// 1. 请求屏幕录制权限
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: { width: 1920, height: 1080, frameRate: 30 },
});

// 2. 录制视频流
const recorder = new MediaRecorder(stream);
recorder.start();

// 3. 自动停止（根据视频时长）
setTimeout(() => recorder.stop(), duration);

// 4. 下载视频
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  saveAs(blob, 'video.webm');
};
```

**优势**：
- ✅ 兼容性最好
- ✅ 实现最简单
- ✅ 不需要访问 Player 内部

**限制**：
- ❌ 需要用户手动选择窗口
- ❌ 录制的是屏幕，不是直接渲染
- ❌ 可能包含不需要的内容（浏览器 UI 等）

## 当前实现状态

### 已实现 ✅

1. **自动方案选择**
   - 优先尝试 WebCodecs API
   - 其次尝试 Canvas + MediaRecorder
   - 最后回退到屏幕录制

2. **屏幕录制方案**（完全可用）
   - 用户友好的提示
   - 自动停止录制
   - 自动下载视频

### 待完善 ⚠️

1. **WebCodecs API 实现**
   - 需要从 Remotion Player 获取当前帧的 ImageData
   - 当前实现中，`player.seekTo()` 后需要等待渲染完成
   - 需要找到获取 Player 内部 canvas 的方法

2. **Canvas 方案实现**
   - 同样需要从 Player 获取帧图像
   - 需要实现 `renderFrameToCanvas` 函数

## 技术挑战

### 挑战 1: 如何从 Remotion Player 获取帧图像？

**问题**：Remotion Player 不直接暴露内部 canvas 或帧图像。

**可能的解决方案**：

1. **使用 Remotion 的 `renderFrames` API**
   ```typescript
   import { renderFrames } from '@remotion/renderer';
   // 但这需要 Node.js 环境
   ```

2. **使用 Remotion Player 的 ref API**
   ```typescript
   const playerRef = useRef<PlayerRef>(null);
   // 检查 Player 是否提供获取帧的方法
   const frame = playerRef.current?.getCurrentFrame?.();
   ```

3. **使用 Canvas 截图**
   ```typescript
   // 如果 Player 渲染到 canvas，可以截图
   const canvas = playerRef.current?.getCanvas?.();
   const imageData = ctx.getImageData(0, 0, width, height);
   ```

4. **使用 OffscreenCanvas**
   ```typescript
   // 创建一个隐藏的 Player，逐帧渲染
   const offscreenCanvas = new OffscreenCanvas(width, height);
   // 渲染组件到 OffscreenCanvas
   ```

### 挑战 2: 性能优化

**问题**：渲染 300 帧（10 秒 @ 30fps）可能需要较长时间。

**优化方案**：
1. **使用 Web Workers**：在后台线程中编码
2. **批量处理**：一次处理多帧
3. **进度显示**：显示导出进度
4. **降低分辨率**：导出时使用较低分辨率

## 推荐实现路径

### 短期（当前）

✅ **使用屏幕录制方案**
- 已经可用
- 用户体验良好
- 兼容性最好

### 中期

🔧 **完善 Canvas + MediaRecorder 方案**
- 研究如何从 Remotion Player 获取帧图像
- 实现逐帧渲染到 Canvas
- 使用 MediaRecorder 录制

### 长期

🚀 **实现 WebCodecs API 方案**
- 使用 WebCodecs 进行高质量编码
- 支持 H.264 格式（MP4）
- 最佳性能和文件大小

## 参考资源

- [WebCodecs API 文档](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [MediaRecorder API 文档](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Remotion 渲染文档](https://www.remotion.dev/docs/render)
- [Canvas API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## 总结

浏览器端视频导出是**可行的**，但需要：

1. **现代浏览器 API**：WebCodecs 或 MediaRecorder
2. **从 Player 获取帧图像**：这是当前的主要挑战
3. **性能优化**：处理大量帧时的性能考虑

当前实现的**屏幕录制方案**已经可以满足基本需求，但**真正的浏览器端导出**需要进一步完善从 Remotion Player 获取帧图像的功能。

