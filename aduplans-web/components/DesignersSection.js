// "A note to jurisdictions without PRADUs" — the top-10 PRADU designers +
// the City Planner explainer video. Mirrors aduplans.com, polished.

import DesignerList from "@/components/DesignerList";

export default function DesignersSection() {
  return (
    <section className="container-x py-16 md:py-20">
      {/* Heading */}
      <div className="reveal mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl text-ink md:text-4xl">
          A note to jurisdictions without PRADUs
        </h2>
        <p className="mt-3 text-ink-soft">
          This is your shortcut to success. Choose from the top 10 PRADU designers in the world to
          design pre-approved plans for your city.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
        {/* Designers — clickable, each opens its firm contact card */}
        <DesignerList />

        {/* City Planner video */}
        <div className="lg:sticky lg:top-24">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-night shadow-[var(--shadow-lift)]">
            <iframe
              src="https://www.youtube.com/embed/rfWSVJN6_j0"
              title="Learn about PRADUs from a City Planner"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <p className="mt-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-forest-600">
            Learn about PRADUs from a City Planner
          </p>
        </div>
      </div>
    </section>
  );
}
