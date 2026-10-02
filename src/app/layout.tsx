import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trainwithfifs.com"),
  title: "TrainwithFIFS.com Future Initiative Firearm Services",
  description: "Maryland firearms training platform designed to build knowledge, safety, and confidence without intimidation. State-approved HQL, Wear & Carry, and private coaching with Lead Instructor Kai Wade.",
  openGraph: {
    title: "TrainwithFIFS.com Future Initiative Firearm Services",
    description: "Maryland firearms training, HQL, Wear & Carry, and private coaching.",
    url: "https://trainwithfifs.com",
    siteName: "Train With FIFS",
    images: [{ url: "/icon.ico", alt: "Train With FIFS site icon" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TrainwithFIFS.com Future Initiative Firearm Services",
    description: "Maryland firearms training, HQL, Wear & Carry, and private coaching.",
    images: ["/icon.ico"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
