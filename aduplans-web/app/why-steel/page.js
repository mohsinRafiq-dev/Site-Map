import Link from "next/link";
import PageHero from "@/components/PageHero";
import ShowcaseBand from "@/components/ShowcaseBand";
import FeatureSplit from "@/components/FeatureSplit";

export const metadata = {
  title: "Why Steel",
  description:
    "Why build your ADU with FrameUpNow cold-formed steel — durable, fire- and moisture-resistant, faster to build, and environmentally friendly.",
};

const FUN = "https://www.frameupnow.com";

const BENEFITS = [
  { icon: "frame", t: "Steel Framing", d: "FrameUpNow Cold-Formed Steel (CFS) is a lightweight, high-quality material that weighs less than wood and has many other advantages as a framing material." },
  { icon: "shield", t: "Durability", d: "Steel has the upper hand over wood when it comes to durability. It doesn’t warp or expand, and it can withstand extreme earthquakes and hurricanes because it’s flexible and can bend without cracking." },
  { icon: "infinity", t: "Lifespan", d: "The lifespan of steel framing is estimated to be hundreds of years or more." },
  { icon: "flame", t: "Fire Resistance", d: "Steel’s inflammability limits the spread of fires — wooden frames simply can’t compete — and insurance rates are often lower." },
  { icon: "droplet", t: "Moisture Resistance", d: "Steel is highly mold-resistant and copes better with water damage than wood. Galvanized steel or zinc-coating treatments also increase rust resistance." },
  { icon: "bolt", t: "Time-Saving", d: "In most cases no heavy equipment is necessary. FrameUpNow CFS components can be quickly made and transported to the site for expedited assembly." },
  { icon: "sliders", t: "Customizable", d: "Steel-framed homes provide customizable cladding options such as brick siding, wood, stucco, and vinyl, plus versions of your plans for the room." },
  { icon: "leaf", t: "Environmentally Friendly", d: "FrameUpNow parts and panels are environmentally friendly — absolutely no waste at the building site. Wood framing can produce waste in excess of 25%." },
  { icon: "sparkle", t: "Site Cleanliness", d: "Daily clean-up during framing is made easy because there is no waste resulting from the FrameUpNow process." },
  { icon: "trend", t: "Reduced Overhead", d: "Less overall construction time, thus less variable site and administrative cost." },
  { icon: "layers", t: "Insulation", d: "Engineered FrameUpNow homes are best insulated with modern insulation materials such as BASF Open-Cell Polyurethane Spray Foam." },
  { icon: "scale", t: "Wood vs. Steel Framing", d: "Framers, drywallers, plumbers, and electricians find working with CFS an easy transition from wood — and a preferable solution." },
];

const STATS = [
  { n: "100+", l: "Year estimated lifespan" },
  { n: "0%", l: "Jobsite framing waste" },
  { n: "25%+", l: "Typical wood-framing waste avoided" },
  { n: "IBC", l: "Engineered to code" },
];

export default function WhySteelPage() {
  return (
    <div>
      <PageHero
        image="/steel-frame-photo.jpg"
        imagePosition="center 60%"
        eyebrow="Why Steel"
        title={
          <>
            Why FrameUpNow is the <span className="text-amber">Smartest Choice</span> in Steel Framing
          </>
        }
        tagline="Engineered for Strength, Built for Life."
      >
        Cold-formed steel gives your ADU a stronger, cleaner, and more predictable build than
        traditional wood framing — from the first panel to decades down the road.
      </PageHero>

      {/* ── Stats band (brand green) ─────────────────────────────────────── */}
      <section
        className="border-b border-forest-700/40 text-white"
        style={{ background: "linear-gradient(100deg, #3b5a1f 0%, #5a8738 55%, #3b5a1f 100%)" }}
      >
        <div className="container-x">
          <dl className="reveal-stagger grid grid-cols-2 divide-x divide-white/10 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="px-4 py-8 text-center">
                <dt className="font-display text-3xl text-white md:text-4xl">{s.n}</dt>
                <dd className="mt-1.5 text-xs uppercase tracking-wider text-white/60">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Built to last (image + content) ──────────────────────────────── */}
      <FeatureSplit
        image="/img-adu.jpg"
        imagePosition="center 62%"
        eyebrow="Built to last"
        title="A home engineered for strength and longevity"
        reverse
      >
        <p>
          Cold-formed steel gives your ADU a structure that resists fire, pests, mold, and rot — and
          won’t warp, shrink, or twist over time. The home you build today stays sound, safe, and true
          for generations.
        </p>
      </FeatureSplit>

      {/* ── Benefits grid ────────────────────────────────────────────────── */}
      <section className="container-x py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="reveal mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">
              The FrameUpNow advantage
            </span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">
              Benefits of steel frames to home builders
            </h2>
          </div>
          <div className="reveal-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.t}
                className="group card-hover relative overflow-hidden rounded-2xl border border-line bg-paper p-6 shadow-[var(--shadow-card)]"
              >
                <span className="accent-bar absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-mist text-forest transition-colors group-hover:bg-forest group-hover:text-white">
                  <BenefitIcon name={b.icon} />
                </span>
                <h3 className="mt-4 font-display text-lg text-ink">{b.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ShowcaseBand image="/img-steel-site.jpg" imagePosition="center 55%">
        Cold-formed steel: stronger, cleaner, and more predictable — from the first panel on.
      </ShowcaseBand>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="container-x pb-16">
        <div className="reveal hero-surface relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white md:px-16">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl md:text-4xl">
            Found a plan you love? Let FrameUpNow turn it into a steel frame package.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/75">
            Find your perfect plan on ADUplans.com — then have FrameUpNow precision-engineer it in
            cold-formed steel so you can build stronger, smarter, and faster.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/plans" className="rounded-full bg-amber px-7 py-3.5 text-sm font-semibold text-ink shadow-lg transition-transform hover:-translate-y-0.5">
              Browse ADU plans →
            </Link>
            <a href={`${FUN}/contact-us`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Request a Quote
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// Distinct line icon per benefit — one visual language, no repeated glyphs.
function BenefitIcon({ name }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  switch (name) {
    case "frame":
      return <svg {...p}><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="16" width="18" height="4" rx="1" /><path d="M7 8v8M17 8v8" /></svg>;
    case "shield":
      return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>;
    case "infinity":
      return <svg {...p}><path d="M6.5 8a4 4 0 0 0 0 8c2 0 3-1.5 5.5-4s3.5-4 5.5-4a4 4 0 0 1 0 8c-2 0-3-1.5-5.5-4S8.5 8 6.5 8z" /></svg>;
    case "flame":
      return <svg {...p}><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3 .5 1.5 2 2 2 2 0-3 2-5 2-8z" /></svg>;
    case "droplet":
      return <svg {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg>;
    case "bolt":
      return <svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>;
    case "sliders":
      return <svg {...p}><path d="M4 8h10M18 8h2M4 16h2M10 16h10" /><circle cx="16" cy="8" r="2" /><circle cx="8" cy="16" r="2" /></svg>;
    case "leaf":
      return <svg {...p}><path d="M4 20c0-8 6-14 16-14 0 10-6 14-14 14a6 6 0 0 1-2-.3" /><path d="M9 15c3-3 5-4 8-5" /></svg>;
    case "sparkle":
      return <svg {...p}><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></svg>;
    case "trend":
      return <svg {...p}><path d="M4 7l6 6 4-4 6 6" /><path d="M20 15v-4h-4" /></svg>;
    case "layers":
      return <svg {...p}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
    case "scale":
      return <svg {...p}><path d="M12 3v18M7 21h10M6 7h12" /><path d="M6 7l-3 6a3 3 0 0 0 6 0zM18 7l-3 6a3 3 0 0 0 6 0z" /></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
