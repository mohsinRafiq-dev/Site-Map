import Link from "next/link";

export const metadata = {
  title: "About",
  description: "ADUplans helps homeowners visualize and place build-ready ADU plans on their property.",
};

export default function AboutPage() {
  return (
    <div className="container-x py-14 md:py-20">
      <div className="max-w-3xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">About</span>
        <h1 className="mt-2 font-display text-4xl text-ink md:text-5xl">
          The fastest way to see an ADU on your land.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          ADUplans brings together thousands of documented, build-ready Accessory Dwelling Unit floor
          plans and a satellite-based placement tool — so you can find a plan you love and see it on
          your actual property before committing to anything.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Choosing an ADU and confirming it fits your lot is the essential first step. Once you’ve found
          the right plan, FrameUpNow can engineer, produce and ship the wall panels and trusses — and
          you or your contractor finish the home to your taste.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/plans" className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5">
            Browse plans
          </Link>
          <a href="https://www.frameupnow.com" target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink hover:border-forest/40">
            Visit FrameUpNow.com
          </a>
        </div>
      </div>
    </div>
  );
}
