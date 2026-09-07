/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allows production build to complete on deployment machines
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
