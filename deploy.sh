#!/bin/bash

# AI Video Code Generator - 一键部署脚本
# 此脚本将项目部署到 GitHub Pages

set -e

echo "🚀 开始部署 AI Video Code Generator..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否已经初始化 git
if [ ! -d ".git" ]; then
  echo -e "${BLUE}📦 初始化 Git 仓库...${NC}"
  git init
  git branch -M main
fi

# 添加所有文件
echo -e "${BLUE}📝 添加文件到 Git...${NC}"
git add .

# 提交
echo -e "${BLUE}💾 提交更改...${NC}"
git commit -m "Deploy: AI Video Code Generator $(date +%Y-%m-%d\ %H:%M:%S)" || echo "没有新的更改需要提交"

# 检查是否已经配置远程仓库
if ! git remote get-url origin > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  请先配置 GitHub 远程仓库：${NC}"
  echo ""
  echo "运行以下命令："
  echo -e "${GREEN}git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git${NC}"
  echo ""
  echo "然后再次运行此脚本。"
  exit 1
fi

# 推送到 GitHub
echo -e "${BLUE}🚢 推送到 GitHub...${NC}"
git push -u origin main

echo ""
echo -e "${GREEN}✅ 部署成功！${NC}"
echo ""
echo "📋 接下来的步骤："
echo ""
echo "1. 进入 GitHub 仓库设置"
echo "2. 点击 'Pages' 选项"
echo "3. Source 选择 'GitHub Actions'"
echo "4. 等待几分钟，GitHub Actions 将自动构建和部署"
echo ""
echo "🌐 你的网站将在以下地址可用："
REPO_URL=$(git remote get-url origin)
REPO_NAME=$(basename -s .git "$REPO_URL")
USERNAME=$(basename $(dirname "$REPO_URL"))
echo -e "${GREEN}https://${USERNAME}.github.io/${REPO_NAME}/${NC}"
echo ""
echo "🎉 完成！"

