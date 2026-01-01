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

    // 深入分析和解决 shader 创建问题
    // 1. 首先诊断 WebGL 问题
    const webglDiagnosis = diagnoseWebGLIssue();
    console.log('🔍 WebGL 诊断结果:', webglDiagnosis);
    
    // 2. 根据诊断结果选择最佳渲染策略
    let renderStrategy: 'prefer-software' | 'prefer-hardware' | 'no-preference' = 'prefer-software';
    
    if (webglDiagnosis.canCreateShader) {
      // 如果 WebGL 和 shader 都正常，可以尝试硬件加速
      console.log('✅ WebGL 和 shader 正常，尝试硬件加速...');
      renderStrategy = 'prefer-hardware';
    } else if (webglDiagnosis.hasWebGLContext) {
      // 如果有 WebGL 上下文但 shader 创建失败，尝试无偏好模式
      console.log('⚠️ WebGL 上下文存在但 shader 创建失败，尝试无偏好模式...');
      renderStrategy = 'no-preference';
    } else {
      // 如果 WebGL 完全不可用，使用软件渲染
      console.log('⚠️ WebGL 不可用，使用软件渲染...');
      renderStrategy = 'prefer-software';
    }

    // 3. 尝试渲染，如果失败则深入分析错误
    try {
      return await renderWithRemotion(options, renderStrategy);
    } catch (renderError: any) {
      console.error('❌ 渲染失败，深入分析错误...', renderError);
      
      // 分析错误类型
      const errorAnalysis = analyzeRenderError(renderError, webglDiagnosis);
      console.log('🔍 错误分析:', errorAnalysis);
      
      // 根据错误分析尝试修复
      if (errorAnalysis.canRetry) {
        console.log(`🔄 尝试修复方案: ${errorAnalysis.retryStrategy}`);
        try {
          return await renderWithRemotion(options, errorAnalysis.retryStrategy as any);
        } catch (retryError: any) {
          console.error('❌ 修复方案也失败:', retryError);
          // 继续到下一个方案
        }
      }
      
      // 如果所有方案都失败，提供详细的错误信息
      const detailedError = buildDetailedError(renderError, webglDiagnosis, errorAnalysis);
      console.error('❌ 所有渲染方案都失败:', detailedError);
      
      // 检查是否是 WebGL 完全不可用的情况
      if (!webglDiagnosis.hasWebGLContext && !webglDiagnosis.canCreateShader) {
        const errorMessage = `
❌ Remotion web-renderer 无法工作：WebGL 完全不可用

原因分析：
${webglDiagnosis.webglError ? `- ${webglDiagnosis.webglError}` : ''}
${webglDiagnosis.shaderError ? `- ${webglDiagnosis.shaderError}` : ''}

Remotion web-renderer 的核心依赖：
- 需要 WebGL 来处理 3D 变换和某些渲染效果
- 即使选择"软件渲染"，仍然需要 WebGL 来创建辅助 canvas
- 如果 WebGL 完全不可用，Remotion web-renderer 无法工作

解决方案：
1. ✅ 使用屏幕录制方案（推荐）
   - 点击"导出视频"后，选择"使用屏幕录制"
   - 这是目前唯一可行的客户端方案

2. 🔧 尝试修复 WebGL：
   - 更新浏览器到最新版本
   - 更新 GPU 驱动程序
   - 检查浏览器是否禁用了硬件加速
   - 尝试使用其他浏览器（Chrome/Edge 推荐）
   - 重启浏览器

3. 💻 使用服务器端渲染（需要后端支持）
   - 使用 @remotion/renderer 在服务器端渲染
   - 需要 Node.js 环境

系统将自动使用屏幕录制方案...
        `.trim();
        
        console.error(errorMessage);
        
        // 自动切换到屏幕录制
        console.log('🔄 自动切换到屏幕录制方案...');
        try {
          return await startScreenRecording(options);
        } catch (screenError: any) {
          if (screenError.message?.includes('SCREEN_RECORDING_REQUIRES_USER_GESTURE')) {
            throw new Error(
              errorMessage + '\n\n' +
              '屏幕录制需要在用户点击事件中调用。请再次点击"导出视频"按钮，然后选择"使用屏幕录制"选项。'
            );
          }
          throw screenError;
        }
      }
      
      // 其他错误，也尝试屏幕录制
      console.log('🔄 自动切换到屏幕录制方案...');
      return await startScreenRecording(options);
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
    
    // 如果是 shader/WebGL 错误，自动回退到屏幕录制
    if (error.message?.includes('shader') || 
        error.message?.includes('Shader') || 
        error.message?.includes('WebGL') ||
        error.message?.includes('context lost')) {
      console.warn('⚠️ WebGL 相关错误，自动回退到屏幕录制方案...');
      try {
        return await startScreenRecording(options);
      } catch (screenError: any) {
        // 如果屏幕录制也需要用户手势，抛出特殊错误
        if (screenError.message?.includes('SCREEN_RECORDING_REQUIRES_USER_GESTURE')) {
          throw screenError;
        }
        throw screenError;
      }
    }
    
    // 如果错误信息包含用户手势要求，直接抛出
    if (error.message?.includes('SCREEN_RECORDING_REQUIRES_USER_GESTURE')) {
      throw error;
    }
    
    throw new Error(`视频导出失败: ${error.message || '未知错误'}`);
  }
}

/**
 * 深入诊断 WebGL 和 shader 问题
 * 分析 Remotion 为什么需要 WebGL 以及如何解决
 */
function diagnoseWebGLIssue(): {
  hasOffscreenCanvas: boolean;
  hasWebGLContext: boolean;
  canCreateShader: boolean;
  shaderError?: string;
  webglError?: string;
  details: any;
} {
  const diagnosis = {
    hasOffscreenCanvas: false,
    hasWebGLContext: false,
    canCreateShader: false,
    shaderError: undefined as string | undefined,
    webglError: undefined as string | undefined,
    details: {} as any,
  };

  try {
    // 1. 检查 OffscreenCanvas 支持（Remotion 使用它）
    if (typeof OffscreenCanvas !== 'undefined') {
      diagnosis.hasOffscreenCanvas = true;
      
      try {
        // 尝试创建 OffscreenCanvas 和 WebGL 上下文（模拟 Remotion 的行为）
        const offscreenCanvas = new OffscreenCanvas(100, 100);
        const gl = offscreenCanvas.getContext('webgl', {
          premultipliedAlpha: true,
        }) as WebGLRenderingContext | null;
        
        if (gl) {
          diagnosis.hasWebGLContext = true;
          diagnosis.details.offscreenWebGL = true;
          
          // 测试 shader 创建（这是 Remotion 失败的地方）
          const vertexShader = gl.createShader(gl.VERTEX_SHADER);
          const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          
          if (vertexShader && fragmentShader) {
            diagnosis.canCreateShader = true;
            
            // 测试 shader 编译（使用 Remotion 的 shader 源码）
            const vsSource = `
              attribute vec2 aPosition;
              attribute vec2 aTexCoord;
              uniform mat4 uTransform;
              uniform mat4 uProjection;
              varying vec2 vTexCoord;
              void main() {
                gl_Position = uProjection * uTransform * vec4(aPosition, 0.0, 1.0);
                vTexCoord = aTexCoord;
              }
            `;
            
            const fsSource = `
              precision mediump float;
              uniform sampler2D uTexture;
              varying vec2 vTexCoord;
              void main() {
                gl_FragColor = texture2D(uTexture, vTexCoord);
              }
            `;
            
            try {
              gl.shaderSource(vertexShader, vsSource);
              gl.compileShader(vertexShader);
              if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                diagnosis.shaderError = gl.getShaderInfoLog(vertexShader) || 'Vertex shader compile failed';
                diagnosis.canCreateShader = false;
              }
              
              gl.shaderSource(fragmentShader, fsSource);
              gl.compileShader(fragmentShader);
              if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                diagnosis.shaderError = gl.getShaderInfoLog(fragmentShader) || 'Fragment shader compile failed';
                diagnosis.canCreateShader = false;
              }
            } catch (compileError: any) {
              diagnosis.shaderError = compileError.message;
              diagnosis.canCreateShader = false;
            }
            
            // 清理
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
          } else {
            diagnosis.shaderError = 'createShader returned null';
            diagnosis.canCreateShader = false;
          }
          
          // 检查上下文是否丢失
          if (gl.isContextLost()) {
            diagnosis.webglError = 'WebGL context lost';
            diagnosis.hasWebGLContext = false;
          }
        } else {
          diagnosis.webglError = 'Cannot create WebGL context from OffscreenCanvas';
        }
      } catch (offscreenError: any) {
        diagnosis.webglError = offscreenError.message;
      }
    } else {
      diagnosis.webglError = 'OffscreenCanvas not supported';
    }
    
    // 2. 检查普通 Canvas WebGL（作为后备）
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      
      if (gl) {
        diagnosis.details.regularCanvasWebGL = true;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as WEBGL_debug_renderer_info | null;
        if (debugInfo) {
          diagnosis.details.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          diagnosis.details.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (e) {
      // 忽略普通 canvas 错误
    }
    
  } catch (error: any) {
    diagnosis.webglError = error.message || 'Diagnosis failed';
  }
  
  return diagnosis;
}

/**
 * 分析渲染错误，提供修复建议
 */
function analyzeRenderError(
  error: any,
  diagnosis: ReturnType<typeof diagnoseWebGLIssue>
): {
  errorType: 'shader' | 'webgl' | 'offscreen' | 'other';
  canRetry: boolean;
  retryStrategy?: 'prefer-software' | 'prefer-hardware' | 'no-preference';
  fixSuggestion?: string;
} {
  const errorMessage = error.message || '';
  
  if (errorMessage.includes('shader') || errorMessage.includes('Shader')) {
    if (!diagnosis.hasOffscreenCanvas) {
      return {
        errorType: 'offscreen',
        canRetry: false,
        fixSuggestion: '浏览器不支持 OffscreenCanvas，这是 Remotion web-renderer 的必需功能。请更新浏览器或使用屏幕录制方案。',
      };
    }
    
    if (!diagnosis.canCreateShader) {
      return {
        errorType: 'shader',
        canRetry: true,
        retryStrategy: 'prefer-software',
        fixSuggestion: 'Shader 创建失败，可能是 GPU 驱动问题。尝试软件渲染或更新 GPU 驱动。',
      };
    }
    
    return {
      errorType: 'shader',
      canRetry: true,
      retryStrategy: 'no-preference',
      fixSuggestion: 'Shader 编译错误，尝试让浏览器自动选择渲染模式。',
    };
  }
  
  if (errorMessage.includes('WebGL') || errorMessage.includes('webgl')) {
    return {
      errorType: 'webgl',
      canRetry: true,
      retryStrategy: 'prefer-software',
      fixSuggestion: 'WebGL 问题，尝试软件渲染。',
    };
  }
  
  return {
    errorType: 'other',
    canRetry: false,
    fixSuggestion: '未知错误，请查看详细错误信息。',
  };
}

/**
 * 构建详细的错误信息
 */
function buildDetailedError(
  error: any,
  diagnosis: ReturnType<typeof diagnoseWebGLIssue>,
  analysis: ReturnType<typeof analyzeRenderError>
): string {
  return `
视频导出失败：${error.message}

诊断信息：
- OffscreenCanvas 支持: ${diagnosis.hasOffscreenCanvas ? '✅' : '❌'}
- WebGL 上下文: ${diagnosis.hasWebGLContext ? '✅' : '❌'}
- Shader 创建: ${diagnosis.canCreateShader ? '✅' : '❌'}
${diagnosis.shaderError ? `- Shader 错误: ${diagnosis.shaderError}` : ''}
${diagnosis.webglError ? `- WebGL 错误: ${diagnosis.webglError}` : ''}
${diagnosis.details.vendor ? `- GPU 厂商: ${diagnosis.details.vendor}` : ''}
${diagnosis.details.renderer ? `- GPU 型号: ${diagnosis.details.renderer}` : ''}

错误类型: ${analysis.errorType}
${analysis.fixSuggestion ? `建议: ${analysis.fixSuggestion}` : ''}

Remotion web-renderer 需要 WebGL 来处理 3D 变换和某些渲染效果。
如果 WebGL 不可用，系统会自动使用屏幕录制方案。
  `.trim();
}

// WebGL 扩展类型定义
interface WEBGL_debug_renderer_info {
  UNMASKED_VENDOR_WEBGL: number;
  UNMASKED_RENDERER_WEBGL: number;
}

/**
 * 恢复 WebGL 上下文
 * 如果上下文丢失，等待恢复事件
 */
async function restoreWebGLContext(timeout: number = 5000): Promise<{ restored: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      // 尝试创建新的 WebGL 上下文来触发恢复
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl', {
        preserveDrawingBuffer: true,
        antialias: false,
        depth: false,
        stencil: false,
        failIfMajorPerformanceCaveat: false,
      }) as WebGLRenderingContext | null;

      if (!gl) {
        resolve({ restored: false, error: '无法创建 WebGL 上下文' });
        return;
      }

      // 如果上下文已丢失，等待恢复
      if (gl.isContextLost()) {
        console.log('⏳ WebGL 上下文已丢失，等待恢复...');
        
        const timeoutId = setTimeout(() => {
          resolve({ restored: false, error: 'WebGL 上下文恢复超时' });
        }, timeout);

        const onContextRestored = () => {
          clearTimeout(timeoutId);
          canvas.removeEventListener('webglcontextrestored', onContextRestored);
          console.log('✅ WebGL 上下文已恢复');
          resolve({ restored: true });
        };

        canvas.addEventListener('webglcontextrestored', onContextRestored);
      } else {
        // 上下文正常，测试 shader 创建
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
          if (vertexShader) gl.deleteShader(vertexShader);
          if (fragmentShader) gl.deleteShader(fragmentShader);
          resolve({ restored: false, error: '无法创建 WebGL shader' });
          return;
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        resolve({ restored: true });
      }
    } catch (error: any) {
      resolve({ restored: false, error: error.message || 'WebGL 恢复失败' });
    }
  });
}

/**
 * 修复 WebGL 上下文问题
 * 如果 WebGL 上下文丢失或创建失败，尝试修复
 */
async function fixWebGLContext(): Promise<{ fixed: boolean; error?: string }> {
  try {
    // 1. 首先尝试恢复丢失的上下文
    const restoreResult = await restoreWebGLContext(3000);
    if (restoreResult.restored) {
      return { fixed: true };
    }

    // 2. 如果恢复失败，尝试创建新的上下文
    const canvas = document.createElement('canvas');
    
    // 尝试多种 WebGL 上下文配置
    const contextConfigs = [
      {
        preserveDrawingBuffer: true,
        antialias: false,
        depth: false,
        stencil: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'default' as WebGLPowerPreference,
      },
      {
        preserveDrawingBuffer: true,
        antialias: false,
        depth: false,
        stencil: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'low-power' as WebGLPowerPreference,
      },
      {
        preserveDrawingBuffer: false,
        antialias: false,
        depth: false,
        stencil: false,
        failIfMajorPerformanceCaveat: false,
      },
    ];

    for (const config of contextConfigs) {
      try {
        const gl = (canvas.getContext('webgl', config) || 
                   canvas.getContext('experimental-webgl', config)) as WebGLRenderingContext | null;

        if (gl && gl instanceof WebGLRenderingContext && !gl.isContextLost()) {
          // 测试 shader 创建
          const vertexShader = gl.createShader(gl.VERTEX_SHADER);
          const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

          if (vertexShader && fragmentShader) {
            // 清理测试资源
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            return { fixed: true };
          }
        }
      } catch (e) {
        // 继续尝试下一个配置
        continue;
      }
    }

    return {
      fixed: false,
      error: restoreResult.error || '无法创建可用的 WebGL 上下文',
    };
  } catch (error: any) {
    return {
      fixed: false,
      error: error.message || 'WebGL 修复失败',
    };
  }
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
  // 在渲染前修复 WebGL 上下文问题（异步）
  console.log('🔧 检查并修复 WebGL 上下文...');
  const webglFix = await fixWebGLContext();
  if (!webglFix.fixed) {
    console.warn('⚠️ WebGL 上下文问题:', webglFix.error);
    // 等待一段时间，让系统恢复
    console.log('⏳ 等待 1 秒后重试...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 再次尝试修复
    const retryFix = await fixWebGLContext();
    if (!retryFix.fixed) {
      console.error('❌ WebGL 上下文无法修复:', retryFix.error);
      throw new Error(`WebGL 上下文问题: ${retryFix.error}。Remotion web-renderer 需要 WebGL 支持。请尝试：1) 更新浏览器 2) 更新 GPU 驱动 3) 使用屏幕录制方案`);
    }
  } else {
    console.log('✅ WebGL 上下文正常');
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
    // 添加 licenseKey（使用免费许可证）
    licenseKey: 'free-license',
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


