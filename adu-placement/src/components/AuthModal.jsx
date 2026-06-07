import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";

export default function AuthModal({ open, onClose, onSuccess }) {
  const { signInGoogle, signInEmail, signUpEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape" && !busy) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) { setMode("signin"); setError(""); setResetSent(false); }
  }, [open]);

  if (!open) return null;

  async function handleGoogle() {
    setBusy(true); setError("");
    try {
      await signInGoogle();
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error("[Auth] Google sign-in error:", e.code, e.message);
      setError(friendlyError(e.code, e.message));
    } finally { setBusy(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      if (mode === "signin") {
        await signInEmail(email, password);
        onSuccess?.(); onClose();
      } else if (mode === "signup") {
        await signUpEmail(email, password, name.trim() || undefined);
        onSuccess?.(); onClose();
      } else {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (e) {
      console.error("[Auth] Email sign-in error:", e.code, e.message);
      setError(friendlyError(e.code, e.message));
    } finally { setBusy(false); }
  }

  const title = mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password";

  return (
    <div className="auth-overlay" onClick={busy ? undefined : onClose} role="presentation">
      <div
        className="auth-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button className="auth-modal-close" onClick={onClose} disabled={busy} aria-label="Close">
          ✕
        </button>

        <div className="auth-modal-header">
          <div className="auth-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="20" height="20">
              <path d="M4 16 L16 6 L28 16 L28 26 L20 26 L20 18 L12 18 L12 26 L4 26 Z"
                fill="white" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 id="auth-modal-title">{title}</h3>
          <p className="auth-modal-sub">
            {mode === "reset"
              ? "Enter your email and we'll send a reset link."
              : "Save your ADU site plans and access them from any device."}
          </p>
        </div>

        {mode !== "reset" && (
          <button className="auth-google-btn" onClick={handleGoogle} disabled={busy}>
            <GoogleIcon />
            Continue with Google
          </button>
        )}

        {mode !== "reset" && (
          <div className="auth-divider"><span>or</span></div>
        )}

        {resetSent ? (
          <div className="auth-reset-sent">
            <span className="auth-reset-icon">✓</span>
            <div>
              <strong>Reset link sent</strong>
              <p>Check <em>{email}</em> for a password-reset link.</p>
            </div>
            <button className="btn btn-ghost sm" onClick={() => { setMode("signin"); setResetSent(false); }}>
              Back to sign in
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <label className="auth-field">
                <span>Name (optional)</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
            )}
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>
            {mode !== "reset" && (
              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : ""}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </label>
            )}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-accent w-full" disabled={busy}>
              {busy ? "…" : title}
            </button>
          </form>
        )}

        <div className="auth-footer-links">
          {mode === "signin" && (
            <>
              <button className="auth-link" onClick={() => { setMode("reset"); setError(""); }}>
                Forgot password?
              </button>
              <span>·</span>
              <button className="auth-link" onClick={() => { setMode("signup"); setError(""); }}>
                Create account
              </button>
            </>
          )}
          {mode === "signup" && (
            <button className="auth-link" onClick={() => { setMode("signin"); setError(""); }}>
              Already have an account? Sign in
            </button>
          )}
          {mode === "reset" && !resetSent && (
            <button className="auth-link" onClick={() => { setMode("signin"); setError(""); }}>
              Back to sign in
            </button>
          )}
        </div>

        {mode !== "reset" && (
          <p className="auth-legal">
            By continuing you agree to our{" "}
            <a href="/terms" target="_blank" rel="noreferrer">Terms</a> and{" "}
            <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
          </p>
        )}
      </div>
    </div>
  );
}

function friendlyError(code, rawMessage) {
  const map = {
    // Credential errors
    "auth/wrong-password":           "Incorrect password.",
    "auth/user-not-found":           "No account found with that email.",
    "auth/invalid-credential":       "Incorrect email or password.",
    "auth/user-disabled":            "This account has been disabled.",
    // Registration errors
    "auth/email-already-in-use":     "That email is already registered. Try signing in.",
    "auth/invalid-email":            "Please enter a valid email address.",
    "auth/weak-password":            "Password must be at least 8 characters.",
    // Google popup errors
    "auth/popup-closed-by-user":     "Sign-in window was closed. Please try again.",
    "auth/popup-blocked":            "Popup was blocked by your browser. Allow popups for this site and try again.",
    "auth/cancelled-popup-request":  "Sign-in was cancelled. Please try again.",
    // Setup / config errors
    "auth/operation-not-allowed":    "This sign-in method is not enabled. Enable it in the Firebase Console → Authentication → Sign-in method.",
    "auth/unauthorized-domain":      "This domain is not authorised. Add it in Firebase Console → Authentication → Settings → Authorised domains.",
    "auth/configuration-not-found":  "Firebase Auth is not set up. Enable Authentication in the Firebase Console.",
    "auth/invalid-api-key":          "Invalid Firebase API key — check VITE_FIREBASE_API_KEY in your .env file.",
    "auth/app-not-authorized":       "This app is not authorised to use Firebase Authentication. Check your Firebase project settings.",
    // Network
    "auth/network-request-failed":   "Network error — check your internet connection and try again.",
    "auth/too-many-requests":        "Too many attempts. Please wait a moment and try again.",
    "auth/timeout":                  "Request timed out. Check your connection and try again.",
  };
  if (map[code]) return map[code];
  // Show the actual code so the developer can diagnose unknown errors
  return `Sign-in failed (${code || "unknown error"}). Check the browser console for details.`;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
