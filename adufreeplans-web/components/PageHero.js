import Image from "next/image";

// Shared hero for interior pages (About, How It Works, Why Steel, Contact).
//
// Two looks:
//  • Default — a soft branded light backdrop (dotted grid + drifting glow orbs).
//  • Photo   — pass `image` to render a full-bleed darkened photo with white
//              text (used to give the content pages depth instead of white space).
export default function PageHero({
  eyebrow,
  title,
  tagline,
  children,
  align = "center",
  image,
  imagePosition = "center",
}) {
  const centered = align === "center";

  // ── Photo hero ────────────────────────────────────────────────────────────
  if (image) {
    return (
      <section className="relative isolate overflow-hidden border-b border-line">
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: imagePosition }}
        />
        {/* Darkening overlay keeps the text legible over any photo. */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night/85 via-night/70 to-night/90" />
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-[0.08]" />

        <div className="container-x relative py-24 md:py-32">
          <div className={`mx-auto max-w-3xl text-white ${centered ? "text-center" : ""}`}>
            {eyebrow && (
              <span className="rise-in inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                {eyebrow}
              </span>
            )}
            <h1 className="rise-in delay-1 mt-5 font-display text-4xl leading-[1.08] md:text-[3.25rem]">{title}</h1>
            {tagline && (
              <p className="rise-in delay-2 mt-4 font-display text-xl text-amber md:text-2xl">{tagline}</p>
            )}
            {children && (
              <div className="rise-in delay-3 mt-6 text-lg leading-relaxed text-white/85">{children}</div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── Light hero (default) ────────────────────────────────────────────────────
  return (
    <section className="page-hero relative isolate overflow-hidden border-b border-line">
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
