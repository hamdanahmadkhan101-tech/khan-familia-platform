const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@khan-familia/constants',
    '@khan-familia/sdk',
    '@khan-familia/ui',
    '@khan-familia/validation',
    '@khan-familia/types'
  ],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    return config;
  },
};

export default nextConfig;
