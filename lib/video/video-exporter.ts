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
      try {
        console.log('尝试使用 WebCodecs API 导出视频...');
        return await exportWithWebCodecs(options, playerRef.current);
      } catch (error: any) {
        console.warn('WebCodecs API 方案失败，回退到屏幕录制:', error.message);
        // 继续尝试其他方案
      }
    }

    // 方案 2: 尝试使用 Canvas + MediaRecorder
    if (playerRef?.current) {
      try {
        console.log('尝试使用 Canvas + MediaRecorder 导出视频...');
        return await exportWithCanvas(options, playerRef.current);
      } catch (error: any) {
        console.warn('Canvas 方案失败，回退到屏幕录制:', error.message);
        // 继续尝试其他方案
      }
    }

    // 方案 3: 回退到屏幕录制（当前唯一可用的方案）
    console.log('使用屏幕录制导出视频（当前可用方案）...');
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
 * 注意：当前实现需要从 Remotion Player 获取帧图像
 * 如果无法获取，会自动回退到屏幕录制方案
 */
async function exportWithWebCodecs(
  options: ExportOptions,
  player: any
): Promise<void> {
  // WebCodecs API 需要从实际的图像源创建 VideoFrame
  // 由于 Remotion Player 不直接暴露 canvas，当前无法直接使用 WebCodecs
  // 抛出错误，让调用者回退到其他方案
  throw new Error('WebCodecs API 需要从 Remotion Player 获取帧图像，当前暂不支持。请使用屏幕录制方案。');
}

/**
 * 使用 Canvas + MediaRecorder 导出视频
 * 注意：当前实现需要从 Remotion Player 获取帧图像
 * 如果无法获取，会自动回退到屏幕录制方案
 */
async function exportWithCanvas(
  options: ExportOptions,
  player: any
): Promise<void> {
  // Canvas 方案需要能够从 Remotion Player 获取每一帧的图像
  // 由于 Remotion Player 不直接暴露 canvas，当前无法直接使用此方案
  // 抛出错误，让调用者回退到屏幕录制
  throw new Error('Canvas 方案需要从 Remotion Player 获取帧图像，当前暂不支持。请使用屏幕录制方案。');
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


