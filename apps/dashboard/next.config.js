/** @type {import('next').NextConfig} */
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
    "@codecapsule/integrations",
    "@codecapsule/utils"
  ],
  
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    API_BASE_URL: process.env.API_BASE_URL || 'https://q0qr0uqja7.execute-api.us-east-1.amazonaws.com/dev',
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  

}

module.exports = nextConfig