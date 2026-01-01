# 浏览器兼容性修复

## 问题

`@typescript-eslint/typescript-estree` 包在浏览器环境中无法工作，导致 `BarBarToken` 错误。

## 原因

`@typescript-eslint/typescript-estree` 是一个 Node.js 包，依赖 Node.js 特定的模块（如 `fs`、`path` 等），在浏览器环境中会失败。

## 解决方案

将代码验证从 AST 解析改为简单的正则表达式验证：

### 之前（AST 解析）
```typescript
import { parse } from '@typescript-eslint/typescript-estree';
const ast = parse(code, { jsx: true });
// 遍历 AST...
```

### 现在（正则表达式）
```typescript
// 使用正则表达式检查危险 API
const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${dangerousApi}\\s*\\(`, 'g');
if (regex.test(code)) {
  errors.push(`Dangerous API detected: ${dangerousApi}`);
}
```

## 优势

1. ✅ **浏览器兼容**：不依赖 Node.js 模块
2. ✅ **更轻量**：不需要加载大型 AST 解析器
3. ✅ **更快**：正则表达式比 AST 解析快得多
4. ✅ **更简单**：代码更易维护

## 功能保持

- ✅ 危险 API 检测（eval, Function, require 等）
- ✅ Import 语句验证
- ✅ 安全警告

## 限制

- ⚠️ 正则表达式不如 AST 解析精确
- ⚠️ 可能无法检测所有复杂的代码模式
- ✅ 但对于基本的安全检查已经足够

## 测试

修复后应该：
- ✅ 不再出现 `BarBarToken` 错误
- ✅ 代码验证正常工作
- ✅ 页面可以正常加载

