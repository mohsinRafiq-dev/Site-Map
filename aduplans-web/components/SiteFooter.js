import Link from "next/link";
import Image from "next/image";

const FUN = "https://www.frameupnow.com";
const EXT = { target: "_blank", rel: "noopener noreferrer" };

const QUICK = [
  { label: "Builders", href: `${FUN}/builders` },
  { label: "DIY", href: `${FUN}/diy` },
  { label: "Napkin CAD", href: `${FUN}/napkincad` },
  { label: "About Us", href: `${FUN}/about-us` },
  { label: "Blog", href: `${FUN}/blog` },
  { label: "FAQs", href: `${FUN}/faqs` },
  { label: "Contact Us", href: `${FUN}/contact-us` },
];

const LEGAL = [
  { label: "Return Policy", href: `${FUN}/legal/return-policy` },
  { label: "Privacy Policy", href: `${FUN}/legal/privacy` },
  { label: "Terms & Conditions", href: `${FUN}/legal/terms-and-conditions` },
  { label: "Sitemap", href: `${FUN}/legal/sitemap` },
];

const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/frameupnowus", icon: "facebook" },
  { label: "Instagram", href: "https://www.instagram.com/frameupnow/", icon: "instagram" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/frame-up-now/", icon: "linkedin" },
  { label: "YouTube", href: "https://www.youtube.com/@FrameUpNow/videos", icon: "youtube" },
];

export default function SiteFooter() {
  return (
    <footer className="relative mt-24 bg-night text-white/75">
      {/* top accent line + soft glow */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-forest-600/70 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(44,122,87,0.18),transparent)]" />

      <div className="container-x relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        {/* Brand */}
        <div className="lg:pr-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/adu-logo.png" alt="aduplans.com" width={40} height={40} className="h-10 w-10 object-contain" />
            <span className="flex flex-col items-end leading-none">
              <span className="font-sans text-[1.35rem] font-bold leading-none tracking-tight text-white">
                aduplans<span className="text-forest-600">.com</span>
              </span>
              <span className="mt-1 text-right text-[11px] font-normal leading-none text-white/55">
                Powered by <span className="font-semibold text-white/80">FrameUpNow</span>
              </span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
            FrameUpNow manufactures cold-formed steel (CFS) framing to conform to your engineered plans.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                {...EXT}
                aria-label={s.label}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 transition-all hover:-translate-y-0.5 hover:border-forest-600 hover:bg-forest-600 hover:text-white"
              >
                <SocialIcon name={s.icon} />
              </a>
            ))}
          </div>
        </div>

        <FooterCol title="Quick Link" links={QUICK} />
        <FooterCol title="Legal" links={LEGAL} />

        {/* Contact */}
        <div>
          <ColTitle>Contact Us</ColTitle>
          <ul className="mt-5 space-y-4 text-sm">
            <ContactRow icon="phone">
              <a href="tel:888-864-0184" className="hover:text-white">888-864-0184</a>
            </ContactRow>
            <ContactRow icon="pin">
              <a href="https://maps.app.goo.gl/GGQsasiAAS5HKmFK6" {...EXT} className="hover:text-white">
                Tucson, AZ 85715 USA
              </a>
            </ContactRow>
            <ContactRow icon="clock">
              <span className="leading-relaxed text-white/60">
                Mon–Fri: 7AM–6PM (PST)
                <br />
                Sat–Sun: Closed
              </span>
            </ContactRow>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} FrameUpNow. All Rights Reserved.</p>
          <p>
            ADUplans — the largest Permit-Ready ADU database in the world.
          </p>
        </div>
      </div>
    </footer>
  );
}

function ColTitle({ children }) {
  return (
    <h4 className="relative inline-block font-display text-lg text-white">
      {children}
      <span className="absolute -bottom-2 left-0 h-0.5 w-8 rounded-full bg-forest-600" />
    </h4>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <ColTitle>{title}</ColTitle>
      <ul className="mt-6 space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              {...EXT}
              className="group inline-flex items-center gap-2 text-white/65 transition-colors hover:text-white"
            >
              <span className="h-px w-0 bg-forest-600 transition-all duration-200 group-hover:w-4" />
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactRow({ icon, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-forest-600/15 text-forest-600">
        <ContactIcon name={icon} />
      </span>
      <span className="text-white/70">{children}</span>
    </li>
  );
}

function ContactIcon({ name }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "phone") return <svg {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></svg>;
  if (name === "pin") return <svg {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

function SocialIcon({ name }) {
  const s = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "currentColor" };
  switch (name) {
    case "facebook":
      return <svg {...s}><path d="M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1Z" /></svg>;
    case "instagram":
      return <svg {...s} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
    case "linkedin":
      return <svg {...s}><path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 8.5h4V21H3V8.5ZM10 8.5h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.3c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4V8.5Z" /></svg>;
    default:
      return <svg {...s}><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.7C19.4 5.2 12 5.2 12 5.2s-7.4 0-8.9.4A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.7 1.7c1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4a2.5 2.5 0 0 0 1.7-1.7C23 15.2 23 12 23 12ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" /></svg>;
  }
}
