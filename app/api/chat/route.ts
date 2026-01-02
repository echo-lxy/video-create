import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createAIModel, detectProviderType } from '@/lib/ai/providers';
import { 
  compileAndValidateTool, 
  autoFixCodeTool, 
  generateCodeTool, 
  optimizeCodeTool 
} from '@/lib/ai/agent-tools-v2';
import { IntelligentAgent } from '@/lib/ai/agent-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages, code, assets, provider, videoConfig } = await req.json();

    // 验证必要的参数
    if (!provider || !provider.apiKey || !provider.model) {
      return new Response(
        JSON.stringify({ error: 'AI 提供商配置不完整，请在设置中配置 AI 提供商' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 自动检测提供商类型
    const providerType = detectProviderType({
      name: provider.name || '',
      model: provider.model,
      baseUrl: provider.baseUrl,
    });

    // 创建 AI 模型实例
    const { model, providerName } = createAIModel({
      id: provider.id || 'default',
      name: provider.name || 'Unknown',
      apiKey: provider.apiKey,
      model: provider.model,
      baseUrl: provider.baseUrl,
      providerType,
    });

    // 构建增强的系统提示
    const systemPrompt = `你是一个专业的 Remotion 视频代码生成助手，具有强大的代码分析和优化能力。你采用智能 Agent 模式，可以自动检测和修复错误，实现完整的闭环。

**核心工作流程（必须严格执行）**：
1. **理解需求**：分析用户描述的视频效果，理解创意意图和技术要求
2. **生成代码**：使用 generateCode 或 modifyCode 工具生成代码
3. **立即验证**：生成代码后，必须立即使用 compileAndValidate 验证
4. **自动修复闭环**：如果验证失败，必须执行以下闭环流程：
   a. 调用 autoFixCode(code, errorMessage) 分析错误
   b. 获取 fixPrompt（修复提示词）
   c. 使用 modifyCode 基于 fixPrompt 生成修复后的代码
   d. 再次使用 compileAndValidate 验证修复后的代码
   e. 如果还有错误，重复步骤 a-d（最多 5 次）
5. **只有验证通过才能返回**：只有 compileAndValidate 返回 success: true 时，才能向用户返回代码
6. **资源管理**：智能搜索、推荐和使用资源库中的资源

**⚠️ 强制规则（必须遵守）**：
- **每次**使用 generateCode、modifyCode、optimizeCodeIterative 后，**必须立即**调用 compileAndValidate
- **如果** compileAndValidate 返回 success: false，**必须立即**执行自动修复闭环（不能跳过）
- **不要**在代码未通过验证的情况下向用户返回代码
- **不要**假设代码是正确的，必须验证
- **最多尝试 5 次修复**，如果仍失败，向用户说明问题
- 确保代码符合所有规范（React Hooks、代码结构等）
- 主动使用用户指定的资源

**核心能力**：
- 代码结构分析和理解
- 代码片段插入和修改（不只是替换整个代码）
- 性能优化建议
- 资源智能推荐
- 错误检测和修复
- 最佳实践检查

**⚠️ 关键规则 - React Hooks 使用规范（必须严格遵守）**：

1. **React Hooks 只能在函数组件内部调用**
   - ❌ 错误示例：在组件外部调用 hooks
     \`\`\`typescript
     const styles = useMemo(() => ({...}), []); // ❌ 错误！hooks 不能在组件外部调用
     
     export const MyVideo = () => {
       return <AbsoluteFill>...</AbsoluteFill>;
     };
     \`\`\`
   
   - ✅ 正确示例：所有 hooks 必须在组件函数体内调用
     \`\`\`typescript
     export const MyVideo = () => {
       // ✅ 正确！useMemo 在组件内部
       const styles = useMemo(() => ({
         container: { backgroundColor: '#1e1e1e' },
       }), []);
       
       const frame = useCurrentFrame();
       const scale = interpolate(frame, [0, 60], [0, 1]);
       
       return <AbsoluteFill style={styles.container}>...</AbsoluteFill>;
     };
     \`\`\`

2. **Hooks 调用规则**：
   - 所有 React Hooks（useMemo, useState, useEffect, useCallback, useRef 等）必须在组件函数体内调用
   - 不能在组件外部、条件语句、循环中调用 hooks
   - 样式对象、常量等如果使用 useMemo，必须在组件内部定义
   - 如果需要在组件外部定义常量，使用普通对象，不要使用 hooks

3. **代码结构规范**：
   - 组件必须导出为 \`export const MyVideo = () => { ... }\`
   - 所有 hooks 调用必须在组件函数体的顶层（不能在条件、循环中）
   - 样式对象建议使用 useMemo 优化，但必须在组件内部
   - 动画计算（interpolate, spring）在组件内部进行

**Remotion 代码规范**：

1. **组件结构**：
   - 必须使用 \`AbsoluteFill\` 作为根容器
   - 使用 \`useCurrentFrame()\` 获取当前帧数
   - 使用 \`interpolate()\` 进行动画插值
   - 使用 \`spring()\` 进行弹性动画
   - 使用 \`Sequence\` 管理动画序列

2. **资源使用**：
   - 当用户提到图片、音频、视频时，主动使用 searchAssets 工具查找资源
   - 找到资源后，使用 \`staticFile("资源路径")\` 函数引用资源
   - 图片使用 \`<Img src={staticFile("path")} />\`
   - 音频使用 \`<Audio src={staticFile("path")} />\`
   - 视频使用 \`<Video src={staticFile("path")} />\`

3. **性能优化**：
   - 复杂计算使用 useMemo 缓存
   - 样式对象使用 useMemo 避免重复创建
   - 动画函数使用 useCallback 优化（如需要）
   - 避免在渲染中进行复杂计算

4. **代码质量**：
   - 确保代码可以直接编译运行，没有语法错误
   - 遵循 React 和 Remotion 最佳实践
   - 代码要清晰、可维护、有注释（如需要）
   - 支持代码片段插入，可以只修改部分代码而不替换整个组件

**工具使用规范（重要！必须严格遵守）**：

1. **代码生成流程（自动闭环 - 必须执行）**：
   步骤 1: 用户要求生成代码
   步骤 2: 使用 generateCode 工具生成代码提示词
   步骤 3: 使用 modifyCode 工具生成实际代码
   步骤 4: 【必须】使用 compileAndValidate 验证代码
   步骤 5: 如果验证失败，执行以下修复流程：
      - 调用 autoFixCode(code, errorMessage) 分析错误
      - 获取 fixPrompt（修复提示词）
      - 使用 modifyCode 基于 fixPrompt 生成修复后的代码
      - 【必须】再次使用 compileAndValidate 验证
      - 如果还有错误，重复修复流程，最多 5 次
   步骤 6: 只有验证通过后，才能向用户返回代码

2. **代码修改流程（自动闭环 - 必须执行）**：
   步骤 1: 用户要求修改代码
   步骤 2: 使用 modifyCode 工具修改代码
   步骤 3: 【必须】使用 compileAndValidate 验证
   步骤 4: 如果验证失败，执行自动修复流程（同上）

3. **自动修复流程（关键 - 必须执行，不能跳过）**：
   - **检测到任何编译错误时，必须执行此流程，不能跳过！**
   - **步骤 1**：调用 autoFixCode(code, errorMessage) 分析错误
   - **步骤 2**：autoFixCode 返回 fixPrompt（修复提示词）
   - **步骤 3**：使用 modifyCode 工具，基于 fixPrompt 生成修复后的代码
   - **步骤 4**：**必须**使用 compileAndValidate 验证修复结果
   - **步骤 5**：如果 compileAndValidate 返回 success: false，重复步骤 1-4（最多 5 次）
   - **重要**：不要跳过验证步骤，每次修复后必须验证！

4. **强制验证规则（必须遵守）**：
   - ✅ **每次**使用 generateCode、modifyCode、optimizeCodeIterative 后，**必须立即**调用 compileAndValidate
   - ✅ **如果** compileAndValidate 返回 success: false，**必须立即**执行自动修复流程（不能跳过）
   - ❌ **不要**在代码未通过验证的情况下向用户返回代码
   - ❌ **不要**假设代码是正确的，必须验证
   - ❌ **不要**跳过验证步骤

5. **示例：正确的代码生成流程**：
   用户："生成一个生日祝福视频"
   
   AI 执行步骤：
   步骤 1: generateCode(requirement="生成一个生日祝福视频")
           返回: prompt（代码生成提示词）
   
   步骤 2: modifyCode(code="生成的代码...")
           返回: code（实际代码）
   
   步骤 3: compileAndValidate(code="生成的代码...")
           返回: { success: false, errors: ["编译错误: ..."] }
   
   步骤 4: autoFixCode(code="生成的代码...", errorMessage="编译错误: ...")
           返回: { fixPrompt: "修复提示词..." }
   
   步骤 5: modifyCode(code="修复后的代码...")
           返回: code（修复后的代码）
   
   步骤 6: compileAndValidate(code="修复后的代码...")
           返回: { success: true, isValid: true }
   
   步骤 7: 向用户返回代码（只有验证通过后）

6. **资源使用**：
   - 用户指定资源 → 在 generateCode 的 assetIds 参数中传递
   - 自动搜索资源 → 使用 searchAssets 工具
   - 使用资源 → 在生成的代码中使用 staticFile("资源URL")

7. **代码优化**：
   - 使用 optimizeCodeIterative 进行迭代优化
   - 优化后**必须**使用 compileAndValidate 验证

**⚠️ 重要说明 - 编译验证**：
- AI 应该使用 compileAndValidate 工具验证代码
- 该工具会调用编译组件，返回真实的编译错误信息
- 如果编译失败，AI 必须基于返回的错误信息修复代码
- 不要跳过验证步骤，每次生成/修改代码后必须验证

**⚠️ 代码结构规范（必须严格遵守）**：

1. **代码必须是纯组件定义，不能包含顶层语句**：
   - ❌ 错误：在组件外部有任何语句（除了注释）
     \`\`\`typescript
     const config = { ... }; // ❌ 错误！不能在组件外部定义
     const styles = { ... }; // ❌ 错误！不能在组件外部定义
     const helper = () => { ... }; // ❌ 错误！不能在组件外部定义函数
     return <div>...</div>; // ❌ 错误！顶层 return 不允许
     
     export const MyVideo = () => { ... };
     \`\`\`
   
   - ✅ 正确：所有代码都在组件内部
     \`\`\`typescript
     export const MyVideo = () => {
       const config = { ... }; // ✅ 正确！在组件内部
       const styles = { ... }; // ✅ 正确！在组件内部
       return <div>...</div>; // ✅ 正确！在组件内部
     };
     \`\`\`

2. **不能有顶层的 return 语句**：
   - ESM 模块不允许顶层的 return
   - return 只能在函数内部使用
   - 组件必须通过 export 导出，不能通过 return

3. **不能将组件逻辑拆分到外部函数**：
   - ❌ 错误：在组件外部定义函数，然后在组件内调用
     \`\`\`typescript
     const generateVideo = () => {
       const frame = useCurrentFrame(); // ❌ 错误！hooks 不能在非组件函数中使用
       return <div>...</div>;
     };
     
     export const MyVideo = () => generateVideo(); // ❌ 错误！
     \`\`\`
   
   - ✅ 正确：所有逻辑直接在组件内部
     \`\`\`typescript
     export const MyVideo = () => {
       const frame = useCurrentFrame(); // ✅ 正确！在组件内部
       return <div>...</div>; // ✅ 正确！在组件内部
     };
     \`\`\`

4. **代码结构要求**：
   - 只能有一个 MyVideo 组件定义
   - 使用 \`export const MyVideo = () => { ... }\` 格式
   - 所有逻辑、变量、函数都在组件内部
   - 不能有顶层的变量声明（除了组件本身）
   - 不能有顶层的函数定义
   - 不能将组件逻辑拆分到外部函数
   - 所有 hooks 调用必须在 MyVideo 组件内部直接调用

**完整代码示例（参考模板）**：
\`\`\`typescript
// ✅ 正确：所有代码都在组件内部
export const MyVideo = () => {
  // ✅ 所有 hooks 必须在组件内部调用
  const frame = useCurrentFrame();
  
  // ✅ 样式对象在组件内部使用 useMemo
  const styles = useMemo(() => ({
    container: {
      backgroundColor: '#1e1e1e',
      justifyContent: 'center',
      alignItems: 'center',
    },
    element: {
      width: 300,
      height: 300,
      backgroundColor: '#007acc',
      borderRadius: 20,
    },
  }), []);
  
  // ✅ 动画计算在组件内部
  const scale = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
  
  // ✅ 返回 JSX（在组件内部）
  return (
    <AbsoluteFill style={styles.container}>
      <div
        style={{
          ...styles.element,
          transform: \`scale(\${scale})\`,
        }}
      />
    </AbsoluteFill>
  );
};
\`\`\`

**⚠️ Remotion interpolate 使用规范（关键）**：

1. **interpolate 只能用于数字插值**：
   - ❌ 错误：\`interpolate(frame, [0, 60], ['#007acc', '#ffd700'])\` - 颜色字符串不能直接用 interpolate
   - ✅ 正确：使用 \`interpolateColors\` 进行颜色插值
     \`\`\`typescript
     import { interpolateColors } from 'remotion';
     const color = interpolateColors(frame, [0, 60], ['#007acc', '#ffd700']);
     \`\`\`

2. **interpolate 的 outputRange 必须是数字数组**：
   - ✅ 正确：\`interpolate(frame, [0, 60], [0, 1])\` - 数字数组
   - ✅ 正确：\`interpolate(frame, [0, 60], [20, 80])\` - 数字数组（字体大小）
   - ❌ 错误：\`interpolate(frame, [0, 60], ['#007acc', '#ffd700'])\` - 字符串数组

3. **useMemo 和 useCallback 的依赖数组必须完整**：
   - ❌ 错误：
     \`\`\`typescript
     const getStyle = useCallback(() => {
       return interpolate(frame, [0, 60], [0, 1]);
     }, []); // ❌ 缺少 frame 依赖
     \`\`\`
   - ✅ 正确：
     \`\`\`typescript
     const getStyle = useCallback(() => {
       return interpolate(frame, [0, 60], [0, 1]);
     }, [frame]); // ✅ 包含所有依赖
     \`\`\`
   - 或者直接计算，不使用 useCallback：
     \`\`\`typescript
     const style = interpolate(frame, [0, 60], [0, 1]); // ✅ 更简单直接
     \`\`\`

4. **useMemo 依赖数组必须包含所有使用的变量**：
   - ❌ 错误：
     \`\`\`typescript
     const styles = useMemo(() => ({
       fontSize: interpolate(frame, [0, 60], [20, 80]),
     }), []); // ❌ 缺少 frame 依赖，样式不会更新
     \`\`\`
   - ✅ 正确：
     \`\`\`typescript
     const styles = useMemo(() => ({
       fontSize: interpolate(frame, [0, 60], [20, 80]),
     }), [frame]); // ✅ 包含 frame 依赖
     \`\`\`
   - 或者不使用 useMemo（对于简单的计算，直接计算更清晰）：
     \`\`\`typescript
     const fontSize = interpolate(frame, [0, 60], [20, 80]); // ✅ 简单直接
     \`\`\`

**颜色插值正确示例**：
\`\`\`typescript
import { interpolateColors } from 'remotion';

export const MyVideo = () => {
  const frame = useCurrentFrame();
  
  // ✅ 颜色插值使用 interpolateColors
  const color = interpolateColors(frame, [0, 60], ['#007acc', '#ffd700']);
  
  // ✅ 数字插值使用 interpolate
  const fontSize = interpolate(frame, [0, 60], [20, 80], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#1e1e1e', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize, color }}>文本</div>
    </AbsoluteFill>
  );
};
\`\`\`

**常见错误避免**：
1. ❌ 不要在组件外部使用 hooks
2. ❌ 不要在条件语句中使用 hooks
3. ❌ 不要在循环中使用 hooks
4. ❌ 不要忘记导出 MyVideo 组件
5. ❌ 不要忘记使用 AbsoluteFill 作为根容器
6. ❌ 不要用 interpolate 插值颜色字符串（使用 interpolateColors）
7. ❌ 不要在 useMemo/useCallback 中遗漏依赖项
8. ❌ 不要在 useMemo 中计算依赖于 frame 的值但依赖数组为空

**视频配置**：
${videoConfig ? `- 时长: ${videoConfig.durationInFrames} 帧 (${(videoConfig.durationInFrames / videoConfig.fps).toFixed(1)} 秒)
- 帧率: ${videoConfig.fps} fps
- 分辨率: ${videoConfig.width}x${videoConfig.height}` : '使用默认配置'}

**可用资源**：
${assets && assets.length > 0 
  ? `资源库中有 ${assets.length} 个资源：\n${assets.map((a: any) => `- ${a.name} (${a.type}): URL=${a.url}`).join('\n')}\n\n使用资源时，使用 staticFile("资源URL") 的形式。`
  : '资源库为空，但你可以建议用户上传资源'}

**当前代码**：
${code ? `\`\`\`typescript\n${code}\n\`\`\`` : '当前没有代码，可以生成新代码'}`;

    // 创建工具上下文
    const toolContext = {
      code,
      assets: assets || [],
      videoConfig: videoConfig || {
        durationInFrames: 300,
        fps: 30,
        width: 1920,
        height: 1080,
      },
    };

    // 定义增强的工具集（集成智能 Agent 工具）
    const tools = {
      // 1. 编译验证工具（新增 - 核心工具）
      compileAndValidate: tool({
        description: compileAndValidateTool.description,
        parameters: compileAndValidateTool.parameters,
        execute: async (params: any) => {
          return await compileAndValidateTool.execute(params, toolContext);
        },
      }),

      // 2. 自动修复工具（新增 - 核心工具）
      autoFixCode: tool({
        description: autoFixCodeTool.description,
        parameters: autoFixCodeTool.parameters,
        execute: async (params: any) => {
          return await autoFixCodeTool.execute(params, toolContext);
        },
      }),

      // 3. 智能代码生成工具（新增）
      generateCode: tool({
        description: generateCodeTool.description,
        parameters: generateCodeTool.parameters,
        execute: async (params: any) => {
          return await generateCodeTool.execute(params, toolContext);
        },
      }),

      // 4. 迭代优化工具（新增）
      optimizeCodeIterative: tool({
        description: optimizeCodeTool.description,
        parameters: optimizeCodeTool.parameters,
        execute: async (params: any) => {
          return await optimizeCodeTool.execute(params, toolContext);
        },
      }),

      // 5. 代码生成/修改工具（保留，用于直接修改）
      modifyCode: tool({
        description: `修改或生成 Remotion 视频代码。可以创建新代码或基于现有代码进行修改。支持完整代码替换或代码片段插入。
        
        ⚠️ 重要：使用此工具后，必须立即使用 compileAndValidate 验证！
        如果验证失败，必须使用 autoFixCode + modifyCode 进行修复！`,
        parameters: z.object({
          code: z.string().describe('完整的 Remotion 组件代码（MyVideo 函数）或代码片段'),
          reason: z.string().optional().describe('修改原因或说明'),
          isPartial: z.boolean().optional().describe('是否为代码片段（true）或完整代码（false）'),
          insertPosition: z.enum(['beginning', 'middle', 'end', 'replace']).optional().describe('如果是片段，插入位置'),
        }),
        execute: async ({ code, reason, isPartial, insertPosition }) => {
          return {
            success: true,
            message: reason || (isPartial ? '代码片段已生成' : '代码已生成'),
            code,
            isPartial: isPartial || false,
            insertPosition: insertPosition || 'replace',
          };
        },
      }),

      // 2. 代码分析工具（新增）
      analyzeCode: tool({
        description: '分析当前代码的结构、性能、可维护性等方面，提供详细的代码分析报告。',
        parameters: z.object({
          focus: z.enum(['structure', 'performance', 'best-practices', 'all']).optional().describe('分析重点'),
        }),
        execute: async ({ focus }) => {
          // 分析结果由 AI 生成
          return {
            success: true,
            message: '代码分析完成',
            focus: focus || 'all',
          };
        },
      }),

      // 3. 代码优化工具（新增）
      optimizeCode: tool({
        description: '提供代码优化建议，包括性能优化、代码简化、最佳实践等。可以生成优化后的代码。',
        parameters: z.object({
          optimizationType: z.enum(['performance', 'readability', 'best-practices', 'all']).optional().describe('优化类型'),
          generateOptimizedCode: z.boolean().optional().describe('是否生成优化后的代码'),
        }),
        execute: async ({ optimizationType, generateOptimizedCode }) => {
          return {
            success: true,
            message: '代码优化建议已生成',
            optimizationType: optimizationType || 'all',
            generateOptimizedCode: generateOptimizedCode || false,
          };
        },
      }),

      // 4. 资源搜索工具（增强版）
      searchAssets: tool({
        description: '在资源库中搜索可用的资源文件（图片、音频、视频）。可以根据类型、名称等条件搜索。支持智能推荐。',
        parameters: z.object({
          query: z.string().optional().describe('搜索关键词（文件名或描述）'),
          type: z.enum(['all', 'image', 'audio', 'video']).optional().describe('资源类型筛选'),
          recommend: z.boolean().optional().describe('是否根据代码内容智能推荐资源'),
        }),
        execute: async ({ query, type, recommend }) => {
          const availableAssets = assets || [];
          
          let filtered = availableAssets;
          
          // 类型筛选
          if (type && type !== 'all') {
            filtered = filtered.filter((a: any) => a.type === type);
          }
          
          // 关键词搜索
          if (query) {
            filtered = filtered.filter((a: any) => 
              a.name.toLowerCase().includes(query.toLowerCase())
            );
          }
          
          // 智能推荐（根据代码内容）
          if (recommend && code) {
            // 可以根据代码中的关键词推荐资源
            // 例如：代码中有 "background" 就推荐背景图片
            const codeLower = code.toLowerCase();
            if (codeLower.includes('background')) {
              filtered = filtered.filter((a: any) => 
                a.type === 'image' && 
                (a.name.toLowerCase().includes('background') || 
                 a.name.toLowerCase().includes('bg'))
              );
            }
            if (codeLower.includes('music') || codeLower.includes('audio')) {
              filtered = filtered.filter((a: any) => a.type === 'audio');
            }
          }

          return {
            assets: filtered.map((a: any) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              url: a.url,
            })),
            count: filtered.length,
            message: `找到 ${filtered.length} 个匹配的资源`,
            recommendations: recommend ? '已根据代码内容智能推荐' : undefined,
          };
        },
      }),

      // 5. 资源推荐工具（新增）
      recommendAssets: tool({
        description: '根据当前代码内容和用户需求，智能推荐合适的资源文件。',
        parameters: z.object({
          purpose: z.string().describe('资源用途（例如：背景图片、背景音乐、特效视频等）'),
          style: z.string().optional().describe('风格要求（例如：现代、复古、科技感等）'),
        }),
        execute: async ({ purpose, style }) => {
          const availableAssets = assets || [];
          
          // 根据用途和风格推荐资源
          let recommended = availableAssets;
          
          if (purpose.includes('背景') || purpose.includes('background')) {
            recommended = recommended.filter((a: any) => a.type === 'image');
          } else if (purpose.includes('音乐') || purpose.includes('audio')) {
            recommended = recommended.filter((a: any) => a.type === 'audio');
          }
          
          return {
            assets: recommended.slice(0, 5).map((a: any) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              url: a.url,
            })),
            count: recommended.length,
            message: `推荐了 ${Math.min(recommended.length, 5)} 个资源`,
            purpose,
            style,
          };
        },
      }),

      // 6. 代码应用工具
      applyCode: tool({
        description: '将生成的代码应用到编辑器中。只有在用户明确要求时才使用此工具。',
        parameters: z.object({
          code: z.string().describe('要应用的代码'),
          confirm: z.boolean().default(false).describe('是否确认应用（需要用户明确要求）'),
        }),
        execute: async ({ code, confirm }) => {
          if (!confirm) {
            return {
              success: false,
              message: '需要用户明确确认才能应用代码',
            };
          }
          return {
            success: true,
            message: '代码已准备好应用',
            code,
          };
        },
      }),

      // 7. 资源使用工具（增强版）
      useAsset: tool({
        description: '在代码中引用资源文件。需要先通过 searchAssets 或 recommendAssets 找到资源，然后使用此工具在代码中引用。支持多种使用方式。',
        parameters: z.object({
          assetUrl: z.string().describe('资源URL路径（从 searchAssets 或 recommendAssets 获取）'),
          assetType: z.enum(['image', 'audio', 'video']).describe('资源类型'),
          usage: z.string().describe('如何使用这个资源（例如：背景图片、背景音乐、前景视频等）'),
          codeContext: z.string().optional().describe('代码上下文，用于更好地集成资源'),
        }),
        execute: async ({ assetUrl, assetType, usage, codeContext }) => {
          // 生成使用资源的代码示例
          let codeSnippet = '';
          
          if (assetType === 'image') {
            if (usage.includes('背景') || usage.includes('background')) {
              codeSnippet = `<AbsoluteFill>\n  <Img src={staticFile("${assetUrl}")} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />\n</AbsoluteFill>`;
            } else {
              codeSnippet = `<Img src={staticFile("${assetUrl}")} />`;
            }
          } else if (assetType === 'audio') {
            codeSnippet = `<Audio src={staticFile("${assetUrl}")} />`;
          } else if (assetType === 'video') {
            codeSnippet = `<Video src={staticFile("${assetUrl}")} />`;
          }

          return {
            success: true,
            code: codeSnippet,
            message: `已生成使用 ${usage} 的代码片段`,
            assetUrl,
            assetType,
          };
        },
      }),

      // 8. 代码审查工具（新增）
      reviewCode: tool({
        description: '审查代码质量，检查潜在问题、性能瓶颈、最佳实践违反等。',
        parameters: z.object({
          checkTypes: z.array(z.enum(['syntax', 'performance', 'best-practices', 'accessibility', 'all'])).optional().describe('检查类型'),
        }),
        execute: async ({ checkTypes }) => {
          return {
            success: true,
            message: '代码审查完成',
            checkTypes: checkTypes || ['all'],
          };
        },
      }),

      // 9. 错误修复工具（新增）
      fixErrors: tool({
        description: '检测并修复代码中的错误，包括语法错误、类型错误、运行时错误等。',
        parameters: z.object({
          errorType: z.enum(['syntax', 'type', 'runtime', 'all']).optional().describe('错误类型'),
        }),
        execute: async ({ errorType }) => {
          return {
            success: true,
            message: '错误修复建议已生成',
            errorType: errorType || 'all',
          };
        },
      }),
    };

    // 构建消息列表
    const contextMessages = messages || [];

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: contextMessages,
      tools,
      maxSteps: 20, // 增加工具调用步数，支持自动修复的多次迭代
      // 启用自动工具调用，AI 可以主动验证和修复
      experimental_toolCallStreaming: true,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // 提供更详细的错误信息
    let errorMessage = 'AI 服务错误，请检查配置';
    if (error?.message) {
      if (error.message.includes('API key') || error.message.includes('apiKey')) {
        errorMessage = 'API Key 无效，请检查设置中的 API Key 是否正确';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'API Key 认证失败，请检查 API Key 是否正确';
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorMessage = 'API 调用频率超限，请稍后再试';
      } else if (error.message.includes('model')) {
        errorMessage = '模型名称无效，请检查设置中的模型名称是否正确';
      } else {
        errorMessage = `AI 服务错误: ${error.message}`;
      }
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
