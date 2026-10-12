// "Show password" under each portal sign-in password box (student, client and staff), so a typo on a phone is easy to spot. Nothing is stored or sent.
// Typing a password keeps working exactly as before; the box goes back to hidden whenever the person taps Hide, and whenever the page is left.
const w: any = typeof window === 'undefined' ? {} : window;
export const PEEK_IDS = ['studentAuthPassword', 'clientAuthPassword', 'adminStaffPassword'] as const;
export const peekText = (shown: boolean) => (shown ? 'Hide password' : 'Show password');

export function installPasswordPeek(): void {
  if (w.__fifsPeekInstalled) return;
  w.__fifsPeekInstalled = true;
  for (const id of PEEK_IDS) {
    const input = document.getElementById(id) as HTMLInputElement | null; if (!input || input.dataset.peek === '1') continue;
    input.dataset.peek = '1';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pw-peek'; b.textContent = peekText(false); b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-controls', id);
    b.addEventListener('click', () => { const show = input.type === 'password'; input.type = show ? 'text' : 'password'; b.textContent = peekText(show); b.setAttribute('aria-pressed', String(show)); });
    input.insertAdjacentElement('afterend', b);
  }
}
