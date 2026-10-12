// The sign-in form inside the header profile menu (drawn by headerProfile.ts when nobody is signed in). One email and one password: the right portal opens by
// itself (see unifiedSignIn.ts for the rules). Text is set with textContent only; the password is never stored or logged and is cleared as soon as it is handed over.
import { HANDOFF, MSG, signInAndRoute, validateInput, type Deps } from './unifiedSignIn';
import { isPlausibleEmail, requestPasswordReset } from '@/Lib/auth/password-reset';
import { createRecoveryClient } from '@/Lib/supabase/recovery-client';

const w: any = typeof window === 'undefined' ? {} : window;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

function liveClient(): any { return w.supabaseClient || (typeof w.createSupabaseClient === 'function' ? w.createSupabaseClient() : null); }
export function liveDeps(): Deps {
  return {
    signIn: async (email, password) => {
      const c = liveClient(); if (!c || !c.auth) throw new Error('unavailable');
      const r = await c.auth.signInWithPassword({ email, password });
      if (r && r.error && /fetch|network|failed to/i.test(String(r.error.message || ''))) throw new Error('network');
      return r && !r.error && r.data && r.data.session ? r.data.session : null;
    },
    fetchPortal: async (portal, token) => {
      const res = await fetch('/api/fifs', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ action: portal === 'student' ? 'getStudentPortalData' : 'getClientPortalData' }) });
      let body: any = null; try { body = await res.json(); } catch { /* not JSON */ }
      return { status: res.status, body };
    },
    signOutLocal: async () => { const c = liveClient(); if (c && c.auth) await c.auth.signOut({ scope: 'local' }); },
  };
}

/** Hand over to the portal's own sign-in so all of its rules still apply, then clear what was typed. */
export function handOff(portal: 'student' | 'client' | 'staff', email: string, password: string): void {
  const h = HANDOFF[portal]; const e = document.getElementById(h.email) as HTMLInputElement | null; const p = document.getElementById(h.password) as HTMLInputElement | null;
  if (e) e.value = email; if (p) p.value = password;
  if (typeof w.openAndSwitch === 'function') w.openAndSwitch(h.tab);
  const run = w[h.run]; if (typeof run === 'function') run();
  window.setTimeout(() => { if (p) p.value = ''; }, 2500);
}

export function renderSignInPanel(menu: HTMLElement, close: () => void, done: () => void): HTMLElement | null {
  menu.textContent = '';
  const head = el('div', 'hb-head'); head.setAttribute('role', 'none');
  const av = el('span', 'hb-avatar', '👤'); av.setAttribute('aria-hidden', 'true');
  const who = el('span', 'hb-who'); who.append(el('strong', undefined, 'Sign in'), el('span', 'hb-portal', 'One sign-in. We open the right portal for you.'));
  head.append(av, who); menu.appendChild(head);

  const form = el('form', 'hb-form'); form.noValidate = true;
  const eLabel = el('label', 'hb-label', 'Email address'); eLabel.htmlFor = 'hbSignInEmail';
  const email = el('input', 'hb-input'); email.id = 'hbSignInEmail'; email.type = 'email'; email.autocomplete = 'username'; email.inputMode = 'email'; email.placeholder = 'you@example.com'; email.maxLength = 120;
  const pLabel = el('label', 'hb-label', 'Password'); pLabel.htmlFor = 'hbSignInPassword';
  const pRow = el('div', 'hb-passrow');
  const pass = el('input', 'hb-input'); pass.id = 'hbSignInPassword'; pass.type = 'password'; pass.autocomplete = 'current-password'; pass.maxLength = 200;
  const show = el('button', 'hb-show', 'Show'); show.type = 'button'; show.setAttribute('aria-pressed', 'false'); show.setAttribute('aria-label', 'Show password');
  show.addEventListener('click', () => { const on = pass.type === 'password'; pass.type = on ? 'text' : 'password'; show.textContent = on ? 'Hide' : 'Show'; show.setAttribute('aria-pressed', String(on)); show.setAttribute('aria-label', on ? 'Hide password' : 'Show password'); });
  pRow.append(pass, show);
  const status = el('div', 'hb-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.hidden = true;
  const say = (msg: string, bad: boolean) => { status.textContent = msg; status.hidden = !msg; status.classList.toggle('bad', bad); status.setAttribute('role', bad ? 'alert' : 'status'); };
  const go = el('button', 'hb-go', 'Sign in'); go.type = 'submit';
  const forgot = el('button', 'hb-forgot', 'Forgot password?'); forgot.type = 'button';
  form.append(eLabel, email, pLabel, pRow, status, go, forgot); menu.appendChild(form);

  let busy = false;
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault(); if (busy) return;
    const v = validateInput(email.value, pass.value); if ('error' in v) { say(v.error, true); (v.error === MSG.need && !email.value.trim() ? email : pass).focus(); return; }
    busy = true; go.disabled = true; say('Signing in…', false);
    let r; try { r = await signInAndRoute(liveDeps(), v.email, v.password); } catch { r = { ok: false as const, message: MSG.unavailable }; }
    busy = false; go.disabled = false;
    if (r.ok) { say('', false); handOff(r.portal, v.email, v.password); pass.value = ''; close(); done(); }
    else { say(r.message, true); pass.value = ''; pass.focus(); }
  });
  forgot.addEventListener('click', async () => {
    const addr = email.value.trim(); if (!isPlausibleEmail(addr)) { say('Type your email address above, then tap Forgot password again.', true); email.focus(); return; }
    forgot.disabled = true; say('Sending…', false);
    try { const r = await requestPasswordReset(createRecoveryClient() as any, addr, window.location.origin); say(r.message, !r.ok); } catch { say('Password reset is not available right now. Please contact FIFS directly.', true); }
    window.setTimeout(() => { forgot.disabled = false; }, 5000);
  });
  return email;
}

export function installSignInPanel(): void { w.fifsRenderSignInPanel = renderSignInPanel; }
