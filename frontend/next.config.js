/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['pt-BR', 'en-US', 'es-ES'],
    defaultLocale: 'pt-BR'
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    dirs: ['src']
  }
};

module.exports = nextConfig;
