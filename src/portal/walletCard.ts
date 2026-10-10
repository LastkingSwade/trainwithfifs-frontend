// A small card in the Student and Client portals that opens the document wallet. Text only (textContent).
export function walletCard(): HTMLElement {
  const box = document.createElement('div'); box.className = 'pcard';
  const h = document.createElement('h3'); h.textContent = '🔐 My document wallet'; box.appendChild(h);
  const p = document.createElement('p'); p.textContent = 'Keep your permit card, class certificate or HQL approval in one private place. Only you can open them, and they are stored encrypted.'; box.appendChild(p);
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn'; b.textContent = 'Open my wallet';
  b.addEventListener('click', () => (window as any).openWallet?.());
  box.appendChild(b);
  return box;
}
