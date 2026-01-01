# 快速加载设置指南

## 🚀 解决下载慢的问题

### 问题
Monaco Editor 和 esbuild-wasm 从 CDN 下载很慢（20-40秒）

### 解决方案
将资源下载到本地，从本地加载（快 10 倍！）

---

## 📥 快速设置（3步）

### 步骤 1: 运行下载脚本

```bash
cd /Users/miaomiao/MyData/demo-project/video-create-demo
./scripts/download-assets.sh
```

这会自动下载：
- ✅ esbuild-wasm (~1MB) → `public/esbuild/esbuild.wasm`
- ✅ Monaco Editor 核心文件 (~2MB) → `public/monaco/vs/`

### 步骤 2: 验证文件

```bash
ls -lh public/esbuild/
ls -lh public/monaco/vs/
```

应该看到文件已下载。

### 步骤 3: 重新构建

```bash
npm run build
```

---

## ⚡ 性能提升

### 之前（CDN）
- Monaco Editor: 10-20 秒
- esbuild-wasm: 5-10 秒
- **总计**: 20-40 秒

### 之后（本地）
- Monaco Editor: 1-2 秒（本地文件）
- esbuild-wasm: 0.5-1 秒（本地文件）
- **总计**: 2-5 秒 ⚡ **快 10 倍！**

---

## 🔄 自动回退机制

代码已配置自动检测：
- ✅ 如果本地文件存在 → 使用本地（快）
- ✅ 如果本地文件不存在 → 使用 CDN（慢，但可用）

---

## 📝 手动下载（如果脚本失败）

### 下载 esbuild-wasm

```bash
mkdir -p public/esbuild
cd public/esbuild
curl -L -o esbuild.wasm https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm
```

### 下载 Monaco Editor（最小版本）

```bash
mkdir -p public/monaco/vs
cd public/monaco

# 下载核心文件
curl -L -o vs/loader.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js
curl -L -o vs/editor/editor.main.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.js
curl -L -o vs/editor/editor.main.css https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.css
curl -L -o vs/language/typescript/tsWorker.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/tsWorker.js
```

---

## 🎯 完整下载（可选）

如果需要完整的 Monaco Editor 功能，可以下载所有文件：

```bash
# 使用 wget 或 curl 递归下载整个目录
# 注意：这会下载更多文件（~10MB），但功能更完整
```

---

## ✅ 验证

下载完成后：

1. **检查文件大小**
   ```bash
   du -sh public/esbuild
   du -sh public/monaco
   ```

2. **测试本地加载**
   - 启动开发服务器：`npm run dev`
   - 打开浏览器控制台
   - 应该看到 "Using local esbuild-wasm (faster!)"
   - 应该看到 "Using local Monaco Editor (faster!)"

3. **检查加载时间**
   - 之前：20-40 秒
   - 现在：2-5 秒

---

## 📦 Git 处理

### 选项 1: 提交资源文件（推荐用于 GitHub Pages）

```bash
git add public/esbuild public/monaco
git commit -m "Add local assets for faster loading"
```

**优点**：
- ✅ 部署后立即生效
- ✅ 不依赖 CDN
- ✅ 加载速度快

**缺点**：
- ⚠️ 仓库体积增加 ~3-4MB

### 选项 2: 使用 .gitignore（不提交）

在 `.gitignore` 中添加：
```
public/esbuild/
public/monaco/
```

然后在 CI/CD 中下载：
```yaml
# .github/workflows/deploy.yml
- name: Download assets
  run: ./scripts/download-assets.sh
```

---

## 🚀 立即执行

运行以下命令立即优化：

```bash
cd /Users/miaomiao/MyData/demo-project/video-create-demo
./scripts/download-assets.sh
npm run build
```

然后刷新浏览器，应该快很多！

---

## 💡 提示

- 首次下载可能需要 1-2 分钟（取决于网络）
- 下载后，后续加载会快 10 倍
- 如果下载失败，代码会自动回退到 CDN

---

**现在就运行脚本，享受快速加载！** ⚡

