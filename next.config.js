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
  webpack: (config, { isServer }) => {
    // 支持 WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

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

