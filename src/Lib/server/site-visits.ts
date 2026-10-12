// Site visits: one row per page load (a hard refresh counts again), plus a throttled Discord ping. Privacy first: no IP address, no email, no query string
// and no full referrer is ever stored or sent. A visit is recognised only by a one-way hash of (IP + browser + today's date + a server secret), so it cannot be
// followed across days and cannot be turned back into an IP. The Discord ping carries only a rough place (from Vercel's own headers), the device, the page
// and the site the visitor came from.
import { createHmac } from 'crypto';

export type Device = 'Mobile Phone' | 'Tablet / iPad' | 'Desktop / Laptop' | 'Handheld PC';
export const DEVICES: readonly Device[] = ['Mobile Phone', 'Tablet / iPad', 'Desktop / Laptop', 'Handheld PC'];
export interface VisitRow { visitor_hash: string | null; device: Device; browser: string; os: string; path: string; referrer_host: string | null; country: string | null; region: string | null; city: string | null }

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pagespeed|monitor|uptime|pingdom|curl|wget|python-requests|axios|node-fetch|go-http|java\/|scrapy|vercel-screenshot|gtmetrix|chrome-lighthouse|google-extended|googleother|gemini/i;
export const isBot = (ua: unknown): boolean => { const s = String(ua || ''); return !s || s.length > 400 || BOT.test(s); };

export function classifyDevice(ua: unknown, width: unknown, touch: unknown): Device {
  const s = String(ua || ''); const w = Number(width) || 0;
  if (/Steam ?Deck|ROG Ally|Legion Go|AYANEO/i.test(s)) return 'Handheld PC';
  if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(s)) return 'Tablet / iPad';
  if (/iPhone|iPod|Android.*Mobile|Mobile|Windows Phone/i.test(s)) return 'Mobile Phone';
  if (/Macintosh/.test(s) && touch === true && w > 0 && w <= 1366) return 'Tablet / iPad'; // iPadOS pretends to be a Mac
  if (w > 0 && w <= 768 && touch === true) return 'Mobile Phone';
  if (w > 0 && w <= 1024 && touch === true) return 'Tablet / iPad';
  return 'Desktop / Laptop';
}

export function parseAgent(ua: unknown): { browser: string; os: string } {
  const s = String(ua || '');
  const browser = /Edg\//.test(s) ? 'Edge' : /OPR\/|Opera/.test(s) ? 'Opera' : /SamsungBrowser/.test(s) ? 'Samsung Internet' : /Firefox\/|FxiOS/.test(s) ? 'Firefox' : /Chrome\/|CriOS/.test(s) ? 'Chrome' : /Safari\//.test(s) ? 'Safari' : 'Other';
  const os = /Windows/.test(s) ? 'Windows' : /iPhone|iPad|iPod/.test(s) ? 'iOS' : /Android/.test(s) ? 'Android' : /Mac OS X|Macintosh/.test(s) ? 'macOS' : /CrOS/.test(s) ? 'ChromeOS' : /Linux/.test(s) ? 'Linux' : 'Other';
  return { browser, os };
}

/** Pathname only (never a query string or #fragment, which can carry tokens), a sane length, no control characters. */
export function cleanPath(p: unknown): string | null {
  const s = String(p ?? '').split(/[?#]/)[0].trim();
  if (!s.startsWith('/') || s.length > 120 || /[\u0000-\u001f\u007f\s<>"'\\]/.test(s) || s.startsWith('//')) return null;
  return s;
}
/** A bare hostname from the visitor's referrer ("google.com"), nothing else. */
export function cleanHost(h: unknown): string | null {
  const s = String(h ?? '').trim().toLowerCase();
  return /^[a-z0-9]([a-z0-9.-]{0,78}[a-z0-9])?$/.test(s) && s.includes('.') ? s : null;
}
const clean = (v: unknown, max: number): string | null => { const s = String(v ?? '').trim(); if (!s) return null; let d = s; try { d = decodeURIComponent(s); } catch { /* keep the raw text */ } return d.replace(/[\u0000-\u001f\u007f<>`]/g, '').slice(0, max) || null; };
export const placeFrom = (country: unknown, region: unknown, city: unknown) => ({ country: clean(country, 2), region: clean(region, 40), city: clean(city, 60) });

export function visitorHash(ip: unknown, ua: unknown, now: Date, secret: string): string | null {
  if (!secret || secret.length < 8) return null; // no secret, no hash (a bare hash of an IP could be reversed)
  const day = now.toISOString().slice(0, 10);
  return createHmac('sha256', secret).update(`${String(ip || '')}|${String(ua || '')}|${day}`).digest('hex').slice(0, 16);
}

// ---- Throttles (per server instance, in memory). Counting a visit is cheap; the Discord ping is the thing that must not turn into a flood. ----
export interface ThrottleState { seen: Map<string, number>; pings: number[]; rate: Map<string, number[]> }
export const newThrottle = (): ThrottleState => ({ seen: new Map(), pings: [], rate: new Map() });
export const PING_EVERY_MS = 30 * 60 * 1000, PING_WINDOW_MS = 10 * 60 * 1000, PING_MAX_PER_WINDOW = 20, RATE_WINDOW_MS = 60 * 1000, RATE_MAX = 40;

/** Visits per minute from one visitor beyond a real person's pace are ignored entirely (a refresh loop or a script). */
export function allowVisit(key: string, now: number, st: ThrottleState): boolean {
  const k = key || 'anon'; const arr = (st.rate.get(k) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) { st.rate.set(k, arr); return false; }
  arr.push(now); st.rate.set(k, arr);
  if (st.rate.size > 5000) st.rate.forEach((v, kk) => { if (!v.some((t) => now - t < RATE_WINDOW_MS)) st.rate.delete(kk); });
  return true;
}
/** One ping per visitor per 30 minutes, and never more than 20 pings per 10 minutes overall. */
export function shouldPing(key: string | null, now: number, st: ThrottleState): boolean {
  st.pings = st.pings.filter((t) => now - t < PING_WINDOW_MS);
  if (st.pings.length >= PING_MAX_PER_WINDOW) return false;
  if (key) { const last = st.seen.get(key); if (last !== undefined && now - last < PING_EVERY_MS) return false; st.seen.set(key, now); if (st.seen.size > 5000) st.seen.forEach((t, k) => { if (now - t > PING_EVERY_MS) st.seen.delete(k); }); }
  st.pings.push(now); return true;
}

const ICON: Record<Device, string> = { 'Mobile Phone': '📱', 'Tablet / iPad': '📲', 'Desktop / Laptop': '💻', 'Handheld PC': '🎮' };
export function discordFor(v: VisitRow): { title: string; description: string; fields: { name: string; value: string; inline?: boolean }[] } {
  const place = [v.city, v.region, v.country].filter(Boolean).join(', ') || 'Location unknown';
  return {
    title: '🌐 Someone is visiting trainwithfifs.com',
    description: `${ICON[v.device]} ${v.device} · ${v.browser} on ${v.os}`,
    fields: [
      { name: '📍 Where', value: place, inline: true },
      { name: '📄 Page', value: v.path, inline: true },
      { name: '🔗 Came from', value: v.referrer_host || 'Direct (typed, bookmark or app)', inline: true },
    ],
  };
}

export function buildRow(input: { ua: unknown; ip: unknown; body: any; geo: { country?: unknown; region?: unknown; city?: unknown }; now: Date; secret: string }): VisitRow | null {
  const path = cleanPath(input.body && input.body.p); if (!path || path.startsWith('/api')) return null;
  const { browser, os } = parseAgent(input.ua); const place = placeFrom(input.geo.country, input.geo.region, input.geo.city);
  return { visitor_hash: visitorHash(input.ip, input.ua, input.now, input.secret), device: classifyDevice(input.ua, input.body && input.body.w, input.body && input.body.t === true), browser, os, path, referrer_host: cleanHost(input.body && input.body.r), ...place };
}

// ---- Admin telemetry numbers, from the last 30 days of rows ----
export interface Telemetry { ready: true; visits30: number; visitsAll: number; unique30: number; devices: Record<Device, number>; recent: { at: string; device: Device; browser: string; os: string; place: string; path: string; from: string }[] }
export function aggregate(rows: any[], visitsAll: number): Telemetry {
  const devices: Record<Device, number> = { 'Mobile Phone': 0, 'Tablet / iPad': 0, 'Desktop / Laptop': 0, 'Handheld PC': 0 }; const uniq = new Set<string>();
  for (const r of rows) { if (r && (DEVICES as readonly string[]).includes(r.device)) devices[r.device as Device] += 1; if (r && r.visitor_hash) uniq.add(`${String(r.created_at || '').slice(0, 10)}|${r.visitor_hash}`); }
  const recent = rows.slice(0, 15).map((r) => ({ at: String(r.created_at || ''), device: r.device, browser: String(r.browser || ''), os: String(r.os || ''), place: [r.city, r.region, r.country].filter(Boolean).join(', ') || 'Unknown', path: String(r.path || '/'), from: r.referrer_host || 'Direct' }));
  return { ready: true, visits30: rows.length, visitsAll: Math.max(visitsAll || 0, rows.length), unique30: uniq.size, devices, recent };
}
