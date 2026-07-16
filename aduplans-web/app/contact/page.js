import ContactForm from "@/components/ContactForm";
import PageHero from "@/components/PageHero";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the FrameUpNow team about ADU plans, steel framing, and your project.",
};

export default function ContactPage() {
  return (
    <div>
      <PageHero eyebrow="Contact Us" title="Let’s talk about your ADU">
        Questions about a plan, steel framing, or getting a quote? Send us a note and a member of the
        FrameUpNow team will get back to you.
      </PageHero>

      <div className="container-x py-16 md:py-20">
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
            <InfoCard title="Visit" icon={<PinIcon />}>
              Tucson, AZ 85715 USA
            </InfoCard>
            <InfoCard title="Hours" icon={<ClockIcon />}>
              <div>Mon–Fri: 7:30 AM – 5:30 PM (MST)</div>
              <div className="text-muted">Sat–Sun: Closed</div>
            </InfoCard>
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
function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
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
