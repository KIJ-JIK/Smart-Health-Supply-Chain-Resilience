/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy all /api/v1/* and /graphql requests to the Node.js backend.
  // This avoids CORS during development and keeps relative URLs working.
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/graphql', '') || 'http://localhost:8000';
    return [
      { source: '/graphql',       destination: `${backendUrl}/graphql` },
      { source: '/api/v1/:path*', destination: `${backendUrl}/api/v1/:path*` },
    ];
  },
};

module.exports = nextConfig;
