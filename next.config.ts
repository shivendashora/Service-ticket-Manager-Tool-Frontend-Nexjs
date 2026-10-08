import type { NextConfig } from 'next';

// The browser calls /api/... on this app's own domain and Next forwards the request to the
// backend (FastAPI or Flask, picked with BACKEND_URL in .env). Because the browser only ever
// talks to one origin, the backend's httpOnly auth cookie is first-party, both locally and
// when deployed, so no cross-site cookie or CORS setup is needed.
const backendUrl = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
