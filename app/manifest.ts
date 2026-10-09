import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LAM Marketing Hub',
    short_name: 'LAM Hub',
    description: 'Painel interno de marketing da LAM Deccor',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FBFAF7',
    theme_color: '#0F2A4A',
    icons: [
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // 'maskable' deixa o Android recortar no formato do sistema sem
        // cortar o sofá do meio da marca
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
