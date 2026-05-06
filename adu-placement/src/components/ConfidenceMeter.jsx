// Visualizes how comfortably the chosen ADU fits inside the buildable area.
// Margin in feet (negative = outside). Per the doc:
//   < 0   → "Doesn't fit"
//   0..1  → "Tight fit"
//   ≥ 1   → "Great placement"
export default function ConfidenceMeter({ marginFt }) {
  if (marginFt == null) {
    return (
      <div className="confidence idle">
        <div className="confidence-icon" aria-hidden="true">·</div>
        <div className="confidence-text">
          <span className="confidence-headline">Place the home to see fit</span>
          <span className="confidence-sub">
            Pick a floor plan, then drag it onto your lot.
          </span>
        </div>
      </div>
    );
  }

  let level, headline, sub, icon;
  if (marginFt < 0) {
    level = "bad";
    icon = "✕";
    headline = "Doesn't fit on this lot";
    sub = `Outside the setback by ${Math.abs(marginFt).toFixed(1)} ft. Try a smaller plan or relax the setbacks.`;
  } else if (marginFt < 1) {
    level = "tight";
    icon = "!";
    headline = "Tight fit";
    sub = `Only ${marginFt.toFixed(1)} ft of clearance — buildable but hugging the setback.`;
  } else {
    level = "great";
    icon = "✓";
    headline = "Great placement";
    sub = `${marginFt.toFixed(1)} ft of breathing room around the home.`;
  }

  return (
    <div className={`confidence ${level}`}>
      <div className="confidence-icon" aria-hidden="true">{icon}</div>
      <div className="confidence-text">
        <span className="confidence-headline">{headline}</span>
        <span className="confidence-sub">{sub}</span>
      </div>
    </div>
  );
}
