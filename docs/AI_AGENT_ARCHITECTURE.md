# AI Agent 系统架构文档

## 概述

全新的智能 AI Agent 系统，参考业内最佳实践（LangGraph 状态机、AutoGen 多智能体协作），实现了自动错误检测和修复的完整闭环。

## 核心能力

### 1. 自动错误修复闭环
- **编译验证**：每次代码生成/修改后自动验证
- **错误分析**：智能分析错误类型和原因
- **自动修复**：基于错误信息自动生成修复代码
- **迭代优化**：最多尝试 5 次修复，直到成功

### 2. 智能代码生成
- **资源指定**：支持用户指定要使用的资源
- **代码微调**：基于现有代码进行增量修改
- **规范遵循**：自动确保代码符合所有规范

### 3. 迭代优化
- **多轮优化**：支持渐进式代码优化
- **性能优化**：自动优化代码性能
- **最佳实践**：确保代码符合最佳实践

## 系统架构

### 核心组件

#### 1. IntelligentAgent (`lib/ai/agent-engine.ts`)
智能 Agent 引擎，负责：
- 代码验证和分析
- 错误分析和分类
- 修复提示词生成
- 迭代修复流程管理

#### 2. Agent Tools V2 (`lib/ai/agent-tools-v2.ts`)
增强的工具集：
- `compileAndValidate`: 编译验证工具
- `autoFixCode`: 自动修复工具
- `generateCode`: 智能代码生成工具
- `optimizeCodeIterative`: 迭代优化工具

#### 3. API Route (`app/api/chat/route.ts`)
集成智能 Agent 的 API 路由：
- 工具注册和调用
- 上下文管理
- 错误处理

## 工作流程

### 代码生成流程

```
用户请求
  ↓
generateCode (生成代码)
  ↓
compileAndValidate (验证)
  ↓
[如果失败]
  ↓
autoFixCode (分析错误)
  ↓
modifyCode (修复代码)
  ↓
compileAndValidate (再次验证)
  ↓
[如果还有错误，重复修复，最多5次]
  ↓
成功 → 返回代码
```

### 代码修改流程

```
用户请求修改
  ↓
modifyCode (修改代码)
  ↓
compileAndValidate (验证)
  ↓
[如果失败，进入自动修复流程]
  ↓
成功 → 返回代码
```

## 工具说明

### compileAndValidate
**功能**：验证代码是否能成功编译

**使用场景**：
- 生成代码后自动验证
- 修复代码后验证是否成功
- 迭代优化过程中验证

**返回**：
- `success`: 是否成功
- `errors`: 错误列表
- `warnings`: 警告列表
- `fixSuggestion`: 修复建议（如果启用 autoFix）

### autoFixCode
**功能**：分析错误并生成修复提示词

**工作流程**：
1. 验证代码，获取错误信息
2. 分析错误类型和原因
3. 生成修复提示词
4. 返回给 AI 用于修复

**返回**：
- `errorAnalysis`: 错误分析结果
- `fixPrompt`: 修复提示词
- `message`: 修复建议

### generateCode
**功能**：智能生成代码，支持资源指定和代码微调

**参数**：
- `requirement`: 用户需求
- `baseCode`: 现有代码（可选）
- `assetIds`: 资源 ID 列表（可选）
- `modificationType`: 生成类型（new/modify/enhance）

**返回**：
- `prompt`: 代码生成提示词
- `assets`: 选中的资源列表

### optimizeCodeIterative
**功能**：迭代优化代码

**参数**：
- `code`: 要优化的代码
- `optimizationGoals`: 优化目标
- `validateAfterOptimize`: 是否验证

**返回**：
- `prompt`: 优化提示词
- `beforeValidation`: 优化前的验证结果

## 最佳实践

### 1. 始终验证代码
每次生成或修改代码后，必须调用 `compileAndValidate` 验证。

### 2. 自动修复流程
如果验证失败，使用以下流程：
1. 调用 `autoFixCode` 分析错误
2. 基于 `fixPrompt` 使用 `modifyCode` 修复
3. 再次验证
4. 重复直到成功或达到最大迭代次数

### 3. 资源使用
- 用户指定资源时，在 `generateCode` 的 `assetIds` 参数中传递
- 自动搜索资源时，使用 `searchAssets` 工具
- 在代码中使用 `staticFile("资源URL")` 引用资源

### 4. 代码微调
- 使用 `generateCode` 的 `modificationType: 'modify'` 进行修改
- 使用 `modifyCode` 进行精确修改
- 修改后必须验证

## 与旧系统的区别

### 旧系统
- ❌ 没有自动验证
- ❌ 没有自动修复
- ❌ 工具调用不够智能
- ❌ 需要手动处理错误

### 新系统
- ✅ 自动验证代码
- ✅ 自动修复错误
- ✅ 智能工具调用
- ✅ 完整闭环流程
- ✅ 支持资源指定
- ✅ 支持代码微调

## 未来改进

1. **更智能的错误分析**：使用 AI 模型分析错误
2. **多智能体协作**：实现规划者、执行者、评审者角色
3. **状态持久化**：保存修复历史，学习常见错误
4. **RAG 增强**：结合代码库知识，提供更好的建议

