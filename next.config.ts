import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['sharp'],
  // Disable file system caching to prevent permission issues
  experimental: {
    webpackBuildWorker: false,
  },
  webpack: (config, { isServer }) => {
    // Exclude problematic directories from webpack scanning
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/Application Data/**',
        '**/AppData/**',
        '**/Local Settings/**',
        '**/My Documents/**',
        '**/Desktop/**',
        '**/Downloads/**',
        '**/Pictures/**',
        '**/Videos/**',
        '**/Music/**',
        '**/Users/**/Application Data/**',
        '**/Users/**/AppData/**',
        '**/Users/**/Local Settings/**',
        '**/Users/**/Cookies/**',
        '**/Users/**/NTUSER.DAT*',
        '**/Users/**/ntuser.dat*',
      ],
    };
    
    // Disable file system caching
    config.cache = false;
    
    return config;
  },
};

export default withPayload(nextConfig);
