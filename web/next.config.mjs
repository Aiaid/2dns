/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add trailingSlash for better compatibility with GitHub Pages
  trailingSlash: true,
  // Ensure we're generating static HTML files for each route
  generateStaticParams: true,
}

export default nextConfig
