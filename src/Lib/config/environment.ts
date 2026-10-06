// Deployment-environment and public service configuration (browser-safe).
//
// Production values may only be used when the deployment is positively identified as Production.
// Every other environment (Vercel Preview/Development, local dev, tests) must supply its own
// configuration and fails closed when it is missing or points at Production services.
//
// This module never reads server-only secrets and never includes configuration values in errors.

export const PRODUCTION_SUPABASE_PROJECT_REF = 'ufqnmcincwnlyiwsmzcq';
export const PRODUCTION_SUPABASE_URL = `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`;
export const PRODUCTION_SITE_URL = 'https://trainwithfifs.com';
const PRODUCTION_SITE_HOSTS = ['trainwithfifs.com', 'www.trainwithfifs.com'];

export type DeploymentEnvironment = 'production' | 'non-production';

/** Configuration problem. Messages name variables only, never their values. */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Production only when Vercel identifies this deployment as Production.
 * - Server runtime: Vercel's VERCEL_ENV.
 * - Browser (and any runtime without VERCEL_ENV): NEXT_PUBLIC_FIFS_DEPLOYMENT_ENV, which
 *   next.config.ts derives from VERCEL_ENV at build time (it cannot be overridden by a variable).
 * Anything else, including an unset value, is non-production.
 */
export function getDeploymentEnvironment(): DeploymentEnvironment {
  const vercelEnv = typeof process !== 'undefined' ? process.env.VERCEL_ENV : undefined;
  if (vercelEnv) return vercelEnv === 'production' ? 'production' : 'non-production';
  return process.env.NEXT_PUBLIC_FIFS_DEPLOYMENT_ENV === 'production' ? 'production' : 'non-production';
}

export function isProductionDeployment(): boolean {
  return getDeploymentEnvironment() === 'production';
}

/** Supabase project ref from a *.supabase.co URL, or null for other hosts (custom/local). */
export function supabaseProjectRefFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const match = /^([a-z0-9]+)\.supabase\.(co|in)$/.exec(host);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export interface SupabaseKeyInfo {
  format: 'jwt' | 'publishable' | 'secret' | 'unknown';
  role?: string;
  ref?: string;
}

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  if (typeof atob === 'function') return atob(padded);
  return Buffer.from(padded, 'base64').toString('binary');
}

/** Reads only the non-secret claims (role, project ref) of a Supabase key. */
export function inspectSupabaseKey(key: string): SupabaseKeyInfo {
  if (key.startsWith('sb_publishable_')) return { format: 'publishable' };
  if (key.startsWith('sb_secret_')) return { format: 'secret', role: 'service_role' };
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const claims = JSON.parse(decodeBase64Url(parts[1]));
      return {
        format: 'jwt',
        role: typeof claims.role === 'string' ? claims.role : undefined,
        ref: typeof claims.ref === 'string' ? claims.ref : undefined
      };
    } catch {
      return { format: 'unknown' };
    }
  }
  return { format: 'unknown' };
}

function isServiceRoleKey(info: SupabaseKeyInfo): boolean {
  return info.format === 'secret' || info.role === 'service_role';
}

/**
 * Non-production pairing rules for a Supabase key and URL: never a Production key, and a key
 * that carries a project ref must belong to the configured project.
 */
export function assertNonProductionSupabaseKey(info: SupabaseKeyInfo, url: string, variableName: string) {
  if (info.ref === PRODUCTION_SUPABASE_PROJECT_REF) {
    throw new ConfigurationError(`${variableName} belongs to the Production Supabase project and cannot be used outside Production.`);
  }
  const urlRef = supabaseProjectRefFromUrl(url);
  if (info.ref && urlRef && info.ref !== urlRef) {
    throw new ConfigurationError(`${variableName} belongs to a different Supabase project than NEXT_PUBLIC_SUPABASE_URL.`);
  }
}

/** Validates a non-production Supabase URL: present, http(s), and not the Production project. */
export function assertNonProductionSupabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new ConfigurationError('NEXT_PUBLIC_SUPABASE_URL is required outside Production (no Production fallback is used).');
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ConfigurationError('NEXT_PUBLIC_SUPABASE_URL is not a valid URL.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new ConfigurationError('NEXT_PUBLIC_SUPABASE_URL must use http or https.');
  }
  if (supabaseProjectRefFromUrl(url) === PRODUCTION_SUPABASE_PROJECT_REF) {
    throw new ConfigurationError('NEXT_PUBLIC_SUPABASE_URL points to the Production Supabase project and cannot be used outside Production.');
  }
  return url;
}

export interface PublicSupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Supabase project URL.
 * Production: NEXT_PUBLIC_SUPABASE_URL, then the server alias SUPABASE_URL, then the Production URL
 * (existing Production behavior). Elsewhere: only NEXT_PUBLIC_SUPABASE_URL, and never Production.
 */
export function resolveSupabaseUrl(serverAliasUrl?: string): string {
  // Literal process.env.NEXT_PUBLIC_* reference so Next.js inlines it into browser bundles.
  const canonicalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (isProductionDeployment()) return canonicalUrl || serverAliasUrl || PRODUCTION_SUPABASE_URL;
  return assertNonProductionSupabaseUrl(canonicalUrl);
}

/**
 * Public Supabase URL and anon key for browser and server clients.
 *
 * `serverAliases` lets server code pass legacy alias variables (SUPABASE_URL, SUPABASE_ANON_KEY);
 * they are honored only in Production, preserving existing Production behavior. Outside
 * Production only the canonical NEXT_PUBLIC_* variables are accepted.
 */
export function resolvePublicSupabaseConfig(serverAliases?: { url?: string; anonKey?: string }): PublicSupabaseConfig {
  // Literal process.env.NEXT_PUBLIC_* reference so Next.js inlines it into browser bundles.
  const canonicalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = resolveSupabaseUrl(serverAliases?.url);

  if (isProductionDeployment()) {
    const anonKey = canonicalAnonKey || serverAliases?.anonKey;
    if (!anonKey) {
      throw new ConfigurationError('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.');
    }
    if (isServiceRoleKey(inspectSupabaseKey(anonKey))) {
      throw new ConfigurationError('NEXT_PUBLIC_SUPABASE_ANON_KEY must be a public anon/publishable key, never a service-role key.');
    }
    return { url, anonKey };
  }

  if (!canonicalAnonKey) {
    throw new ConfigurationError('NEXT_PUBLIC_SUPABASE_ANON_KEY is required outside Production (no Production fallback is used).');
  }
  const info = inspectSupabaseKey(canonicalAnonKey);
  if (isServiceRoleKey(info)) {
    throw new ConfigurationError('NEXT_PUBLIC_SUPABASE_ANON_KEY must be a public anon/publishable key, never a service-role key.');
  }
  assertNonProductionSupabaseKey(info, url, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return { url, anonKey: canonicalAnonKey };
}

/**
 * Public site origin used for Stripe return URLs and account-setup links.
 * Production: NEXT_PUBLIC_SITE_URL or the Production site. Elsewhere: NEXT_PUBLIC_SITE_URL is
 * required and must not be the Production site.
 */
export function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (isProductionDeployment()) {
    try {
      const url = new URL(configured || PRODUCTION_SITE_URL);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.origin;
    } catch {}
    return PRODUCTION_SITE_URL;
  }

  if (!configured) {
    throw new ConfigurationError('NEXT_PUBLIC_SITE_URL is required outside Production (no Production fallback is used).');
  }
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new ConfigurationError('NEXT_PUBLIC_SITE_URL is not a valid URL.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new ConfigurationError('NEXT_PUBLIC_SITE_URL must use http or https.');
  }
  if (PRODUCTION_SITE_HOSTS.includes(url.hostname.toLowerCase())) {
    throw new ConfigurationError('NEXT_PUBLIC_SITE_URL points to the Production site and cannot be used outside Production.');
  }
  return url.origin;
}
