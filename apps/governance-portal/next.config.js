/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@deck.gl/core',
      '@deck.gl/layers',
      '@deck.gl/react',
      '@deck.gl/widgets',
      '@apollo/client',
      'zustand',
    ],
  },
  // Proxy all /api/v1/* and /graphql requests to the Node.js backend.
  // This avoids CORS during development and keeps relative URLs working.
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/graphql', '') || 'https://smart-health-supply-chain-resilience-production.up.railway.app';
    return [
      { source: '/graphql',       destination: `${backendUrl}/graphql` },
      { source: '/api/v1/:path*', destination: `${backendUrl}/api/v1/:path*` },
    ];
  },
};

module.exports = nextConfig;
