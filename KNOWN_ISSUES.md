# 已知问题

## Monaco Editor 内部错误

### 错误信息
```
Cannot read properties of undefined (reading 'BarBarToken')
```

### 原因
这是 Monaco Editor 的内部错误，通常发生在编辑器初始化时。这个错误不影响编辑器功能，可以安全忽略。

### 解决方案
- ✅ 已在代码中添加错误过滤
- ✅ 这些错误会被捕获但不会显示给用户
- ✅ 编辑器功能正常工作

### 技术说明
Monaco Editor 在加载 TypeScript 语言服务时可能会触发一些内部错误。这些错误通常与编辑器的内部状态管理有关，但不影响实际的编辑功能。

---

## 其他已知问题

### 1. 首次加载较慢

**原因**: 
- Monaco Editor 需要从 CDN 加载（约 2-3MB）
- esbuild-wasm 需要加载 WASM 文件（约 1MB）

**影响**: 首次加载可能需要 10-30 秒

**解决方案**: 
- 使用调试模式查看加载进度：`?debug=1`
- 确保网络连接稳定
- 后续加载会更快（浏览器缓存）

### 2. 某些网络环境可能无法加载 CDN

**原因**: 
- 某些防火墙或网络环境可能阻止 `cdn.jsdelivr.net` 或 `unpkg.com`

**解决方案**: 
- 使用 VPN
- 更换网络环境
- 考虑使用本地资源（需要修改配置）

### 3. Safari 浏览器兼容性

**原因**: Safari 对某些 Web API 的支持可能不同

**解决方案**: 
- 使用 Chrome 或 Firefox（推荐）
- 确保 Safari 版本 >= 14

---

## 已修复的问题

- ✅ Monaco Editor 内部错误过滤
- ✅ 加载超时检测
- ✅ 错误边界处理
- ✅ 组件懒加载优化

---

**如果遇到其他问题，请查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

