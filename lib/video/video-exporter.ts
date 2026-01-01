/**
 * 视频导出功能
 * 由于浏览器限制，使用屏幕录制或 Canvas 录制方案
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
 * 导出视频（使用屏幕录制 API）
 * 这是浏览器环境下的最佳方案
 */
export async function exportVideo(options: ExportOptions): Promise<void> {
  try {
    console.log('开始导出视频...', options);
    
    // 检查浏览器是否支持屏幕录制
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('您的浏览器不支持屏幕录制功能。请使用 Chrome、Edge 或 Firefox 最新版本。');
    }

    // 提示用户开始屏幕录制
    const userConfirmed = confirm(
      '视频导出将使用屏幕录制功能。\n\n' +
      '1. 点击"确定"后，浏览器会提示您选择要录制的窗口\n' +
      '2. 请选择包含视频预览的窗口\n' +
      '3. 录制将自动开始，完成后会自动下载\n\n' +
      '提示：建议全屏显示视频预览以获得最佳效果。'
    );

    if (!userConfirmed) {
      return;
    }

    // 开始屏幕录制
    await startScreenRecording(options);
    
  } catch (error: any) {
    console.error('视频导出失败:', error);
    throw new Error(`视频导出失败: ${error.message}`);
  }
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

/**
 * 导出视频（使用 Canvas 录制 - 备用方案）
 * 注意：这个方案需要能够访问 Remotion Player 的内部渲染
 */
export async function exportVideoWithCanvas(options: ExportOptions): Promise<void> {
  // 这个方案需要能够访问 Player 的内部 canvas
  // 由于 Remotion Player 不直接暴露 canvas，这个方案较难实现
  throw new Error('Canvas 录制方案暂未实现。请使用屏幕录制功能。');
}

