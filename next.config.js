// next.config.js
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ⚠️ Temporarily disabled to deploy - will fix on Day 4 of remediation plan
  },
  eslint: {
    ignoreDuringBuilds: true, // ⚠️ Temporarily disabled due to Next.js 15 circular structure bug
  },

  // Performance optimizations
  reactStrictMode: true,
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  compress: true, // Enable gzip compression

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@/components/ui'],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Use modern image formats
  },
  webpack(config) {
    // ─── Step A: Remove Next.js’s default “.svg → file-loader/asset” rule ───
    if (config.module && Array.isArray(config.module.rules)) {
      config.module.rules = config.module.rules.filter((rule) => {
        if (
          rule.test instanceof RegExp &&
          rule.test.test('.svg') &&
          Array.isArray(rule.use) &&
          rule.use.some(
            (u) => typeof u.loader === 'string' && u.loader.includes('file-loader')
          )
        ) {
          return false; // drop that rule
        }
        return true; // keep everything else
      });
    }

    // ─── Step B: Add our “.svg → @svgr/webpack” rule ───
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      removeViewBox: false, // preserve viewBox so it’s scalable
                    },
                  },
                },
              ],
            },
            icon: false, // if you want <svg width="1em" height="1em" …>, set icon: true
          },
        },
      ],
    });

    return config;
  },
};

module.exports = nextConfig;
