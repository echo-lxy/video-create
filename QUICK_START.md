# 快速开始

## 🚀 5分钟上手指南

### 第一步：安装依赖

```bash
npm install
```

### 第二步：启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

### 第三步：配置 AI

1. 点击右上角的 "Configure AI" 按钮
2. 填写你的 AI 提供商信息：
   - **Provider Name**: OpenAI GPT-4 (或其他名称)
   - **API Key**: 你的 API 密钥
   - **Model**: gpt-4, gpt-3.5-turbo, claude-3-opus 等
   - **Base URL** (可选): 自定义 API 端点

3. 点击 "Add Provider"
4. 点击 "Activate" 激活

### 第四步：开始使用

#### 方式 1：通过 AI 聊天生成代码

在左侧 AI 聊天面板输入：
```
创建一个简单的视频，背景是蓝色，显示 "Hello World" 文字
```

AI 会生成代码并自动应用到编辑器。

#### 方式 2：直接编辑代码

点击右上角 "Code Editor" 按钮，手动编写 Remotion 代码：

```typescript
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#4A90E2' }}>
      <h1 style={{ fontSize: 100, color: 'white', opacity }}>
        Hello World
      </h1>
    </AbsoluteFill>
  );
};
```

### 第五步：预览和调整

- 视频会自动编译并在右侧预览
- 使用播放控制器控制播放
- 实时看到代码修改的效果

## 💡 示例提示词

### 基础动画
```
创建一个淡入效果的文字动画
```

### 复杂效果
```
创建一个视频，包含：
1. 背景渐变从蓝色到紫色
2. 标题从左侧滑入
3. 副标题从底部淡入
```

### 特效
```
添加一个弹跳动画效果
```

## 🛠️ 常用功能

### 隐藏/显示面板

- **AI Chat**: 点击 "AI Chat" 按钮
- **Code Editor**: 点击 "Code Editor" 按钮

### 保存和加载

- 代码自动保存到浏览器本地存储
- 刷新页面后代码会自动恢复

### 重置代码

如果代码出错，刷新页面即可恢复到上次正常的状态。

## 📚 Remotion 基础

### 核心概念

1. **AbsoluteFill**: 填充整个画面的容器
2. **useCurrentFrame**: 获取当前帧数
3. **interpolate**: 插值函数，用于动画

### 基本结构

```typescript
import React from 'react';
import { AbsoluteFill } from 'remotion';

export const MyVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* 你的内容 */}
    </AbsoluteFill>
  );
};
```

### 动画示例

```typescript
import { useCurrentFrame, interpolate } from 'remotion';

const frame = useCurrentFrame();
const opacity = interpolate(
  frame,
  [0, 30],      // 输入范围：0-30帧
  [0, 1]        // 输出范围：透明到不透明
);
```

## ⚠️ 注意事项

1. **API 密钥安全**
   - API 密钥只存储在你的浏览器本地
   - 不会发送到任何服务器
   - 定期更换密钥

2. **代码限制**
   - 只能使用允许的库（React, Remotion）
   - 危险 API 会被阻止
   - 代码会经过安全验证

3. **性能**
   - 首次编译可能较慢
   - 后续编译会很快
   - 复杂动画可能影响预览性能

## 🐛 遇到问题？

### 编译错误

- 检查代码语法
- 确保导入了必要的模块
- 查看错误提示

### AI 无响应

- 检查 API 密钥是否正确
- 确认网络连接
- 查看浏览器控制台错误

### 预览空白

- 等待编译完成
- 检查代码是否有错误
- 刷新页面重试

## 📖 更多资源

- [Remotion 官方文档](https://www.remotion.dev/docs)
- [示例代码库](https://github.com/remotion-dev/remotion)
- [社区讨论](https://github.com/remotion-dev/remotion/discussions)

## 🎉 下一步

- 尝试更复杂的动画
- 探索 Remotion 的其他功能
- 分享你的创作

---

祝你使用愉快！💫

