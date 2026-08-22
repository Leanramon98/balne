import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:4000', '127.0.0.1:4000', 'localhost:3000', '127.0.0.1:3000'],
    },
  },
  // No rewrites needed — BFF proxy catches /api/* via app/api/[...path]/route.ts
};

export default withNextIntl(nextConfig);
