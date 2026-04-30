export default function ValidationBadge({ isValid }) {
  return (
    <div className={`validation-badge ${isValid ? "valid" : "invalid"}`}>
      <span className="dot" />
      <span className="label">
        {isValid ? "Placement valid" : "Outside buildable area"}
      </span>
    </div>
  );
}
