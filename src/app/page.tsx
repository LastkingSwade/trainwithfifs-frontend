import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import TrainWithFIFS from "./TrainWithFIFS";

export const metadata: Metadata = {
  title: "Train With FIFS | Maryland Firearms Training & Reciprocity Hub",
  description:
    "Official training portal for Future Initiative Firearms Solutions (FIFS), led by Instructor Kai Wade. Maryland Wear & Carry, Multi-State Concealed Carry, and Handgun Qualification License training.",
  keywords: [
    "Maryland Wear and Carry",
    "HQL",
    "Multi-State CCW",
    "Train With FIFS",
    "Kai Wade",
    "Firearms Training Maryland",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-[#030712] text-white">
      <Suspense
        fallback={
          <div className="flex h-screen w-full items-center justify-center bg-[#030712]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <p className="font-mono text-xs uppercase tracking-widest text-cyan-400/80">
                Loading FIFS Portal...
              </p>
            </div>
          </div>
        }
      >
        <TrainWithFIFS />
      </Suspense>
    </main>
  );
}