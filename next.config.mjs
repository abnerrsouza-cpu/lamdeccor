/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone: build minimalista que o Railway/Docker roda direto
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  },
  // Garante que o Image Optimization aceite o domínio (caso adicione URLs externas no futuro)
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
