import Link from "next/link";

export const metadata = {
  title: "How It Works",
  description: "Place any ADU floor plan on your property in three simple steps.",
};

const STEPS = [
  { n: 1, title: "Pick a floor plan", body: "Browse thousands of build-ready ADU plans and filter by state, size, and bedrooms. Find one you love." },
  { n: 2, title: "Place it on your lot", body: "Click “Place this floor plan on my lot,” enter your address, and the plan drops onto your property to scale on live satellite imagery." },
  { n: 3, title: "Check the fit & export", body: "Adjust setbacks, confirm it fits your buildable area, then export a free, print-ready site plan — no survey or architect required." },
];

export default function HowItWorksPage() {
  return (
    <div className="container-x py-14 md:py-20">
      <div className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">How it works</span>
        <h1 className="mt-2 font-display text-4xl text-ink md:text-5xl">
          From screen to site in three simple steps.
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          The lot-fit tool helps you see whether a specific ADU plan can fit on your vacant lot —
          using real satellite imagery, free of charge.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="relative rounded-3xl border border-line bg-paper p-7 shadow-[var(--shadow-card)]">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest font-display text-xl text-white">
              {s.n}
            </span>
            <h3 className="mt-5 font-display text-xl text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-3xl border border-line bg-mist/50 p-8 text-center">
        <h2 className="font-display text-2xl text-ink">Ready to see your ADU on your land?</h2>
        <Link
          href="/plans"
          className="mt-5 inline-flex rounded-full bg-forest px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Browse floor plans →
        </Link>
      </div>
    </div>
  );
}
