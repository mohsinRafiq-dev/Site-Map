import { useState } from "react";
import { useAuth } from "../lib/auth";
import { saveProject } from "../lib/projects";

// Shows "Sign in to save" when the user is logged out.
// Shows "Save project" / "Saved ✓" when logged in.
// Pass currentProjectId to update an existing doc instead of creating a new one.
export default function SaveProjectButton({
  sessionData,
  disabled,
  onRequestSignIn,
  currentProjectId,
  onSaved,
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  if (!user) {
    return (
      <button
        type="button"
        className="btn btn-ghost w-full save-project-btn"
        onClick={onRequestSignIn}
        disabled={disabled}
      >
        <UserIcon />
        Sign in to save project
      </button>
    );
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      const placePart = sessionData.location?.placeName?.split(",")[0];
      const name = placePart ? `${placePart} ADU` : "My ADU Project";
      const id = await saveProject(user.uid, { ...sessionData, name }, currentProjectId);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2800);
      onSaved?.(id);
    } catch (err) {
      console.error("[FrameUpNow] Save project failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn w-full save-project-btn ${savedFlash ? "save-project-btn--saved" : "btn-ghost"}`}
      onClick={handleSave}
      disabled={busy || disabled}
    >
      {busy ? (
        "Saving…"
      ) : savedFlash ? (
        <>✓ Project saved!</>
      ) : (
        <><CloudIcon /> {currentProjectId ? "Save changes" : "Save project"}</>
      )}
    </button>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}
