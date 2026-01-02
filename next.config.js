/** @type {import('next').NextConfig} */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/video-create' : '';

const nextConfig = {
  // 移除 output: 'export' 以支持 API 路由
  // output: 'export', // 注释掉，因为 AI 功能需要 API 路由
  basePath: basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  trailingSlash: true,
  // 压缩配置
  compress: true,
  // 优化生产构建
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer, dev }) => {
    // 禁用 source map（减少警告）
    if (!isServer) {
      config.devtool = false;
    }
    
    // 支持 WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // 只在客户端打包 Monaco Editor（使用 webpack 插件自动处理）
    if (!isServer) {
      // 添加 Monaco Editor Webpack Plugin（自动处理所有资源）
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ['typescript', 'javascript'],
          // 自定义 publicPath（适配 GitHub Pages basePath）
          publicPath: basePath || '/',
        })
      );

      // 不要在服务端打包某些模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // 生产环境优化
    if (!isServer && !dev) {
      // 代码分割优化
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // esbuild 单独打包
            esbuild: {
              name: 'esbuild',
              test: /[\\/]node_modules[\\/]esbuild-wasm[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;

