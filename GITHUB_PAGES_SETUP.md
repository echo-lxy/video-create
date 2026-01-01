# GitHub Pages 自动部署配置指南

## 🎯 目标

配置 GitHub Actions 自动构建和部署到 GitHub Pages，实现**一键推送，自动部署**。

---

## 📋 完整步骤

### 第一步：推送代码到 GitHub

如果你还没有推送代码，先完成推送：

```bash
cd /Users/miaomiao/MyData/demo-project/video-create-demo
git push -u origin master
```

（需要 GitHub 身份验证，参考 `GIT_PUSH_INSTRUCTIONS.md`）

### 第二步：启用 GitHub Pages

1. **进入仓库设置**
   - 访问：https://github.com/echo-lxy/video-create
   - 点击仓库顶部的 **Settings** 标签

2. **找到 Pages 设置**
   - 在左侧菜单中找到 **Pages**
   - 点击进入 Pages 设置页面

3. **配置 Source**
   - 在 **Source** 部分
   - 选择 **GitHub Actions**（不是 "Deploy from a branch"）
   - 保存设置

4. **验证配置**
   - 设置完成后，你会看到提示：
     > "Your site is ready to be published at https://echo-lxy.github.io/video-create/"

### 第三步：触发首次部署

有两种方式触发部署：

#### 方式 1：自动触发（推荐）

当你推送代码到 `master` 分支时，GitHub Actions 会自动运行：

```bash
# 任何新的提交都会触发部署
git add .
git commit -m "Update: any changes"
git push origin master
```

#### 方式 2：手动触发

1. 进入仓库的 **Actions** 标签
2. 在左侧选择 **Deploy to GitHub Pages** 工作流
3. 点击 **Run workflow** 按钮
4. 选择分支（master）
5. 点击 **Run workflow**

### 第四步：查看部署状态

1. **查看 Actions 运行**
   - 进入仓库的 **Actions** 标签
   - 你会看到 "Deploy to GitHub Pages" 工作流正在运行
   - 点击进入查看详细日志

2. **部署过程**
   - ✅ Checkout（检出代码）
   - ✅ Setup Node.js（设置 Node.js 环境）
   - ✅ Install dependencies（安装依赖）
   - ✅ Build（构建项目）
   - ✅ Upload artifact（上传构建产物）
   - ✅ Deploy to GitHub Pages（部署到 GitHub Pages）

3. **部署完成**
   - 当所有步骤显示绿色 ✓ 时，部署完成
   - 通常需要 2-5 分钟

### 第五步：访问你的网站

部署完成后，访问：

```
https://echo-lxy.github.io/video-create/
```

---

## 🔍 工作流配置说明

### 触发条件

工作流会在以下情况自动运行：

1. **推送到 master/main 分支**
   ```yaml
   push:
     branches: [master, main]
   ```

2. **Pull Request 到 master/main**
   ```yaml
   pull_request:
     branches: [master, main]
   ```

3. **手动触发**
   ```yaml
   workflow_dispatch:
   ```

### 部署流程

```
推送代码
  ↓
GitHub Actions 自动触发
  ↓
构建项目 (npm run build)
  ↓
生成静态文件 (./out 目录)
  ↓
上传构建产物
  ↓
部署到 GitHub Pages
  ↓
网站上线 ✨
```

---

## ⚙️ 配置详情

### 需要的权限

工作流需要以下权限（已在配置中设置）：

- `contents: read` - 读取代码
- `pages: write` - 写入 GitHub Pages
- `id-token: write` - OIDC 认证

### 构建配置

- **Node.js 版本**: 20
- **构建命令**: `npm run build`
- **输出目录**: `./out`
- **环境**: `production`

---

## 🐛 常见问题

### 问题 1: Actions 没有自动运行

**原因**: 可能还没有推送代码，或者工作流文件有问题

**解决**:
1. 确认代码已推送到 GitHub
2. 检查 `.github/workflows/deploy.yml` 文件是否存在
3. 手动触发一次工作流

### 问题 2: 构建失败

**可能原因**:
- 依赖安装失败
- 构建错误
- Node.js 版本不匹配

**解决**:
1. 查看 Actions 日志中的错误信息
2. 本地测试构建：`npm run build`
3. 检查 `package.json` 中的依赖

### 问题 3: 部署成功但网站 404

**原因**: 
- GitHub Pages 还没有完全部署
- 缓存问题

**解决**:
1. 等待 2-5 分钟
2. 清除浏览器缓存
3. 检查仓库 Settings → Pages 中的 URL

### 问题 4: 网站显示旧内容

**原因**: 浏览器缓存或 CDN 缓存

**解决**:
1. 强制刷新：`Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows)
2. 等待几分钟让 CDN 更新
3. 检查 Actions 中的最新部署时间

---

## 🔄 更新部署

### 自动更新

每次推送到 `master` 分支都会自动触发新的部署：

```bash
# 修改代码
# ... 编辑文件 ...

# 提交并推送
git add .
git commit -m "Update: 描述你的更改"
git push origin master

# GitHub Actions 会自动部署 ✨
```

### 手动触发

如果需要手动触发部署：

1. 进入 **Actions** 标签
2. 选择 **Deploy to GitHub Pages**
3. 点击 **Run workflow**
4. 选择分支并运行

---

## 📊 部署状态监控

### 查看部署历史

1. 进入仓库的 **Actions** 标签
2. 查看所有工作流运行历史
3. 点击任意运行查看详细日志

### 部署状态图标

- 🟢 **绿色** - 部署成功
- 🟡 **黄色** - 正在运行
- 🔴 **红色** - 部署失败

### 部署时间

- **首次部署**: 3-5 分钟（需要安装依赖）
- **后续部署**: 2-3 分钟（依赖已缓存）

---

## ✅ 验证清单

部署完成后，检查以下内容：

- [ ] GitHub Actions 工作流运行成功（绿色 ✓）
- [ ] 网站可以访问：https://echo-lxy.github.io/video-create/
- [ ] 页面正常加载，没有 404 错误
- [ ] UI 界面显示正常
- [ ] 代码编辑器可以打开
- [ ] AI 配置界面可以访问

---

## 🎉 完成！

配置完成后，你的工作流程将是：

```
1. 本地修改代码
2. git commit && git push
3. GitHub Actions 自动构建和部署
4. 网站自动更新 ✨
```

**无需手动操作，完全自动化！**

---

## 📝 注意事项

1. **首次部署需要时间**
   - 安装依赖需要 1-2 分钟
   - 构建需要 30-60 秒
   - 部署需要 30-60 秒

2. **每次推送都会触发部署**
   - 确保代码可以正常构建
   - 避免频繁推送未完成的代码

3. **GitHub Pages 限制**
   - 免费账户：100GB 带宽/月
   - 仓库大小：1GB
   - 构建时间：无限制

4. **自定义域名**（可选）
   - 在 `public/CNAME` 文件中添加域名
   - 配置 DNS 记录指向 GitHub Pages

---

## 🔗 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [项目 README](./README.md)
- [部署检查清单](./DEPLOY_CHECKLIST.md)

---

**现在就去配置 GitHub Pages，享受自动部署的便利吧！** 🚀

