import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [], // Add your specific origins if needed, or leave empty for same-origin
    },
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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Add other hostnames if Facebook Ad images are directly linked and need optimization via next/image
      // For example, if Facebook CDN images are used:
      // {
      //   protocol: 'https',
      //   hostname: 'scontent.xx.fbcdn.net', // Example Facebook CDN hostname
      //   port: '',
      //   pathname: '/**',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'external.xx.fbcdn.net', // Another example
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
};

export default nextConfig;
