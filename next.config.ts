import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https: https://drive.google.com https://*.googleusercontent.com;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://licensingportal.mdsp.maryland.gov https://script.google.com https://script.googleusercontent.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
  frame-ancestors 'self';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

// This is the only Next.js config file: next.config.js would take precedence over it
// (Next checks next.config.js, then .mjs, then .ts) and silently drop these headers.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Deployment environment for browser code, fixed at build time from Vercel's VERCEL_ENV.
  // Only a Vercel Production build is "production"; Preview, development, local, and test builds
  // are non-production and must not use Production services (see src/Lib/config/environment.ts).
  // Defined here so it cannot be overridden by an environment variable of the same name.
  env: {
    NEXT_PUBLIC_FIFS_DEPLOYMENT_ENV: process.env.VERCEL_ENV === 'production' ? 'production' : 'non-production',
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 1. Content Security Policy
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          // 2. Strict Transport Security
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // 3. Anti-clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // 4. MIME sniffing protection
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // 5. Referrer Policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 6. Permissions Policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
