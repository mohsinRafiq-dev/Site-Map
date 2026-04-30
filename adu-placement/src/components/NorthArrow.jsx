export default function NorthArrow() {
  return (
    <div className="north-arrow" aria-hidden="true">
      <svg viewBox="0 0 64 80" width="56" height="70">
        <defs>
          <linearGradient id="na-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#dbe2ee" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="44" r="22" fill="url(#na-grad)" stroke="#0f172a" strokeWidth="1.5" />
        <polygon points="32,8 22,46 32,40 42,46" fill="#0f172a" />
        <polygon points="32,8 32,40 42,46" fill="#334155" />
        <text x="32" y="58" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a">
          N
        </text>
      </svg>
    </div>
  );
}
