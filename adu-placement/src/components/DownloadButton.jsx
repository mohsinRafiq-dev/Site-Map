import { useState } from "react";

export default function DownloadButton({ onDownload, disabled }) {
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

  return (
    <button
      type="button"
      className="btn btn-accent"
      onClick={handleClick}
      disabled={busy || disabled}
    >
      {busy ? "Generating…" : "⬇ Download Site Plan"}
    </button>
  );
}
