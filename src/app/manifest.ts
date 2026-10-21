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
    // Long-press the installed icon: jump straight to booking or to a portal (the portal opens the person's own dashboard if they are signed in, the sign-in if not).
    shortcuts: [
      { name: 'Book a class', short_name: 'Book', description: 'Pick a class and a date', url: '/#enrollment', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Student Portal', short_name: 'Student', description: 'Your class, checklist and receipts', url: '/?open=student', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Client Portal', short_name: 'Client', description: 'Your permit, vault and renewal', url: '/?open=client', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
    ],
    // Pictures for the richer install sheet on Android and desktop Chrome.
    screenshots: [
      { src: '/pwa/screenshot-wide.webp', sizes: '1280x720', type: 'image/webp', form_factor: 'wide', label: 'Train With FIFS home page' },
      { src: '/pwa/screenshot-narrow.webp', sizes: '390x844', type: 'image/webp', form_factor: 'narrow', label: 'Train With FIFS on a phone' },
    ],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
