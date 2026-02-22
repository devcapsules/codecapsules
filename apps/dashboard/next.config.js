/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Enable static export for Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  
  transpilePackages: [
    "@codecapsule/core",
    "@codecapsule/ui", 
    "@codecapsule/database",
    "@codecapsule/utils"
  ],
  
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    API_BASE_URL: process.env.API_BASE_URL || 'https://devcapsules-api.devleep-edu.workers.dev',
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  webpack: (config) => {
    // Force all packages to use the dashboard's single copy of React
    // Prevents duplicate React instances from pnpm hoisting
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    }
    return config
  },

}

module.exports = nextConfig