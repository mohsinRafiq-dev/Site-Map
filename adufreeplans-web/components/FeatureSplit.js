import Image from "next/image";

// Alternating image + content row (FrameUpNow-style feature section).
//  • reverse — put the image on the right instead of the left.
//  • tint    — light brand-green (mist) background band.
export default function FeatureSplit({
  image,
  imagePosition = "center",
  eyebrow,
  title,
  children,
  reverse = false,
  tint = false,
}) {
  return (
    <section className={tint ? "border-y border-line bg-mist/40" : ""}>
      <div className="container-x py-16 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div
            className={`reveal group relative aspect-[4/3] overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-lift)] ${
              reverse ? "lg:order-2" : ""
            }`}
          >
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ objectPosition: imagePosition }}
            />
            {/* subtle brand-green wash at the base */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-forest-700/25 to-transparent" />
          </div>

          <div className={`reveal ${reverse ? "lg:order-1" : ""}`}>
            {eyebrow && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-forest-600">
                <span className="h-px w-6 bg-forest-600" /> {eyebrow}
              </span>
            )}
            <h2 className="mt-3 font-display text-3xl text-ink md:text-4xl">{title}</h2>
            <div className="mt-5 text-lg leading-relaxed text-ink-soft">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
