import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Geist, Geist_Mono, Rajdhani } from "next/font/google";
import "../noir/noir.css";
import "./globals.css";
import "../delight/delight.css";
import BootIntro from "../boot/BootIntro";
import HackDetected from "../hack/HackDetected";
import LetterScramble from "../scramble/LetterScramble";
import GroupCodePanel from "../group/GroupCodePanel";
import GroupStatusPanel from "../group/GroupStatusPanel";
import OnlineAdminPanel from "../online/OnlineAdminPanel";
import AdminPaymentsPanel from "../portal/AdminPaymentsPanel";
import AdminMultiStatePanel from "../multistate/AdminMultiStatePanel";
import AdminTrashPanel from "../portal/AdminTrashPanel";
import AdminPushPanel from "../portal/AdminPushPanel";
import WalletPanel from "../portal/WalletPanel";
import RangeJournalPanel from "../portal/RangeJournalPanel";
import ArmoryPanel from "../portal/ArmoryPanel";
import AiGuidePanel from "../portal/AiGuidePanel";
import PublicNav from "../shell/PublicNav";
import NoirMoments from "../noir/NoirMoments";
import VisitBeacon from "../analytics/VisitBeacon";
import ServiceWorkerRegister from "../pwa/ServiceWorkerRegister";
import RestoreSession from "../portal/RestoreSession";
import "../polish/polish.css";
import "../experiments/site.css";
import "../experiments/portals.css";
import "../portal/waiverCard.css";
import "../secrets/secrets.css";
import "../design/organic.css";
import OrganicSkin from "../design/OrganicSkin";
import Secrets from "../secrets/Secrets";
import { BOOT_GATE_SCRIPT } from "../boot/bootConfig";
import { STARTUP_IMAGES } from "../pwa/splash";

// Fonts are downloaded once at build time and served from this site (no request to Google when someone visits, and they work offline).
// Rajdhani gives headings and tactical labels their HUD character; Geist is the calm body face; Geist Mono is for numbers and codes.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-rajdhani", display: "swap" });
// NOIR display font: used only when the NOIR flag is on (see src/noir/noir.css). Loaded at build time, not from a third-party script.
const noirDisplay = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-noir-display", display: "swap" });

export const metadata: Metadata = {
  title: "Train With FIFS | Maryland Firearms Training & Concealed Carry Courses",
  description: "Premier Maryland Wear & Carry, HQL, and Concealed Carry Certification Courses with Lead Instructor Kai Wade at Cindy's Hot Shots.",
  // Home-screen install on iPhone/iPad: its own icon and a short name. The status bar stays solid black so the page is never drawn underneath it.
  appleWebApp: { capable: true, title: "FIFS", statusBarStyle: "black", startupImage: STARTUP_IMAGES },
  icons: { apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
};

// The browser bar and the installed app's title bar use the site's dark background colour.
export const viewport: Viewport = { themeColor: "#090d16" };

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
    <html lang="en" data-noir={process.env.NEXT_PUBLIC_NOIR === "on" ? "on" : "off"} className={`${geist.variable} ${geistMono.variable} ${rajdhani.variable} ${noirDisplay.variable}`}>
      <head>
        {/* A plain inline script (not next/script, which waits for the app bundle): it must run before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_GATE_SCRIPT }} />
        {/* Wide screens start loading the wide hero picture right away (phones never download it). */}
        <link rel="preload" as="image" href="/hero/fifs-hero-wide.webp" media="(min-width: 900px)" />
      </head>
      <body>
        <Script id="fifs-recovery-redirect" strategy="beforeInteractive">
          {recoveryRedirect}
        </Script>
        <BootIntro />
        <HackDetected />
        <LetterScramble />
        <GroupCodePanel />
        <GroupStatusPanel />
        <OnlineAdminPanel />
        <AdminPaymentsPanel />
        <AdminMultiStatePanel />
        <AdminTrashPanel />
        <AdminPushPanel />
        <WalletPanel />
        <RangeJournalPanel />
        <ArmoryPanel />
        <AiGuidePanel />
        <PublicNav />
        {process.env.NEXT_PUBLIC_NOIR === "on" && <NoirMoments />}
        <Secrets />
        <OrganicSkin />
        <ServiceWorkerRegister />
        <VisitBeacon />
        {children}
        <RestoreSession />
      </body>
    </html>
  );
}
