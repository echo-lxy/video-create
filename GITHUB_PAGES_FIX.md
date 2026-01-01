# GitHub Pages 404 错误修复

## 问题

GitHub Pages 部署后出现资源加载 404 错误：
- `_next/static/...` 文件无法加载
- CSS 和 JS 文件返回 404

## 原因

GitHub Pages 部署在子路径 `/video-create/` 下，但 Next.js 默认使用绝对路径 `/`。

## 解决方案

已添加 `basePath` 和 `assetPrefix` 配置：

```javascript
const basePath = isProduction ? '/video-create' : '';
```

## 修复内容

1. ✅ 添加 `basePath` 配置
2. ✅ 添加 `assetPrefix` 配置  
3. ✅ 禁用 API 路由（静态导出不支持）
4. ✅ 更新 GitHub Actions 构建配置

## 部署步骤

1. 提交并推送代码：
   ```bash
   git add .
   git commit -m "Fix: Add basePath for GitHub Pages"
   git push origin master
   ```

2. 等待 GitHub Actions 部署完成

3. 访问网站：
   ```
   https://echo-lxy.github.io/video-create/
   ```

## 注意事项

- API 路由 (`/api/chat`) 在 GitHub Pages 上不可用（静态导出限制）
- AI 功能需要在客户端直接调用 API（需要修改代码）
- 或者部署到支持服务端的平台（Vercel、Netlify）

## 验证

部署后检查：
- [ ] 页面可以正常加载
- [ ] CSS 样式正常
- [ ] JavaScript 功能正常
- [ ] 没有 404 错误

