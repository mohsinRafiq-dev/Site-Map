"use client";

import { useState } from "react";

// Contact collection form. Submits to /api/contact, which creates a lead in
// Salesforce (via Web-to-Lead once SALESFORCE_ORG_ID is set on the server).
export default function ContactForm() {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    setError("");
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }
      form.reset();
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Please try again.");
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <Field label="Full Name" name="fullName" type="text" autoComplete="name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone Number" name="phone" type="tel" autoComplete="tel" />
        <Field label="Email Address" name="email" type="email" autoComplete="email" />
      </div>
      <Field label="Subject" name="subject" type="text" />
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-line bg-cream/60 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest focus:bg-paper"
        />
      </div>

      {status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-1 inline-flex items-center justify-center rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-forest-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

function Field({ label, name, type = "text", autoComplete }) {
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
        className="w-full rounded-xl border border-line bg-cream/60 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest focus:bg-paper"
      />
    </div>
  );
}
