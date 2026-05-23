import { useState } from "react";

export default function DownloadButton({
  onDownload,
  disabled,
  variant,
  label,
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy || disabled) return;
    setBusy(true);
    try {
      await onDownload();
    } finally {
      setBusy(false);
    }
  }

  const className = [
    "btn",
    variant === "prominent" ? "btn-export-prominent" : "btn-accent",
  ].join(" ");

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={busy || disabled}
    >
      {busy ? (
        <span>Generating…</span>
      ) : (
        <>
          <DownloadIcon />
          <span>{label || "Download Site Plan"}</span>
        </>
      )}
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4v12" />
      <path d="M6 12l6 6 6-6" />
      <path d="M5 21h14" />
    </svg>
  );
}
