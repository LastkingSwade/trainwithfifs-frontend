import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.supabase.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https: https://drive.google.com https://*.googleusercontent.com;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://licensingportal.mdsp.maryland.gov;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
  frame-ancestors 'self';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 1. Content Security Policy (Fixes Critical & High CSP findings)
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          // 2. Strict Transport Security (Fixes High "HSTS header is missing")
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // 3. Anti-clickjacking (Fixes Medium "Missing Anti-clickjacking")
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // 4. MIME sniffing protection (Fixes Low finding)
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
