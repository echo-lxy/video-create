/**
 * 视频导出功能
 * 使用 Remotion 官方客户端渲染 API (@remotion/web-renderer)
 * 在浏览器中直接渲染高质量视频，使用 WebCodecs 和 Mediabunny
 * 
 * 参考文档：https://www.remotion.dev/docs/client-side-rendering/
 */

import { saveAs } from 'file-saver';
import { renderMediaOnWeb } from '@remotion/web-renderer';

export interface ExportOptions {
  component: React.ComponentType;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  outputPath?: string;
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1';
  quality?: 'very-low' | 'low' | 'medium' | 'high' | 'very-high' | number;
  onProgress?: (progress: { renderedFrames: number; encodedFrames: number }) => void;
  forceScreenRecording?: boolean; // 强制使用屏幕录制（跳过 Remotion 渲染）
}

/**
 * 导出视频（使用 Remotion 官方客户端渲染 API）
 * 
 * 这是 Remotion 官方提供的浏览器端视频渲染方案：
 * - 使用 WebCodecs API 进行编码
 * - 使用 Mediabunny 进行视频处理
 * - 完全在浏览器中运行，无需服务器
 * - 高质量视频输出
 */
export async function exportVideo(
  options: ExportOptions,
  playerRef?: React.RefObject<any>
): Promise<void> {
  try {
    // 如果强制使用屏幕录制，直接调用
    if (options.forceScreenRecording) {
      console.log('使用屏幕录制导出视频（强制模式）...');
      return await startScreenRecording(options);
    }

    console.log('开始导出视频（使用 Remotion 客户端渲染）...', {
      durationInFrames: options.durationInFrames,
      fps: options.fps,
      width: options.width,
      height: options.height,
    });

    // 尝试使用 Remotion 官方客户端渲染 API
    // 主动解决 WebGL shader 问题，而不是直接回退
    try {
      return await renderWithRemotion(options, 'prefer-hardware');
    } catch (hardwareError: any) {
      // 如果是 shader 相关错误，尝试多种解决方案
      if (hardwareError.message?.includes('shader') || 
          hardwareError.message?.includes('Shader') ||
          hardwareError.message?.includes('WebGL') ||
          hardwareError.message?.includes('Could not create')) {
        console.warn('⚠️ 检测到 WebGL shader 错误，尝试解决...', hardwareError.message);
        
        // 解决方案 1: 尝试软件渲染
        console.log('🔧 解决方案 1: 尝试软件渲染模式...');
        try {
          return await renderWithRemotion(options, 'prefer-software');
        } catch (softwareError: any) {
          console.warn('⚠️ 软件渲染失败，尝试无偏好模式...', softwareError.message);
          
          // 解决方案 2: 尝试无偏好模式（让浏览器自动选择）
          try {
            return await renderWithRemotion(options, 'no-preference');
          } catch (noPreferenceError: any) {
            console.error('❌ 所有渲染模式都失败:', {
              hardware: hardwareError.message,
              software: softwareError.message,
              noPreference: noPreferenceError.message,
            });
            
            // 提供详细的错误信息和解决建议
            const webglCheck = checkWebGLSupport();
            const errorMessage = 
              `视频导出失败：WebGL shader 创建错误\n\n` +
              `错误详情：\n` +
              `- 硬件加速: ${hardwareError.message}\n` +
              `- 软件渲染: ${softwareError.message}\n` +
              `- 无偏好模式: ${noPreferenceError.message}\n\n` +
              `WebGL 诊断：\n` +
              `- 支持状态: ${webglCheck.supported ? '✅ 支持' : '❌ 不支持'}\n` +
              (webglCheck.error ? `- 错误: ${webglCheck.error}\n` : '') +
              (webglCheck.details.vendor ? `- GPU 厂商: ${webglCheck.details.vendor}\n` : '') +
              (webglCheck.details.renderer ? `- GPU 型号: ${webglCheck.details.renderer}\n` : '') +
              `\n建议：\n` +
              `1. 更新浏览器到最新版本\n` +
              `2. 更新 GPU 驱动程序\n` +
              `3. 检查浏览器是否禁用了硬件加速\n` +
              `4. 尝试使用其他浏览器（Chrome/Edge 推荐）\n` +
              `5. 如果问题持续，可以使用屏幕录制方案`;
            
            throw new Error(errorMessage);
          }
        }
      }
      // 其他错误，直接抛出
      throw hardwareError;
    }
  } catch (error: any) {
    console.error('❌ 视频导出失败:', error);
    
    // 如果 Remotion 客户端渲染失败，回退到屏幕录制
    if (error.message?.includes('not supported') || 
        error.message?.includes('WebCodecs') ||
        error.message?.includes('experimental')) {
      console.warn('⚠️ Remotion 客户端渲染不可用，回退到屏幕录制方案...');
      return await startScreenRecording(options);
    }
    
    // 如果是 shader 错误，已经在上面的 try-catch 中尝试了所有解决方案
    // 这里不再回退，而是抛出详细错误信息，让用户了解问题
    if (error.message?.includes('shader') || error.message?.includes('Shader') || error.message?.includes('WebGL')) {
      // 错误信息已经包含详细的诊断信息和建议
      throw error;
    }
    
    // 如果错误信息包含用户手势要求，直接抛出
    if (error.message?.includes('SCREEN_RECORDING_REQUIRES_USER_GESTURE')) {
      throw error;
    }
    
    throw new Error(`视频导出失败: ${error.message || '未知错误'}`);
  }
}

/**
 * 检查 WebGL 支持并诊断问题
 */
function checkWebGLSupport(): { supported: boolean; error?: string; details: any } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    if (!gl) {
      return {
        supported: false,
        error: 'WebGL 不支持或已被禁用',
        details: {
          hasWebGL: false,
          hasExperimentalWebGL: false,
        },
      };
    }

    // 类型断言为 WebGLRenderingContext
    const webglContext = gl as WebGLRenderingContext;
    const debugInfo = webglContext.getExtension('WEBGL_debug_renderer_info') as WEBGL_debug_renderer_info | null;
    const vendor = debugInfo ? webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string : 'Unknown';
    const renderer = debugInfo ? webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string : 'Unknown';
    
    // 检查 shader 支持
    const vertexShader = webglContext.createShader(webglContext.VERTEX_SHADER);
    const fragmentShader = webglContext.createShader(webglContext.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) {
      return {
        supported: false,
        error: '无法创建 WebGL shader',
        details: { vendor, renderer },
      };
    }

    // 清理
    webglContext.deleteShader(vertexShader);
    webglContext.deleteShader(fragmentShader);

    return {
      supported: true,
      details: { vendor, renderer },
    };
  } catch (error: any) {
    return {
      supported: false,
      error: error.message || 'WebGL 检查失败',
      details: {},
    };
  }
}

// WebGL 扩展类型定义
interface WEBGL_debug_renderer_info {
  UNMASKED_VENDOR_WEBGL: number;
  UNMASKED_RENDERER_WEBGL: number;
}

/**
 * 使用 Remotion 客户端渲染 API 渲染视频
 * @param options 导出选项
 * @param hardwareAcceleration 硬件加速选项
 */
async function renderWithRemotion(
  options: ExportOptions,
  hardwareAcceleration: 'prefer-hardware' | 'prefer-software' | 'no-preference'
): Promise<void> {
  // 在渲染前检查 WebGL 支持（仅在硬件加速时）
  if (hardwareAcceleration === 'prefer-hardware') {
    const webglCheck = checkWebGLSupport();
    if (!webglCheck.supported) {
      console.warn('⚠️ WebGL 检查失败:', webglCheck.error, webglCheck.details);
      // 如果 WebGL 不支持，自动切换到软件渲染
      console.log('🔄 自动切换到软件渲染模式...');
      return await renderWithRemotion(options, 'prefer-software');
    } else {
      console.log('✅ WebGL 支持正常:', webglCheck.details);
    }
  }

  // 使用 Remotion 官方客户端渲染 API
  // 参考文档：https://www.remotion.dev/docs/client-side-rendering/
  const { getBlob } = await renderMediaOnWeb({
    composition: {
      component: options.component,
      durationInFrames: options.durationInFrames,
      fps: options.fps,
      width: options.width,
      height: options.height,
      calculateMetadata: null,
      id: 'my-video-composition',
    },
    inputProps: {},
    // 视频编码器：h264（最佳兼容性）、h265（更小文件）、vp8/vp9/av1（WebM）
    videoCodec: options.codec || 'h264',
    // 视频质量：'very-low' | 'low' | 'medium' | 'high' | 'very-high' | number (bitrate in bps)
    videoBitrate: options.quality || 'high',
    // 容器格式：mp4（H.264/H.265）或 webm（VP8/VP9/AV1）
    container: (options.codec === 'vp8' || options.codec === 'vp9' || options.codec === 'av1') ? 'webm' : 'mp4',
    // 禁用音频（我们的视频没有音频轨道）
    muted: true,
    // 进度回调
    onProgress: options.onProgress || null,
    // 硬件加速选项：根据错误自动调整
    hardwareAcceleration: hardwareAcceleration,
  });

  // 获取视频 Blob
  const blob = await getBlob();
  
  // 生成文件名
  const timestamp = Date.now();
  const filename = options.outputPath || `video-${timestamp}.mp4`;
  
  // 下载视频
  saveAs(blob, filename);
  
  console.log('✅ 视频导出成功:', filename, {
    size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    type: blob.type,
    hardwareAcceleration,
  });
}

/**
 * 使用屏幕录制 API 录制视频
 * 注意：getDisplayMedia 必须在用户手势事件中调用
 */
async function startScreenRecording(options: ExportOptions): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 检查是否在用户手势上下文中
      // 如果不在，提示用户需要再次点击
      // 注意：这是一个启发式检查，不能完全保证，但可以捕获大多数情况
      
      // 请求屏幕录制权限
      // 必须在用户手势事件中调用，否则会抛出错误
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: options.width },
            height: { ideal: options.height },
            frameRate: { ideal: options.fps },
          },
          audio: false,
        });
      } catch (gestureError: any) {
        // 如果是因为不在用户手势上下文中，抛出特殊错误
        if (gestureError.message?.includes('user gesture') || 
            gestureError.message?.includes('getDisplayMedia must be called')) {
          throw new Error(
            'SCREEN_RECORDING_REQUIRES_USER_GESTURE: ' +
            '屏幕录制需要在用户点击事件中调用。请再次点击"导出视频"按钮，然后选择"使用屏幕录制"选项。'
          );
        }
        throw gestureError;
      }

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


