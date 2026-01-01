# 故障排除指南

## 🔴 问题：页面一直卡在 "Loading AI Video Editor..."

### 可能的原因和解决方案

#### 1. 网络问题（最常见）

**症状**: 页面一直显示加载中，没有任何错误

**原因**: 
- Monaco Editor 需要从 CDN 加载（约 2-3MB）
- esbuild-wasm 需要从 unpkg 加载（约 1MB）
- 网络慢或防火墙阻止

**解决方案**:

1. **检查网络连接**
   - 确保网络正常
   - 尝试刷新页面（Cmd+Shift+R 或 Ctrl+Shift+R）

2. **使用调试模式**
   - 在 URL 后添加 `?debug=1`
   - 例如：`https://echo-lxy.github.io/video-create/?debug=1`
   - 这会显示每个组件的加载状态

3. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 标签中的错误信息
   - 查看 Network 标签，检查哪些资源加载失败

4. **清除浏览器缓存**
   - Chrome: Settings → Privacy → Clear browsing data
   - 选择 "Cached images and files"
   - 清除后重新加载

#### 2. 浏览器兼容性问题

**症状**: 某些浏览器无法加载

**支持的浏览器**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**解决方案**:
- 更新浏览器到最新版本
- 尝试使用 Chrome 或 Firefox

#### 3. 依赖加载失败

**症状**: 调试模式显示某些组件加载失败

**检查步骤**:

1. **打开调试模式**
   ```
   https://echo-lxy.github.io/video-create/?debug=1
   ```

2. **查看加载状态**
   - ✅ 绿色 = 加载成功
   - ❌ 红色 = 加载失败
   - ⏳ 黄色 = 正在加载

3. **根据错误信息处理**

#### 4. Monaco Editor 加载失败

**症状**: 代码编辑器无法显示

**解决方案**:

1. **检查网络连接**
   - Monaco Editor 需要从 CDN 加载
   - 确保可以访问 `cdn.jsdelivr.net`

2. **手动检查**
   ```javascript
   // 在浏览器控制台运行
   fetch('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js')
     .then(r => console.log('Monaco CDN accessible'))
     .catch(e => console.error('Monaco CDN blocked:', e))
   ```

3. **使用本地版本**（需要修改代码）
   - 下载 Monaco Editor 到 `public` 目录
   - 修改 `next.config.js` 配置

#### 5. esbuild-wasm 初始化失败

**症状**: 代码编译功能不工作

**解决方案**:

1. **检查 unpkg CDN**
   ```javascript
   // 在浏览器控制台运行
   fetch('https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm')
     .then(r => console.log('esbuild CDN accessible'))
     .catch(e => console.error('esbuild CDN blocked:', e))
   ```

2. **网络问题**
   - 确保可以访问 `unpkg.com`
   - 某些网络环境可能阻止 unpkg

3. **等待更长时间**
   - esbuild-wasm 首次加载需要下载 WASM 文件（约 1MB）
   - 慢速网络可能需要 30-60 秒

#### 6. JavaScript 错误

**症状**: 页面加载但立即报错

**解决方案**:

1. **打开浏览器控制台**（F12）
2. **查看错误信息**
3. **常见错误**:
   - `Cannot read property 'X' of undefined` → 组件初始化问题
   - `Module not found` → 构建问题，需要重新部署
   - `CORS error` → CDN 访问问题

#### 7. 构建问题

**症状**: 部署后页面无法加载

**解决方案**:

1. **检查 GitHub Actions**
   - 访问：https://github.com/echo-lxy/video-create/actions
   - 查看最新的部署是否成功
   - 如果失败，查看错误日志

2. **重新构建**
   ```bash
   npm run build
   # 检查是否有错误
   ```

3. **重新部署**
   ```bash
   git push origin master
   ```

---

## 🛠️ 调试工具

### 调试模式

在 URL 后添加 `?debug=1` 来查看详细的加载状态：

```
https://echo-lxy.github.io/video-create/?debug=1
```

这会显示：
- ✅ React Hydration 状态
- ✅ Monaco Editor 加载状态
- ✅ Remotion Player 加载状态
- ✅ esbuild-wasm 初始化状态
- ✅ Zustand Store 状态

### 浏览器控制台检查

1. **打开开发者工具**（F12）
2. **查看 Console 标签**
   - 查找红色错误信息
   - 查找黄色警告信息

3. **查看 Network 标签**
   - 检查哪些资源加载失败（红色）
   - 检查加载时间
   - 检查资源大小

### 性能分析

1. **打开 Performance 标签**
2. **录制页面加载**
3. **查看瓶颈**
   - 哪些资源加载最慢
   - JavaScript 执行时间

---

## 🔧 快速修复

### 方法 1: 强制刷新

```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### 方法 2: 清除缓存并刷新

1. 打开开发者工具（F12）
2. 右键点击刷新按钮
3. 选择 "Empty Cache and Hard Reload"

### 方法 3: 使用无痕模式

- Chrome: `Ctrl+Shift+N` (Windows) 或 `Cmd+Shift+N` (Mac)
- Firefox: `Ctrl+Shift+P` (Windows) 或 `Cmd+Shift+P` (Mac)
- Safari: `Cmd+Shift+N`

### 方法 4: 检查网络

```bash
# 测试 CDN 连接
curl -I https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js
curl -I https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm
```

---

## 📊 常见错误信息

### "Failed to fetch"

**原因**: 网络问题或 CDN 不可访问

**解决**: 
- 检查网络连接
- 尝试使用 VPN
- 等待网络恢复

### "Module not found"

**原因**: 构建问题或依赖缺失

**解决**:
- 重新构建项目
- 检查 `package.json` 依赖
- 重新部署

### "Cannot read property of undefined"

**原因**: 组件初始化顺序问题

**解决**:
- 刷新页面
- 检查浏览器控制台详细错误
- 使用调试模式查看加载状态

### "Loading timeout"

**原因**: 资源加载超过 30 秒

**解决**:
- 检查网络速度
- 使用调试模式查看哪个组件卡住
- 尝试使用更快的网络

---

## 🆘 仍然无法解决？

### 收集信息

1. **浏览器信息**
   - 浏览器类型和版本
   - 操作系统

2. **错误信息**
   - 浏览器控制台的完整错误
   - 网络标签中的失败请求

3. **调试信息**
   - 访问 `?debug=1` 的截图
   - 各个组件的加载状态

4. **网络信息**
   - 网络速度
   - 是否使用 VPN/代理
   - 是否在公司/学校网络

### 提交 Issue

访问：https://github.com/echo-lxy/video-create/issues

包含以上收集的信息。

---

## ✅ 预防措施

1. **使用现代浏览器**
   - 保持浏览器更新到最新版本

2. **稳定的网络连接**
   - 使用有线网络（如果可能）
   - 避免不稳定的 WiFi

3. **清除缓存**
   - 定期清除浏览器缓存
   - 使用无痕模式测试

4. **检查防火墙**
   - 确保防火墙不阻止 CDN 访问
   - 允许访问 `cdn.jsdelivr.net` 和 `unpkg.com`

---

**希望这些信息能帮助你解决问题！** 🚀

