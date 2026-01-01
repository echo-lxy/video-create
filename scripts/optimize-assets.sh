#!/bin/bash

# 深度优化资源：只下载最小必需文件，压缩资源

set -e

echo "🚀 开始深度优化资源..."

# 清理旧文件
rm -rf public/esbuild public/monaco

# 创建目录
mkdir -p public/esbuild
mkdir -p public/monaco/vs/editor
mkdir -p public/monaco/vs/language/typescript
mkdir -p public/monaco/vs/base/common/worker

echo "📦 下载 esbuild-wasm（必需）..."
cd public/esbuild
curl -L -o esbuild.wasm https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm
echo "✅ esbuild-wasm 下载完成"

echo "📦 下载 Monaco Editor（最小化版本）..."
cd ../monaco

# 只下载核心必需文件
echo "  - loader.js"
curl -L -o vs/loader.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js

echo "  - editor.main.js"
curl -L -o vs/editor/editor.main.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.js

echo "  - editor.main.css"
curl -L -o vs/editor/editor.main.css https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.css

echo "  - tsWorker.js (TypeScript 支持)"
curl -L -o vs/language/typescript/tsWorker.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/tsWorker.js

echo "  - workerMain.js"
curl -L -o vs/base/common/worker/workerMain.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/common/worker/workerMain.js

echo "  - editor.main.nls.js (国际化语言文件)"
curl -L -o vs/editor/editor.main.nls.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.nls.js

echo "  - tsMode.js (TypeScript 模式)"
curl -L -o vs/language/typescript/tsMode.js https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/tsMode.js

echo "  - codicon.ttf (图标字体)"
mkdir -p vs/base/browser/ui/codicons
curl -L -o vs/base/browser/ui/codicons/codicon.ttf https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/browser/ui/codicons/codicon.ttf

cd ../../

echo ""
echo "✅ 最小化资源下载完成！"
echo ""
echo "📊 优化后的文件大小："
du -sh public/esbuild
du -sh public/monaco
echo ""
echo "💡 只包含核心功能，大幅减少加载时间！"

