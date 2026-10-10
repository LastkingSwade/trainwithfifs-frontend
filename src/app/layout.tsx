import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "../delight/delight.css";
import BootIntro from "../boot/BootIntro";
import HackDetected from "../hack/HackDetected";
import { BOOT_GATE_SCRIPT } from "../boot/bootConfig";

export const metadata: Metadata = {
  title: "Train With FIFS | Maryland Firearms Training & Concealed Carry Courses",
  description: "Premier Maryland Wear & Carry, HQL, and Concealed Carry Certification Courses with Lead Instructor Kai Wade at Cindy's Hot Shots.",
};

// Supabase recovery and invite links that land on the home page (for example when the project's Site URL
// is used as the redirect) are forwarded to /reset-password before any sign-in code reads the tokens, so
// the person can set a password instead of being signed in silently. Two link styles are forwarded, with
// the token kept in the URL: hash tokens (#access_token=...&type=recovery|invite) and a PKCE ?code=. The
// site uses no other "code" URL parameter, and the reset page shows an expired-link screen if a code
// turns out not to be a recovery code.
const recoveryRedirect = `(function(){try{var l=window.location;if(l.pathname!=='/')return;var h=l.hash||'',s=l.search||'';var hashLink=/access_token=/.test(h)&&/[#&]type=(recovery|invite)(&|$)/.test(h);var codeLink=/[?&]code=[^&]+/.test(s);if(hashLink||codeLink){l.replace('/reset-password'+(codeLink?s:'')+(hashLink?h:''));}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* A plain inline script (not next/script, which waits for the app bundle): it must run before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_GATE_SCRIPT }} />
      </head>
      <body>
        <Script id="fifs-recovery-redirect" strategy="beforeInteractive">
          {recoveryRedirect}
        </Script>
        <BootIntro />
        <HackDetected />
        {children}
      </body>
    </html>
  );
}
