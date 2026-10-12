// Thin-line icons for the home screen (they replace emoji, which render differently on every device). Decorative only: hidden from screen readers,
// drawn in the surrounding text colour, sized with the text. One stroke weight everywhere so they read as a set.
import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="fi-ico" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
export const IconTarget = () => (<Icon><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></Icon>);
export const IconBolt = () => (<Icon><path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" /></Icon>);
export const IconUser = () => (<Icon><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" /></Icon>);
export const IconHelp = () => (<Icon><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.2 1-1.2 1.9" /><circle cx="12" cy="17" r="0.7" fill="currentColor" /></Icon>);
export const IconChat = () => (<Icon><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" /><circle cx="9" cy="12" r="0.8" fill="currentColor" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /><circle cx="15" cy="12" r="0.8" fill="currentColor" /></Icon>);
export const IconShield = () => (<Icon><path d="M12 3 5 6v5.5c0 4.4 3 7.5 7 9.5 4-2 7-5.1 7-9.5V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></Icon>);
export const IconStar = () => (<Icon><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8z" /></Icon>);
