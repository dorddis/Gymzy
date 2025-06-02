// next.config.js
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
