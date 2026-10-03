import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Train With FIFS | Maryland Firearms Training & Concealed Carry Courses",
  description: "Premier Maryland Wear & Carry, HQL, and Concealed Carry Certification Courses with Lead Instructor Kai Wade at Cindy's Hot Shots.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
