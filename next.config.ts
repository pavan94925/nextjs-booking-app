/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      tls: false,
      net: false,
      crypto: false,
      os: false,
      path: false,
      stream: false,
      perf_hooks: false
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['postgres']
  }
};

module.exports = nextConfig;