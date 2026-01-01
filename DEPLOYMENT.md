# 部署指南

## GitHub Pages 一键部署

### 前置条件

1. 将项目推送到 GitHub 仓库
2. 确保仓库中包含 `.github/workflows/deploy.yml` 文件

### 部署步骤

1. **推送代码到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit: AI Video Code Generator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

2. **配置 GitHub Pages**

   - 进入仓库的 Settings
   - 点击左侧菜单的 "Pages"
   - Source 选择 "GitHub Actions"

3. **触发部署**

   - 每次推送到 `main` 分支都会自动触发部署
   - 也可以在 Actions 标签页手动触发部署

4. **访问网站**

   部署完成后，网站将在以下地址可用：
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO/
   ```

### 自定义域名（可选）

1. 在仓库根目录创建 `public/CNAME` 文件
2. 添加你的域名（如 `video-editor.example.com`）
3. 在域名服务商处配置 DNS：
   - 类型：CNAME
   - 名称：www（或其他子域名）
   - 值：YOUR_USERNAME.github.io

## 验证部署

### 本地验证

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 预览构建结果
cd out
python3 -m http.server 8000
# 然后访问 http://localhost:8000
```

### 检查清单

- [ ] 页面能够正常加载
- [ ] 代码编辑器能够显示
- [ ] AI 配置界面可以打开
- [ ] Monaco Editor 加载正常
- [ ] Remotion Player 可以预览视频
- [ ] LocalForage 存储正常工作

## 常见问题

### 1. 页面加载失败

**问题**：GitHub Pages 显示 404 错误

**解决方案**：
- 确保 `next.config.js` 中配置了 `output: 'export'`
- 检查 GitHub Pages 设置是否正确
- 等待几分钟让部署完成

### 2. 资源加载失败

**问题**：CSS/JS 文件 404

**解决方案**：
- 确保项目根目录有 `.nojekyll` 文件
- 检查 `public/.nojekyll` 是否存在
- 在 `next.config.js` 中配置正确的 base path（如果使用子路径）

### 3. API 路由不工作

**问题**：AI 聊天功能无法使用

**说明**：
- GitHub Pages 只支持静态文件
- API 路由（`/api/chat`）在静态导出时不可用
- 需要将 AI 调用移到客户端或使用其他服务

**临时解决方案**：
- 使用客户端直接调用 AI API
- 或部署到支持服务端的平台（Vercel、Netlify）

### 4. Monaco Editor 加载慢

**问题**：代码编辑器加载时间长

**优化方案**：
- Monaco Editor 使用 CDN 加载
- 首次加载会较慢，后续会有缓存
- 考虑使用代码分割和懒加载

## 替代部署方案

### Vercel（推荐用于支持 API）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

优点：
- 支持 API Routes
- 自动 HTTPS
- 全球 CDN
- 免费额度充足

### Netlify

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

### Cloudflare Pages

1. 登录 Cloudflare Dashboard
2. 选择 Pages
3. 连接 GitHub 仓库
4. 配置构建：
   - Build command: `npm run build`
   - Build output: `out`

## 环境变量

如果需要使用环境变量（如 API 密钥），可以：

1. **GitHub Secrets**（用于 CI/CD）
   - Settings > Secrets and variables > Actions
   - 添加必要的密钥

2. **客户端配置**（推荐）
   - 用户自己配置 API 密钥
   - 存储在浏览器 LocalStorage 中
   - 更安全，不暴露密钥

## 性能优化

1. **启用压缩**
   - GitHub Pages 自动启用 gzip

2. **使用 CDN**
   - Monaco Editor 使用 CDN 加载
   - esbuild-wasm 使用 unpkg CDN

3. **懒加载**
   - 使用 Next.js dynamic import
   - 组件按需加载

4. **缓存策略**
   - 静态资源使用长期缓存
   - HTML 使用短期缓存

## 监控和分析

### Google Analytics（可选）

在 `app/layout.tsx` 中添加：

```tsx
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script dangerouslySetInnerHTML={{
  __html: \`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  \`
}} />
```

### Sentry 错误追踪（可选）

```bash
npm install --save @sentry/nextjs
```

## 成本

- **GitHub Pages**: 完全免费
- **带宽**: 100GB/月（免费）
- **构建时间**: 无限制
- **存储**: 1GB（足够静态站点使用）

## 总结

✅ 一键部署到 GitHub Pages
✅ 完全免费，无服务器成本
✅ 自动 CI/CD
✅ 全球 CDN 加速
⚠️ API 功能需要客户端处理或使用其他平台

---

祝部署顺利！如有问题请查看 [GitHub Issues](https://github.com/YOUR_USERNAME/YOUR_REPO/issues)

