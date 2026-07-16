import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

type ImageRemotePattern = {
  protocol: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname: string;
};

function remotePatternFromUrl(baseUrl: string): ImageRemotePattern | null {
  try {
    const url = new URL(baseUrl);
    return {
      protocol: url.protocol === 'https:' ? 'https' : 'http',
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: '/**',
    };
  } catch {
    return null;
  }
}

const storageImagePatterns = (): ImageRemotePattern[] => {
  const patterns: ImageRemotePattern[] = [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '9000',
      pathname: '/**',
    },
    {
      protocol: 'http',
      hostname: '127.0.0.1',
      port: '9000',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: '**.s3.nl-ams.scw.cloud',
      pathname: '/**',
    },
  ];

  const fromEnv = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL
    ? remotePatternFromUrl(process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL)
    : null;

  if (fromEnv) {
    patterns.push(fromEnv);
  }

  return patterns;
};

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // Next.js 16 blocks localhost/private IPs in the image optimizer (SSRF protection).
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    remotePatterns: storageImagePatterns(),
  },
};

export default withNextIntl(nextConfig);
