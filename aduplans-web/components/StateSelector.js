import Link from "next/link";

const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

// "Select your state" — the site's core entry point. States with plans are
// highlighted and clickable; the rest are shown greyed as "coming soon".
export default function StateSelector({ states }) {
  const counts = Object.fromEntries(states.map((s) => [s.code, s.count]));
  const all = Object.keys(STATE_NAMES).sort((a, b) => (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b));

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {all.map((code) => {
        const count = counts[code] || 0;
        const has = count > 0;
        const content = (
          <>
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-ink">{code}</span>
              {has && (
                <span className="chip bg-mist text-forest-700">{count.toLocaleString()}</span>
              )}
            </div>
            <div className="mt-1 text-xs text-muted">{STATE_NAMES[code]}</div>
          </>
        );
        return has ? (
          <Link
            key={code}
            href={`/plans?state=${code}`}
            className="card-hover rounded-xl border border-line bg-paper p-3.5 shadow-[var(--shadow-card)]"
          >
            {content}
          </Link>
        ) : (
          <div
            key={code}
            className="cursor-not-allowed rounded-xl border border-line-soft bg-cream/40 p-3.5 opacity-55"
            title="Coming soon"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
