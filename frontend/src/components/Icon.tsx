import type { SVGProps } from 'react';

/** Supported built-in symbols rendered by {@link Icon}. */
type Name = 'chevron' | 'copy' | 'file' | 'check' | 'external' | 'commit';

/** Renders a small inline SVG symbol and forwards standard SVG attributes. */
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: Name }) {
  const common = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', ...props };
  if (name === 'chevron') return <svg {...common}><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === 'copy') return <svg {...common}><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor"/><path d="M10.5 5V3.8A1.8 1.8 0 0 0 8.7 2H3.8A1.8 1.8 0 0 0 2 3.8v4.9a1.8 1.8 0 0 0 1.8 1.8H5" stroke="currentColor"/></svg>;
  if (name === 'file') return <svg {...common}><path d="M4 1.75h5l3 3v9.5H4z" stroke="currentColor"/><path d="M9 1.75v3h3" stroke="currentColor"/></svg>;
  if (name === 'check') return <svg {...common}><path d="m3 8.5 3 3 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === 'external') return <svg {...common}><path d="M9 2h5v5M14 2 7 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 9.5v2.7a1.8 1.8 0 0 1-1.8 1.8H3.8A1.8 1.8 0 0 1 2 12.2V4.8A1.8 1.8 0 0 1 3.8 3H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
  return <svg {...common}><circle cx="8" cy="8" r="6.25" stroke="currentColor"/><path d="M8 4.7v3.6l2.3 1.4" stroke="currentColor" strokeLinecap="round"/></svg>;
}
