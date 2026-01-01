#!/bin/bash

# 验证本地资源是否存在

echo "🔍 检查本地资源..."

# 检查 esbuild-wasm
if [ -f "public/esbuild/esbuild.wasm" ]; then
  SIZE=$(du -h public/esbuild/esbuild.wasm | cut -f1)
  echo "✅ esbuild-wasm: $SIZE"
else
  echo "❌ esbuild-wasm: 未找到"
fi

# 检查 Monaco Editor
if [ -f "public/monaco/vs/loader.js" ]; then
  SIZE=$(du -sh public/monaco | cut -f1)
  echo "✅ Monaco Editor: $SIZE"
else
  echo "❌ Monaco Editor: 未找到"
fi

echo ""
echo "💡 如果资源不存在，运行: ./scripts/download-assets.sh"

