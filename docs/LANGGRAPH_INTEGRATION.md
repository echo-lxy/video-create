# LangGraph 集成方案

## 为什么选择 LangGraph

1. **专业框架**：专门为 AI Agent 工作流设计
2. **状态机模式**：完美支持迭代修复流程
3. **TypeScript 支持**：官方支持，类型安全
4. **成熟稳定**：LangChain 团队维护，社区活跃
5. **可视化调试**：支持工作流可视化
6. **状态持久化**：支持保存和恢复状态

## 安装

```bash
npm install @langchain/langgraph @langchain/core
```

## 架构设计

### 工作流图

```
开始
  ↓
生成代码 (generate)
  ↓
验证代码 (validate)
  ↓
[成功?]
  ├─ 是 → 结束
  └─ 否 → 修复代码 (fix)
         ↓
      验证代码 (validate)
         ↓
      [达到最大次数?]
        ├─ 是 → 结束
        └─ 否 → 修复代码 (fix)
```

### 状态定义

```typescript
interface CodeAgentState {
  code: string;           // 当前代码
  errors: string[];        // 错误列表
  warnings: string[];      // 警告列表
  iteration: number;      // 当前迭代次数
  maxIterations: number;   // 最大迭代次数
  success: boolean;        // 是否成功
  message: string;         // 状态消息
  // ... 其他上下文
}
```

## 集成步骤

### 1. 安装依赖

```bash
npm install @langchain/langgraph @langchain/core
```

### 2. 创建 Agent 工作流

参考 `lib/ai/langgraph-agent.ts`

### 3. 与 Vercel AI SDK 集成

```typescript
// 在 LangGraph 节点中调用 AI
async function generateCodeNode(state: CodeAgentState) {
  // 使用 Vercel AI SDK 生成代码
  const result = await streamText({
    model: aiModel,
    prompt: state.requirement,
    tools: { ... },
  });
  
  return { code: generatedCode };
}
```

### 4. 更新 API 路由

在 `app/api/chat/route.ts` 中使用 LangGraph Agent：

```typescript
import { runCodeAgent } from '@/lib/ai/langgraph-agent';

// 在 POST 处理中使用
const result = await runCodeAgent({
  requirement: userMessage,
  baseCode: code,
  assetIds: selectedAssetIds,
  assets: formattedAssets,
  videoConfig,
});
```

## 优势对比

### 使用 LangGraph 前

```typescript
// 手动管理状态
let currentCode = initialCode;
let iteration = 0;
while (iteration < maxIterations) {
  const validation = await validate(currentCode);
  if (validation.isValid) break;
  
  currentCode = await fix(currentCode, validation.errors);
  iteration++;
}
```

### 使用 LangGraph 后

```typescript
// 声明式工作流
const workflow = new StateGraph({ ... });
workflow.addNode("generate", generateCode);
workflow.addNode("validate", validateCode);
workflow.addNode("fix", fixCode);
workflow.addConditionalEdges("validate", shouldContinue);

// 自动管理状态和流程
const result = await workflow.invoke(initialState);
```

## 高级功能

### 1. 可视化调试

LangGraph 支持工作流可视化，可以：
- 查看当前执行到哪个节点
- 查看状态变化
- 调试工作流

### 2. 状态持久化

```typescript
// 保存状态
await workflow.checkpoint({ ... });

// 恢复状态
await workflow.resume(checkpointId);
```

### 3. 多 Agent 协作

```typescript
// 可以创建多个 Agent 协作
const plannerAgent = createPlannerAgent();
const executorAgent = createExecutorAgent();
const reviewerAgent = createReviewerAgent();

// 协作工作流
workflow.addNode("plan", plannerAgent);
workflow.addNode("execute", executorAgent);
workflow.addNode("review", reviewerAgent);
```

## 迁移计划

### 阶段 1：基础集成（1-2天）
- [ ] 安装 LangGraph
- [ ] 创建基础工作流
- [ ] 集成到 API 路由

### 阶段 2：功能完善（2-3天）
- [ ] 添加 AI 调用集成
- [ ] 完善错误处理
- [ ] 添加状态持久化

### 阶段 3：高级功能（可选）
- [ ] 可视化调试界面
- [ ] 多 Agent 协作
- [ ] 性能优化

## 注意事项

1. **依赖管理**：LangGraph 可能引入较多依赖，注意包大小
2. **学习曲线**：需要理解状态机概念
3. **性能**：状态机可能比直接调用稍慢，但更可靠

## 总结

LangGraph 是当前最适合我们需求的方案：
- ✅ 专业、成熟
- ✅ TypeScript 支持
- ✅ 完美支持迭代修复
- ✅ 易于扩展

建议优先集成 LangGraph，提升 Agent 系统的专业性和可靠性。

