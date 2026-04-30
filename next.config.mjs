/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone: build minimalista que o Railway/Docker roda direto
typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  },
  // Garante que o Image Optimization aceite o domínio (caso adicione URLs externas no futuro)
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
