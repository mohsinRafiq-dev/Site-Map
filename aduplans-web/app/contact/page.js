import Image from "next/image";
import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the FrameUpNow team about ADU plans, steel framing, and your project.",
};

export default function ContactPage() {
  return (
    <div>
      {/* ── Split hero — content left (brand green), image right ─────────── */}
      <section className="border-b border-line">
        <div className="grid lg:grid-cols-2">
          {/* Left — brand-green panel */}
          <div
            className="relative flex flex-col justify-center px-6 py-14 text-white md:px-12 md:py-20"
            style={{ background: "linear-gradient(125deg, #5a8738 0%, #3b5a1f 100%)" }}
          >
            <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-[0.1]" />
            <div className="relative mx-auto w-full max-w-md lg:mr-0">
              <span className="rise-in inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber" /> Contact Us
              </span>
              <h1 className="rise-in delay-1 mt-5 font-display text-4xl leading-[1.08] md:text-5xl">
                Let’s talk about your ADU
              </h1>
              <p className="rise-in delay-2 mt-5 text-lg leading-relaxed text-white/90">
                Questions about a plan, steel framing, or getting a quote? Send us a note and a member
                of the FrameUpNow team will get back to you.
              </p>
              <div className="rise-in delay-3 mt-7 flex flex-wrap gap-3">
                <a
                  href="tel:+18888640184"
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"
                >
                  <PhoneIcon /> 888-864-0184
                </a>
                <a
                  href="#contact-form"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-forest-700 transition-transform hover:-translate-y-0.5"
                >
                  Send a message →
                </a>
              </div>
            </div>
          </div>

          {/* Right — image */}
          <div className="relative min-h-[260px] bg-night lg:min-h-full">
            <Image
              src="/img-adu.jpg"
              alt="A finished FrameUpNow steel-framed ADU"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              style={{ objectPosition: "center 62%" }}
            />
          </div>
        </div>
      </section>

      {/* ── Form + contact details ───────────────────────────────────────── */}
      <div id="contact-form" className="container-x scroll-mt-20 py-16 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
          {/* Form */}
          <div className="reveal relative overflow-hidden rounded-3xl border border-line bg-paper p-6 shadow-[var(--shadow-card)] md:p-8">
            <span aria-hidden className="accent-bar absolute inset-x-0 top-0 h-1" />
            <h2 className="font-display text-2xl text-ink">Send us a message</h2>
            <p className="mt-1.5 text-sm text-ink-soft">We typically reply within one business day.</p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          {/* Contact details */}
          <aside className="reveal flex flex-col gap-4">
            <InfoCard title="Call us" icon={<PhoneIcon />}>
              <a href="tel:+18888640184" className="font-medium text-ink hover:text-forest">
                888-864-0184
              </a>
            </InfoCard>
            <InfoCard title="Hours" icon={<ClockIcon />}>
              <div>Monday to Friday: 7:30 AM – 5:30 PM (MST)</div>
              <div className="text-muted">Saturday to Sunday: Closed</div>
            </InfoCard>

            {/* Brand-green quote nudge */}
            <div className="rounded-2xl bg-forest p-5 text-white shadow-[var(--shadow-card)]">
              <h3 className="font-display text-lg">Already have a plan?</h3>
              <p className="mt-1.5 text-sm text-white/85">
                Send it to FrameUpNow and we’ll get you a steel-frame quote.
              </p>
              <a
                href="https://www.frameupnow.com/contact-us"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-forest-700 transition-transform hover:-translate-y-0.5"
              >
                Request a Quote →
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, icon, children }) {
  return (
    <div className="group rounded-2xl border border-line bg-paper p-5 shadow-[var(--shadow-card)] transition-colors hover:border-forest/30">
      <div className="flex items-center gap-2.5 text-forest">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-mist transition-colors group-hover:bg-forest group-hover:text-white">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</span>
      </div>
      <div className="mt-2.5 text-sm text-ink-soft">{children}</div>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
