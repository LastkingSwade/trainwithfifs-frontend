'use client';

import { useEffect } from 'react';
import { installSecrets } from './index';

// Mounted once in the root layout, so the secrets work on every page, including the 404 page.
export default function Secrets() {
  useEffect(() => { installSecrets(); }, []);
  return null;
}
