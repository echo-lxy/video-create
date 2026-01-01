/**
 * 多种导出格式支持
 * 参考 Remotion 官方实现
 */

import { saveAs } from 'file-saver';
import { renderMediaOnWeb } from '@remotion/web-renderer';
import { ExportSettings, ExportFormat, VideoCodec, ExportQuality } from '@/components/editor/ExportDialog';

export interface ExportProgress {
  renderedFrames: number;
  encodedFrames: number;
  totalFrames: number;
  stage: 'rendering' | 'encoding' | 'processing';
}

interface VideoExportOptions {
  codec: VideoCodec;
  quality: ExportQuality;
  startFrame: number;
  endFrame: number;
  width: number;
  height: number;
  fps: number;
  container: 'mp4' | 'webm';
}

/**
 * 通用导出函数，支持多种格式
 */
export async function exportWithSettings(
  component: React.ComponentType,
  settings: ExportSettings,
  baseConfig: {
    durationInFrames: number;
    fps: number;
    width: number;
    height: number;
  },
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const {
    format,
    codec = 'h264',
    quality = 'high',
    startFrame = 0,
    endFrame = baseConfig.durationInFrames - 1,
    scale = 1,
    fps = baseConfig.fps,
    loop = true,
    jpegQuality = 90,
  } = settings;

  const actualWidth = Math.round(baseConfig.width * scale);
  const actualHeight = Math.round(baseConfig.height * scale);
  const actualDuration = endFrame - startFrame + 1;

  switch (format) {
    case 'mp4':
    case 'webm':
      return exportVideo(component, {
        codec: codec as VideoCodec,
        quality: quality as ExportQuality,
        startFrame,
        endFrame,
        width: actualWidth,
        height: actualHeight,
        fps,
        container: format === 'webm' ? 'webm' : 'mp4',
      }, onProgress);

    case 'gif':
      return exportGIF(component, {
        startFrame,
        endFrame,
        width: actualWidth,
        height: actualHeight,
        fps,
        loop,
      }, onProgress);

    case 'png-sequence':
      return exportImageSequence(component, {
        startFrame,
        endFrame,
        width: actualWidth,
        height: actualHeight,
        fps,
        format: 'png',
      }, onProgress);

    case 'jpeg-sequence':
      return exportImageSequence(component, {
        startFrame,
        endFrame,
        width: actualWidth,
        height: actualHeight,
        fps,
        format: 'jpeg',
        quality: jpegQuality,
      }, onProgress);

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * 导出视频（MP4/WebM）
 */
async function exportVideo(
  component: React.ComponentType,
  options: VideoExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const duration = options.endFrame - options.startFrame + 1;

  try {
    const { getBlob } = await renderMediaOnWeb({
      composition: {
        component,
        durationInFrames: duration,
        fps: options.fps,
        width: options.width,
        height: options.height,
        calculateMetadata: null,
        id: 'export-composition',
      },
      inputProps: {},
      videoCodec: options.codec,
      videoBitrate: options.quality,
      container: options.container,
      muted: true,
      onProgress: onProgress ? (progress: any) => {
        // @remotion/web-renderer 的进度对象结构可能不同
        // 使用安全的属性访问
        const rendered = progress.rendered ?? progress.renderedFrames ?? 0;
        const encoded = progress.encoded ?? progress.encodedFrames ?? 0;
        onProgress({
          renderedFrames: rendered,
          encodedFrames: encoded,
          totalFrames: duration,
          stage: encoded < rendered ? 'rendering' : 'encoding',
        });
      } : null,
      hardwareAcceleration: 'prefer-hardware',
      licenseKey: 'free-license',
    });

    const blob = await getBlob();
    const extension = options.container === 'webm' ? 'webm' : 'mp4';
    const filename = `video-${Date.now()}.${extension}`;
    saveAs(blob, filename);
  } catch (error: any) {
    console.error('Video export failed:', error);
    throw new Error(`视频导出失败: ${error.message}`);
  }
}

/**
 * 导出 GIF
 * 使用 canvas 逐帧渲染并转换为 GIF
 */
async function exportGIF(
  component: React.ComponentType,
  options: {
    startFrame: number;
    endFrame: number;
    width: number;
    height: number;
    fps: number;
    loop: boolean;
  },
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  // 注意：浏览器端 GIF 导出需要使用第三方库（如 gif.js）
  // 这里提供一个基础实现框架
  const duration = options.endFrame - options.startFrame + 1;
  
  // 动态导入 gif.js（如果可用）
  let GIF: any;
  try {
    // 这里需要安装 gif.js 或使用其他 GIF 编码库
    // 暂时使用提示信息
    throw new Error('GIF 导出需要额外的库支持。请使用 MP4 或图片序列格式。');
  } catch (error: any) {
    if (error.message.includes('GIF 导出需要')) {
      throw error;
    }
    // 如果库加载失败，抛出错误
    throw new Error('GIF 导出功能暂不可用。请使用 MP4 或图片序列格式。');
  }

  // TODO: 实现 GIF 导出逻辑
  // 1. 创建 canvas
  // 2. 逐帧渲染组件到 canvas
  // 3. 使用 gif.js 编码为 GIF
  // 4. 下载文件
}

/**
 * 导出图片序列（PNG/JPEG）
 */
async function exportImageSequence(
  component: React.ComponentType,
  options: {
    startFrame: number;
    endFrame: number;
    width: number;
    height: number;
    fps: number;
    format: 'png' | 'jpeg';
    quality?: number;
  },
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const duration = options.endFrame - options.startFrame + 1;
  const frames: Blob[] = [];

  // 创建 canvas 用于渲染
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文');
  }

  // 使用 Remotion 渲染每一帧
  // 注意：这里需要逐帧渲染，可能需要使用 @remotion/player 的 API
  // 或者使用 renderMediaOnWeb 的帧级别 API（如果可用）

  // 临时实现：提示用户使用视频导出
  // 完整的图片序列导出需要更复杂的实现
  throw new Error('图片序列导出功能正在开发中。请先使用视频导出功能。');
}

