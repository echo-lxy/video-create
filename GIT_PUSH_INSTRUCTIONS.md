# Git 推送说明

## ✅ 已完成

- ✅ Git 仓库已初始化
- ✅ 所有文件已提交（49 个文件，17059 行代码）
- ✅ 远程仓库已配置：`https://github.com/echo-lxy/video-create.git`
- ✅ 分支已设置为 `master`

## 🔐 需要认证

推送代码到 GitHub 需要身份验证。请选择以下方式之一：

### 方式 1：使用 Personal Access Token（推荐）

1. **创建 Personal Access Token**
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token" → "Generate new token (classic)"
   - 设置名称：`video-create-push`
   - 选择权限：勾选 `repo`（完整仓库访问权限）
   - 点击 "Generate token"
   - **复制生成的 token**（只显示一次！）

2. **推送代码**
   ```bash
   cd /Users/miaomiao/MyData/demo-project/video-create-demo
   git push -u origin master
   ```
   
   当提示输入用户名时：
   - Username: `echo-lxy`
   - Password: **粘贴你的 Personal Access Token**（不是密码）

### 方式 2：使用 GitHub CLI

```bash
# 安装 GitHub CLI（如果还没有）
brew install gh

# 登录
gh auth login

# 推送
git push -u origin master
```

### 方式 3：配置 SSH 密钥

1. **生成 SSH 密钥**（如果还没有）
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **添加 SSH 密钥到 GitHub**
   ```bash
   # 复制公钥
   cat ~/.ssh/id_ed25519.pub
   ```
   
   - 访问：https://github.com/settings/keys
   - 点击 "New SSH key"
   - 粘贴公钥内容
   - 保存

3. **修改远程仓库为 SSH**
   ```bash
   cd /Users/miaomiao/MyData/demo-project/video-create-demo
   git remote set-url origin git@github.com:echo-lxy/video-create.git
   git push -u origin master
   ```

## 🚀 快速推送（使用 Token）

最简单的方式：

```bash
cd /Users/miaomiao/MyData/demo-project/video-create-demo

# 使用 token 推送（替换 YOUR_TOKEN 为你的 token）
git push https://YOUR_TOKEN@github.com/echo-lxy/video-create.git master
```

或者配置 credential helper：

```bash
# macOS 使用 Keychain
git config --global credential.helper osxkeychain

# 然后正常推送，输入一次 token 后会保存
git push -u origin master
```

## ✅ 推送成功后

推送成功后，你需要：

1. **启用 GitHub Pages**
   - 进入仓库：https://github.com/echo-lxy/video-create
   - Settings → Pages
   - Source 选择 "GitHub Actions"
   - 等待部署完成（2-5分钟）

2. **访问你的网站**
   ```
   https://echo-lxy.github.io/video-create/
   ```

## 📝 当前状态

- ✅ 本地仓库已初始化
- ✅ 代码已提交
- ✅ 远程仓库已配置
- ⏳ 等待推送认证

---

**提示**：如果遇到问题，可以查看 GitHub 文档：
- [创建 Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [配置 SSH 密钥](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

