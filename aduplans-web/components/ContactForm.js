"use client";

import { useEffect, useState } from "react";
import { validateContact } from "@/lib/contactValidation";

// Contact form. Submits to /api/contact, which creates a Salesforce Lead via
// Web-to-Lead.
//
// Two layers of error reporting, because they fail differently:
//   · per-field messages under each input — typing mistakes, caught locally
//     against the same rules the server enforces, so a bad phone number never
//     reaches Salesforce and never becomes a rejection email;
//   · a toast — the submit itself failed (Salesforce unreachable, throttled,
//     misconfigured). Nothing the person can fix by editing a field, so it
//     belongs outside the field list.
export default function ContactForm() {
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState("");

  // Auto-dismiss the toast. setState here runs from a timer callback, not
  // synchronously in the effect body, so it doesn't cascade renders.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  // Clear a field's error the moment the person starts correcting it —
  // re-validating on every keystroke would flag half-typed input as wrong.
  function clearFieldError(name) {
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  // Re-check one field once they've moved on from it.
  function validateField(e) {
    const { name, value } = e.target;
    const fieldErrors = validateContact({ [name]: value });
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const localErrors = validateContact(data);
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setToast("");
      // Put the cursor on the first problem rather than making them hunt.
      form.querySelector(`[name="${Object.keys(localErrors)[0]}"]`)?.focus();
      return;
    }

    setStatus("sending");
    setErrors({});
    setToast("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("idle");
        // The server re-runs the same validation; if it disagrees with us, its
        // answer wins and lands back on the individual fields.
        if (body.errors) {
          setErrors(body.errors);
          form.querySelector(`[name="${Object.keys(body.errors)[0]}"]`)?.focus();
          return;
        }
        setToast(body.error || "Something went wrong. Please try again.");
        return;
      }

      form.reset();
      setStatus("sent");
    } catch {
      setStatus("idle");
      setToast("We couldn't reach the server. Please check your connection and try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-forest/40 bg-mist/50 p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-forest text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h3 className="mt-4 font-display text-xl text-ink">Thank you! Your submission has been received.</h3>
        <p className="mt-2 text-sm text-ink-soft">A member of the FrameUpNow team will be in touch shortly.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-semibold text-forest hover:text-forest-600"
        >
          Send another message
        </button>
      </div>
    );
  }

  const fieldProps = { errors, onInput: clearFieldError, onBlur: validateField };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <Field label="Full Name" name="fullName" type="text" autoComplete="name" {...fieldProps} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone Number" name="phone" type="tel" autoComplete="tel" {...fieldProps} />
          <Field label="Email Address" name="email" type="email" autoComplete="email" {...fieldProps} />
        </div>
        <Field label="Subject" name="subject" type="text" {...fieldProps} />

        <div>
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            aria-invalid={errors.message ? "true" : undefined}
            aria-describedby={errors.message ? "message-error" : undefined}
            onInput={() => clearFieldError("message")}
            onBlur={validateField}
            className={`w-full rounded-xl border bg-cream/60 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:bg-paper ${
              errors.message
                ? "border-red-500 focus:border-red-500"
                : "border-line focus:border-forest"
            }`}
          />
          <FieldError id="message-error" message={errors.message} />
        </div>

        {/* Honeypot — off-screen rather than display:none, which more bots skip.
            Hidden from assistive tech and keyboard order, so no real person
            ever reaches it. Anything in it marks the submission as automated. */}
        <div aria-hidden="true" className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Leave this field empty</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-1 inline-flex items-center justify-center rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-forest-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send Message"}
        </button>
      </form>

      {toast && (
        <div role="alert" className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-red-300 bg-paper p-4 shadow-[var(--shadow-lift)] dark:border-red-900/60">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
            </span>
            <p className="flex-1 text-sm leading-relaxed text-ink">{toast}</p>
            <button
              type="button"
              onClick={() => setToast("")}
              aria-label="Dismiss"
              className="grid h-6 w-6 shrink-0 place-items-center rounded text-ink-soft transition-colors hover:bg-mist hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px shrink-0">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      {message}
    </p>
  );
}

function Field({ label, name, type = "text", autoComplete, errors, onInput, onBlur }) {
  const error = errors[name];
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        onInput={() => onInput(name)}
        onBlur={onBlur}
        className={`w-full rounded-xl border bg-cream/60 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:bg-paper ${
          error ? "border-red-500 focus:border-red-500" : "border-line focus:border-forest"
        }`}
      />
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}
