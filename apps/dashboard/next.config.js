/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@codecapsule/core",
    "@codecapsule/ui", 
    "@codecapsule/database",
    "@codecapsule/integrations",
    "@codecapsule/utils"
  ],
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig