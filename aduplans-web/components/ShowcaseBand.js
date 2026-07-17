import Image from "next/image";

// Full-bleed photo band with a dark overlay and a centered statement — used to
// break up long light content sections with depth (FrameUpNow's look).
export default function ShowcaseBand({ image, imagePosition = "center", children }) {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src={image}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: imagePosition }}
      />
      <div aria-hidden className="absolute inset-0 bg-night/78" />
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div className="container-x relative py-20 text-center text-white md:py-24">
        <div className="reveal mx-auto max-w-3xl font-display text-2xl leading-snug md:text-3xl">
          {children}
        </div>
      </div>
    </section>
  );
}
