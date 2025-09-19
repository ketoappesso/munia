const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    // App Shell - 立即从缓存提供，后台更新
    {
      urlPattern: /^https?:\/\/[^\/]+\/(_next\/static\/.+|static\/.+)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // API路由 - 网络优先，支持离线
    {
      urlPattern: /^https?:\/\/[^\/]+\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
    // 图片资源 - 缓存优先
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    // 页面路由 - 网络优先，带超时
    {
      urlPattern: /^https?:\/\/[^\/]+\/(feed|messages|notifications|discover).*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 3,
      },
    },
    // 其他请求 - 网络优先
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'general-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 5,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    scrollRestoration: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.xyuan.chat',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'appesso-s3-bucket.s3.us-east-1.amazonaws.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'xiaoyuan-chat.tos-cn-guangzhou.volces.com',
        port: '',
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
