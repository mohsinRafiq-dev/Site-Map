// Small shared icon set (1.5–2px stroke, currentColor) so the UI uses one
// consistent icon language instead of OS-dependent emoji glyphs.

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function PlayIcon({ className, size = 20 }) {
  // Filled triangle reads better than a stroked one at small sizes.
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" fill="currentColor" />
    </svg>
  );
}

export function CloseIcon({ className, size = 20 }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function MenuIcon({ className, size = 20 }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function ArrowRightIcon({ className, size = 16 }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronDownIcon({ className, size = 16 }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function SearchIcon({ className, size = 16 }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

// Placeholder for a plan with no image — a simple framed-image glyph.
export function ImagePlaceholderIcon({ className, size = 40 }) {
  return (
    <svg {...base} strokeWidth={1.5} width={size} height={size} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
