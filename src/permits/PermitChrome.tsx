import AccountLink from './AccountLink';

// Header (larger screens; on phones the bottom bar does this job) and footer for the Permit Center pages.
export function PermitHeader() {
  return (
    <header className="pc-head">
      <a className="pc-brand" href="/"><img src="/icons/icon-192.png" alt="" width={40} height={40} /><span>Train With FIFS</span></a>
      <nav className="pc-nav" aria-label="Site">
        <a href="/">Home</a><a href="/?open=classes">Classes</a><a href="/?open=booking">Book Now</a><a href="/permits" aria-current="page">Permits</a><AccountLink>My FIFS</AccountLink>
      </nav>
    </header>
  );
}
export function PermitFooter() {
  return (
    <footer className="pc-foot">
      <p><strong>Information, not legal advice.</strong> Rules change. Every fact on these pages comes from the official page linked beside it, with the date it was last checked. Always confirm with the official source before you apply or travel armed. Questions? Call Coach Kai at 443-990-1304.</p>
    </footer>
  );
}
