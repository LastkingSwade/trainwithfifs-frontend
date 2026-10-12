// A small card in the Client portal that opens the Document Vault. Text only (textContent).
export function walletCard(): HTMLElement {
  const box = document.createElement('div'); box.className = 'pcard';
  const h = document.createElement('h3'); h.textContent = '🔐 Your Document Vault'; box.appendChild(h);
  const p = document.createElement('p'); p.textContent = 'Your training. Your records. All together. Keep your permit card, class certificate or HQL approval in one private place. Only you can open them, and they are stored encrypted.'; box.appendChild(p);
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn'; b.textContent = 'Open my vault';
  b.addEventListener('click', () => (window as any).openWallet?.());
  box.appendChild(b);
  return box;
}
