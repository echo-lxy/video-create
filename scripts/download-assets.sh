#!/bin/bash

# 下载 Monaco Editor 和 esbuild-wasm 到本地
# 这样可以避免从 CDN 下载，大幅提升加载速度

set -e

echo "🚀 开始下载资源到本地..."

# 创建目录
mkdir -p public/esbuild
mkdir -p public/monaco/vs

# 下载 esbuild-wasm
echo "📦 下载 esbuild-wasm..."
cd public/esbuild
curl -L -o esbuild.wasm https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm
echo "✅ esbuild-wasm 下载完成 (~1MB)"

# 下载 Monaco Editor（最小版本）
echo "📦 下载 Monaco Editor..."
cd ../monaco

# 创建必要的目录
mkdir -p vs/editor
mkdir -p vs/language/typescript
mkdir -p vs/base/common/worker

# 下载 Monaco Editor loader
curl -L -o vs/loader.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js

# 下载 Monaco Editor 核心文件
curl -L -o vs/editor/editor.main.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.js
curl -L -o vs/editor/editor.main.css https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.css

# 下载 TypeScript 语言服务
curl -L -o vs/language/typescript/tsWorker.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/tsWorker.js

# 下载基础语言文件
curl -L -o vs/base/common/worker/workerMain.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/common/worker/workerMain.js

echo "✅ Monaco Editor 核心文件下载完成"

cd ../../

echo ""
echo "✅ 所有资源下载完成！"
echo ""
echo "📊 文件大小："
du -sh public/esbuild
du -sh public/monaco
echo ""
echo "💡 现在资源已本地化，加载速度会快很多！"

