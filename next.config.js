/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permitir imagens base64
  images: {
    remotePatterns: [],
  },
  // Aumentar limite do body para receber fotos em base64
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Configuração para Vercel
  output: undefined,
};

module.exports = nextConfig;
