import type { MetadataRoute } from 'next';

// Makes the site installable ("Add to Home Screen" / "Install app"). Next serves this at /manifest.webmanifest and links it from every page.
// Colours match the site's dark background; the icons are made from the Future Initiative emblem (public/icons).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Train With FIFS',
    short_name: 'FIFS',
    description: 'Maryland Wear & Carry, HQL and firearms training with Lead Instructor Kai Wade. Student and client portals.',
    lang: 'en-US',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#090d16',
    theme_color: '#090d16',
    categories: ['education', 'sports'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
