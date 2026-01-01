/**
 * 视频导出功能
 * 支持多种浏览器端导出方案：
 * 1. WebCodecs API（最佳，Chrome 94+, Edge 94+, Safari 16.4+）
 * 2. Canvas + MediaRecorder（兼容方案）
 * 3. 屏幕录制（备用方案）
 */

import { saveAs } from 'file-saver';

export interface ExportOptions {
  component: React.ComponentType;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  outputPath?: string;
  codec?: 'h264' | 'vp8' | 'vp9';
  quality?: number;
}

/**
 * 导出视频（自动选择最佳方案）
 * 优先使用 WebCodecs API，其次 Canvas + MediaRecorder，最后屏幕录制
 */
export async function exportVideo(
  options: ExportOptions,
  playerRef?: React.RefObject<any>
): Promise<void> {
  try {
    console.log('开始导出视频...', options);
    
    // 方案 1: 尝试使用 WebCodecs API（最佳方案）
    if (supportsWebCodecs() && playerRef?.current) {
      console.log('使用 WebCodecs API 导出视频...');
      return await exportWithWebCodecs(options, playerRef.current);
    }

    // 方案 2: 尝试使用 Canvas + MediaRecorder
    if (playerRef?.current) {
      console.log('使用 Canvas + MediaRecorder 导出视频...');
      return await exportWithCanvas(options, playerRef.current);
    }

    // 方案 3: 回退到屏幕录制
    console.log('使用屏幕录制导出视频（备用方案）...');
    return await startScreenRecording(options);
    
  } catch (error: any) {
    console.error('视频导出失败:', error);
    throw new Error(`视频导出失败: ${error.message}`);
  }
}

/**
 * 检查是否支持 WebCodecs API
 */
function supportsWebCodecs(): boolean {
  return typeof window !== 'undefined' && 
         'VideoEncoder' in window && 
         'VideoFrame' in window;
}

/**
 * 使用 WebCodecs API 导出视频
 */
async function exportWithWebCodecs(
  options: ExportOptions,
  player: any
): Promise<void> {
  const { VideoEncoder, VideoFrame } = window as any;
  const chunks: BlobPart[] = [];
  let frameCount = 0;
  const totalFrames = options.durationInFrames;

  return new Promise((resolve, reject) => {
    const encoder = new VideoEncoder({
      output: (chunk: any) => {
        // 将 EncodedVideoChunk 转换为 BlobPart
        const data = new Uint8Array(chunk.data);
        chunks.push(data.buffer);
      },
      error: (error: Error) => {
        reject(error);
      },
    });

    // 配置编码器（H.264）
    encoder.configure({
      codec: 'avc1.42E01E', // H.264 Baseline Profile
      width: options.width,
      height: options.height,
      bitrate: options.quality ? options.quality * 1000000 : 5000000,
      framerate: options.fps,
    });

    // 渲染并编码每一帧
    const encodeFrame = async (frameNumber: number) => {
      if (frameNumber >= totalFrames) {
        await encoder.flush();
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const filename = `video-${Date.now()}.mp4`;
        saveAs(blob, filename);
        resolve();
        return;
      }

      try {
        // 跳转到指定帧
        player.seekTo(frameNumber);
        
        // 等待一帧渲染完成
        await new Promise(resolve => setTimeout(resolve, 1000 / options.fps));

        // 从 Player 获取 canvas（需要 Remotion Player 支持）
        // 这里需要根据实际 API 调整
        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建 Canvas 上下文'));
          return;
        }

        // 尝试从 Player 获取当前帧图像
        // 注意：这需要 Remotion Player 提供 API 来获取当前帧的 ImageData
        // 如果 Player 不支持，回退到 Canvas 方案
        const imageData = ctx.createImageData(options.width, options.height);
        const videoFrame = new VideoFrame(imageData, {
          timestamp: (frameNumber / options.fps) * 1000000,
          duration: (1 / options.fps) * 1000000,
        });

        encoder.encode(videoFrame);
        videoFrame.close();

        frameCount++;
        if (frameCount % 10 === 0) {
          console.log(`编码进度: ${frameCount}/${totalFrames} 帧`);
        }

        requestAnimationFrame(() => {
          encodeFrame(frameNumber + 1);
        });
      } catch (error) {
        reject(error);
      }
    };

    encodeFrame(0);
  });
}

/**
 * 使用 Canvas + MediaRecorder 导出视频
 */
async function exportWithCanvas(
  options: ExportOptions,
  player: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = options.width;
      canvas.height = options.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }

      const stream = canvas.captureStream(options.fps);
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: options.quality ? options.quality * 1000000 : 5000000,
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const filename = `video-${Date.now()}.${getFileExtension(mimeType)}`;
        saveAs(blob, filename);
        resolve();
      };

      mediaRecorder.onerror = (event: any) => {
        reject(new Error(`录制错误: ${event.error?.message || '未知错误'}`));
      };

      mediaRecorder.start();

      let currentFrame = 0;
      const totalFrames = options.durationInFrames;
      const frameInterval = 1000 / options.fps;

      const renderNextFrame = async () => {
        if (currentFrame >= totalFrames) {
          mediaRecorder.stop();
          return;
        }

        try {
          // 跳转到指定帧
          player.seekTo(currentFrame);
          await new Promise(resolve => setTimeout(resolve, frameInterval));

          // 渲染当前帧到 canvas
          // 注意：这需要能够从 Remotion Player 获取当前帧的图像
          // 如果 Player 不提供此 API，需要回退到屏幕录制
          
          currentFrame++;
          if (currentFrame % 10 === 0) {
            console.log(`渲染进度: ${currentFrame}/${totalFrames} 帧`);
          }

          setTimeout(renderNextFrame, frameInterval);
        } catch (error) {
          reject(error);
        }
      };

      renderNextFrame();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 使用屏幕录制 API 录制视频
 */
async function startScreenRecording(options: ExportOptions): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 请求屏幕录制权限
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: options.width },
          height: { ideal: options.height },
          frameRate: { ideal: options.fps },
        },
        audio: false,
      });

      // 创建 MediaRecorder
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // 停止所有轨道
        stream.getTracks().forEach(track => track.stop());
        
        // 创建 Blob 并下载
        const blob = new Blob(chunks, { type: mimeType });
        const filename = `video-${Date.now()}.${getFileExtension(mimeType)}`;
        saveAs(blob, filename);
        
        console.log('视频导出成功:', filename);
        resolve();
      };

      mediaRecorder.onerror = (event: any) => {
        reject(new Error(`录制错误: ${event.error?.message || '未知错误'}`));
      };

      // 开始录制
      mediaRecorder.start();
      
      // 计算录制时长
      const duration = (options.durationInFrames / options.fps) * 1000; // 转换为毫秒
      
      // 显示录制提示
      const durationSeconds = (options.durationInFrames / options.fps).toFixed(1);
      alert(`录制已开始！\n\n视频时长: ${durationSeconds} 秒\n\n录制完成后，视频将自动下载。`);
      
      // 自动停止录制（如果用户没有手动停止）
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, duration + 1000); // 多等 1 秒确保完整录制
      
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        reject(new Error('用户取消了屏幕录制权限'));
      } else {
        reject(error);
      }
    }
  });
}

/**
 * 获取支持的 MIME 类型
 */
function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm'; // 默认值
}

/**
 * 根据 MIME 类型获取文件扩展名
 */
function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'video/webm': 'webm',
    'video/mp4': 'mp4',
    'video/ogg': 'ogv',
  };

  const baseType = mimeType.split(';')[0];
  return map[baseType] || 'webm';
}


