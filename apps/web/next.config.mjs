const cloudName = process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'];
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@khan-familia/constants',
    '@khan-familia/sdk',
    '@khan-familia/ui',
    '@khan-familia/validation',
    '@khan-familia/types',
  ],
  images: {
    remotePatterns: [
      ...(cloudName && /^[a-zA-Z0-9_-]+$/.test(cloudName)
        ? [
            {
              protocol: 'https',
              hostname: 'res.cloudinary.com',
              port: '',
              pathname: `/${cloudName}/image/upload/**`,
              search: '',
            },
          ]
        : []),
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
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
