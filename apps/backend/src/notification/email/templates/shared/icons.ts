/**
 * Inline icons matching specific lucide-react glyphs used in the app UI, so
 * an email visually echoes the button/heading it corresponds to. Inlined for
 * the same reason as the brand logo (see `./logo`) — the backend has no
 * bundled asset pipeline — with the same Gmail/Outlook caveat: inline `<svg>`
 * is stripped there, so the icon only renders in clients with SVG support.
 */

/** Matches lucide-react's `Megaphone` icon (used for the urgent-call action). */
export function emailMegaphoneIcon(color: string, size = 28): string {
  return `
  <svg role="img" aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
    <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />
    <path d="M8 6v8" />
  </svg>`;
}

/** Matches lucide-react's `BellRing` icon (used for the invite reminder action). */
export function emailBellRingIcon(color: string, size = 28): string {
  return `
  <svg role="img" aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
    <path d="M22 8c0-2.3-.8-4.3-2-6" />
    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    <path d="M4 2C2.8 3.7 2 5.7 2 8" />
  </svg>`;
}
