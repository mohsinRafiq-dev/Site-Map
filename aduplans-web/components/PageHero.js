// Shared hero for interior pages (About, How It Works, Why Steel, Contact).
// A soft branded backdrop with a dotted grid, two drifting glow orbs, and a
// staggered entrance (CSS `rise-in` — no client JS needed).
export default function PageHero({ eyebrow, title, tagline, children, align = "center" }) {
  const centered = align === "center";
  return (
    <section className="page-hero relative isolate overflow-hidden border-b border-line">
      {/* Texture + drifting glows */}
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-70" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-floaty absolute -left-24 -top-28 h-72 w-72 rounded-full bg-forest/10 blur-3xl" />
        <div className="animate-floaty-slow absolute -right-20 top-4 h-64 w-64 rounded-full bg-amber/10 blur-3xl" />
      </div>

      <div className="container-x relative py-20 md:py-28">
        <div className={`mx-auto max-w-3xl ${centered ? "text-center" : ""}`}>
          {eyebrow && (
            <span className="rise-in inline-flex items-center gap-2 rounded-full border border-forest/25 bg-mist/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-forest-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-forest" />
              {eyebrow}
            </span>
          )}
          <h1 className="rise-in delay-1 mt-5 font-display text-4xl leading-[1.08] text-ink md:text-[3.25rem]">
            {title}
          </h1>
          {tagline && (
            <p className="rise-in delay-2 mt-4 font-display text-xl text-forest-700 md:text-2xl">{tagline}</p>
          )}
          {children && (
            <div className="rise-in delay-3 mt-6 text-lg leading-relaxed text-ink-soft">{children}</div>
          )}
        </div>
      </div>
    </section>
  );
}
