/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/video-create' : '';

const nextConfig = {
  output: 'export',
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
    // 支持 WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

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
            // Monaco Editor 单独打包
            monaco: {
              name: 'monaco',
              test: /[\\/]node_modules[\\/](monaco-editor|@monaco-editor)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
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

    // 不要在服务端打包某些模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;

