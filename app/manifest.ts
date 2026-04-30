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
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
  };
}
