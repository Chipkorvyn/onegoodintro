/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    eslint: {
      ignoreDuringBuilds: true,
    }
  }
}

module.exports = nextConfig