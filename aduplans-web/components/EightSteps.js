// "8 Steps to Completing Your Steel Frame Home" — the circular wheel from
// aduplans.com. Green icon badges arranged in a ring with "Watch Now" video
// buttons (desktop); a clean numbered grid on smaller screens.

const STEPS = [
  { title: "Tools and Equipment Needed", vid: "R0VZMLq_74Q", angle: 22.5, icon: "tools" },
  { title: "Site Preparation", vid: "8kx_BZTx2hs", angle: 67.5, icon: "site" },
  { title: "Laying out the Snaplines", vid: "zuwfcVv9Rkk", angle: 112.5, icon: "snaplines" },
  { title: "Delivery of Your FrameUpNow Skeleton", vid: "BuNzQaJor_s", angle: 157.5, icon: "truck" },
  { title: "Invite Your Friends", vid: "km4yeQrO7_o", angle: 202.5, icon: "friends" },
  { title: "Installation of Wall Panels", vid: "MerPhwrbB-c", angle: 247.5, icon: "panels" },
  { title: "Cross Bracing", vid: "Gl8Y2hnVSX0", angle: 292.5, icon: "bracing" },
  { title: "Installing Trusses", vid: "GncoRZO4rAI", angle: 337.5, icon: "trusses" },
];

const W = 1040;
const H = 720;
const CX = W / 2;
const CY = H / 2;
const R = 210; // icon ring radius
const ICON = 78; // icon circle diameter

const pt = (angleDeg, r) => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
};

export default function EightSteps() {
  return (
    <section className="container-x py-16 md:py-20">
      <div className="reveal mx-auto max-w-3xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">
          Your quick guide to
        </span>
        <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">
          8 Steps to Completing Your Steel Frame Home
        </h2>
      </div>

      {/* Desktop wheel */}
      <div className="relative mx-auto mt-6 hidden xl:block" style={{ width: W, height: H }}>
        {/* segmented ring behind the icons */}
        <svg width={W} height={H} className="absolute inset-0" aria-hidden="true">
          {STEPS.map((s, i) => {
            const gap = 6;
            const a0 = s.angle - 22.5 + gap;
            const a1 = s.angle + 22.5 - gap;
            const p0 = pt(a0, R);
            const p1 = pt(a1, R);
            return (
              <path
                key={s.title}
                d={`M ${p0.x} ${p0.y} A ${R} ${R} 0 0 1 ${p1.x} ${p1.y}`}
                fill="none"
                stroke={i % 2 === 0 ? "var(--color-forest)" : "var(--color-mist)"}
                strokeWidth="50"
                strokeLinecap="round"
              />
            );
          })}
          <circle cx={CX} cy={CY} r={R - 60} fill="none" stroke="var(--color-line)" strokeWidth="2" strokeDasharray="3 7" />
        </svg>

        {STEPS.map((s) => {
          const c = pt(s.angle, R);
          const right = Math.sin((s.angle * Math.PI) / 180) >= 0;
          const gap = 40;
          // Vertical anchor so tall multi-line labels grow AWAY from the ring:
          // top labels grow up, bottom labels grow down, side labels center.
          const isBottom = s.angle > 130 && s.angle < 230;
          const isTop = s.angle > 310 || s.angle < 50;
          const vAnchor = isBottom
            ? { top: c.y - 10 }
            : isTop
            ? { top: c.y + 10, transform: "translateY(-100%)" }
            : { top: c.y, transform: "translateY(-50%)" };
          const hAnchor = right
            ? { left: c.x + ICON / 2 + gap }
            : { right: W - (c.x - ICON / 2 - gap) };
          const labelStyle = { ...vAnchor, ...hAnchor, width: 168, textAlign: right ? "left" : "right" };
          return (
            <div key={s.title}>
              {/* icon badge */}
              <div
                className="absolute grid place-items-center rounded-full bg-forest text-white shadow-lg ring-4 ring-cream"
                style={{ left: c.x - ICON / 2, top: c.y - ICON / 2, width: ICON, height: ICON }}
              >
                <StepIcon name={s.icon} />
              </div>
              {/* label + watch now */}
              <div className="absolute" style={labelStyle}>
                <h3 className="font-display text-lg leading-tight text-forest-700">{s.title}</h3>
                <a
                  href={`https://youtu.be/${s.vid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full border border-forest px-3.5 py-1.5 text-xs font-semibold text-forest transition-colors hover:bg-forest hover:text-white ${right ? "" : "flex-row-reverse"}`}
                >
                  <PlayIcon /> Watch Now
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile / tablet grid */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:hidden">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-4 shadow-[var(--shadow-card)]">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-forest text-white">
              <StepIcon name={s.icon} />
              <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-amber text-xs font-bold text-ink ring-2 ring-paper">
                {i + 1}
              </span>
            </div>
            <div>
              <h3 className="font-display text-base leading-tight text-ink">{s.title}</h3>
              <a href={`https://youtu.be/${s.vid}`} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-forest px-3 py-1 text-xs font-semibold text-forest hover:bg-forest hover:text-white">
                <PlayIcon /> Watch Now
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StepIcon({ name }) {
  const p = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "tools":
      return <svg {...p}><path d="m14 7 3-3 3 3-3 3" /><path d="M14 7 5 16v3h3l9-9" /><path d="m9 11 4 4" /></svg>;
    case "site":
      return <svg {...p}><path d="M4 3h11l5 5v13H4z" /><path d="M15 3v5h5" /><path d="M8 13h8M8 17h5" /></svg>;
    case "snaplines":
      return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M4 9h16M9 4v16" /><path d="m13 13 4 4" /></svg>;
    case "truck":
      return <svg {...p}><path d="M3 6h11v9H3z" /><path d="M14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>;
    case "friends":
      return <svg {...p}><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8" /><path d="M17.5 14.5a5.5 5.5 0 0 1 3 5" /></svg>;
    case "panels":
      return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M9 4v16M15 4v16M4 10h16" /></svg>;
    case "bracing":
      return <svg {...p}><rect x="5" y="4" width="14" height="16" rx="1" /><path d="M5 4l14 16M19 4 5 20" /></svg>;
    case "trusses":
      return <svg {...p}><path d="M3 10 12 4l9 6" /><path d="M5 10v10h14V10" /><path d="m8 20 4-6 4 6M8 14h8" /></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="8" /></svg>;
  }
}
