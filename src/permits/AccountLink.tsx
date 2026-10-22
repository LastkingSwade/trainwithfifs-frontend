'use client';

import { useEffect, useState } from 'react';
import { myFifsHref, savedPortal } from '../shell/publicNavLogic';

// "My FIFS" for pages that are not the one-page site: a known student or client goes to their own portal, anyone else to the portal chooser. It only reads the login this browser
// already keeps (never sent anywhere); the server still decides what a person can see.
export default function AccountLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const [href, setHref] = useState('/?open=student');
  useEffect(() => { try { setHref(myFifsHref(savedPortal(window.localStorage, new Date()))); } catch { /* storage blocked: the default link */ } }, []);
  return <a className={className} href={href}>{children}</a>;
}
