import { useEffect, useRef, useState } from "react";
import { saveLead } from "../lib/leads";

const TIMELINE = ["0–3 Months", "3–6 Months", "6–12 Months", "12–24 Months", "More Than 2 Years", "Just Researching"];
const BUILD = ["General Contractor", "DIY", "Hybrid (Owner/Contractor)", "Need a Builder Recommendation", "Undecided"];
const FINANCE = ["Cash", "Construction Loan", "Mortgage", "HELOC", "Investor Funding", "Retirement Funds", "Exploring Financing", "Other"];
const USE = ["Primary Residence", "Rental Property", "Short-Term Rental", "Guest House", "Housing for Family", "Multi-Generational Living", "Employee Housing", "Home Office/Studio", "Investment Property", "Other"];

const EMPTY = {
  name: "", company: "", email: "", phone: "", county: "", state: "",
  timeline: "", buildMethod: "", financing: "", financingOther: "",
  intendedUse: [], intendedUseOther: "",
};

// Build-Ready ADU Placement Request Form — required before a customer can
// print/download their site plan. Captures lead detail for the sales team.
export default function BuildReadyForm({ open, onClose, onSubmitted, context, prefill }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const topRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSubmitError("");
    setDone(false);
    topRef.current?.scrollTo?.(0, 0);
    // Pre-fill County/State from the chosen address (only if still empty, so
    // we never overwrite something the user typed).
    if (prefill) {
      setForm((f) => ({
        ...f,
        county: f.county || prefill.county || "",
        state: f.state || prefill.state || "",
      }));
    }
  }, [open]);

  // After a successful submit, show the thank-you screen, then unlock on continue.
  function finish() {
    onSubmitted(form);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  // ---- Thank-you confirmation (after a successful submit) ----
  if (done) {
    return (
      <div className="bf-overlay" onClick={finish} role="presentation">
        <div className="bf-modal bf-thanks" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="bf-thanks-check" aria-hidden="true">✓</div>
          <h3>Thank you, {form.name?.split(" ")[0] || "and welcome"}!</h3>
          <p>
            Thank you for taking the time to complete this request form. We appreciate the
            opportunity to assist with your ADU project and look forward to helping you move one
            step closer to building your new ADU.
          </p>
          <p className="bf-thanks-sub">Your site plan is now unlocked — you can download and print it.</p>
          <button type="button" className="btn btn-accent w-full" onClick={finish}>
            Continue to my site plan →
          </button>
        </div>
      </div>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleUse = (u) =>
    setForm((f) => ({
      ...f,
      intendedUse: f.intendedUse.includes(u)
        ? f.intendedUse.filter((x) => x !== u)
        : [...f.intendedUse, u],
    }));

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.county.trim()) e.county = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!form.timeline) e.timeline = "Please choose one";
    if (!form.buildMethod) e.buildMethod = "Please choose one";
    if (!form.financing) e.financing = "Please choose one";
    else if (form.financing === "Other" && !form.financingOther.trim()) e.financing = "Please specify";
    if (!form.intendedUse.length) e.intendedUse = "Please choose at least one";
    else if (form.intendedUse.includes("Other") && !form.intendedUseOther.trim()) e.intendedUse = "Please specify";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (busy) return;
    if (!validate()) {
      // Scroll to the first invalid field
      const order = ["name", "email", "phone", "county", "state", "timeline", "buildMethod", "financing", "intendedUse"];
      const firstKey = order.find((k) =>
        k === "intendedUse" ? !form.intendedUse.length : (!form[k] || (typeof form[k] === "string" && !form[k].trim()))
      );
      const el = firstKey && document.getElementById(`bf-${firstKey}`);
      el?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      await saveLead(form, context || {});
      setDone(true); // show the thank-you screen; unlock happens on "Continue"
    } catch (err) {
      console.error("[BuildReadyForm] save failed:", err);
      setSubmitError("Something went wrong submitting your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bf-overlay" onClick={busy ? undefined : onClose} role="presentation">
      <form
        className="bf-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bf-title"
        ref={topRef}
        noValidate
      >
        {/* Header */}
        <div className="bf-head">
          <div>
            <span className="bf-eyebrow">Build-Ready ADU Placement Request</span>
            <h3 id="bf-title">Complete this before your site plan</h3>
            <p className="bf-sub">
              This helps us understand your project — timeline, build method, financing and
              intended use — so we can prepare the most accurate Build-Ready ADU Lot Placement
              and tailor recommendations to you.
            </p>
          </div>
          <button type="button" className="bf-close" onClick={onClose} disabled={busy} aria-label="Close">✕</button>
        </div>

        <div className="bf-body">
          {/* CONTACT */}
          <section className="bf-section">
            <h4 className="bf-section-title">Contact Information</h4>
            <div className="bf-grid">
              <Field id="bf-name" label="Name" required error={errors.name}>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
              </Field>
              <Field id="bf-company" label="Company" hint="Optional">
                <input value={form.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" />
              </Field>
              <Field id="bf-email" label="Email" required error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
              </Field>
              <Field id="bf-phone" label="Phone" required error={errors.phone}>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
              </Field>
              <Field id="bf-county" label="County" required error={errors.county}>
                <input value={form.county} onChange={(e) => set("county", e.target.value)} />
              </Field>
              <Field id="bf-state" label="State" required error={errors.state}>
                <input value={form.state} onChange={(e) => set("state", e.target.value)} autoComplete="address-level1" />
              </Field>
            </div>
          </section>

          {/* TIMELINE */}
          <ChoiceSection
            id="bf-timeline" title="When do you plan to begin construction?"
            options={TIMELINE} value={form.timeline} onChange={(v) => set("timeline", v)}
            required error={errors.timeline}
          />

          {/* BUILD METHOD */}
          <ChoiceSection
            id="bf-buildMethod" title="How do you plan to build?"
            options={BUILD} value={form.buildMethod} onChange={(v) => set("buildMethod", v)}
            required error={errors.buildMethod}
          />

          {/* FINANCING */}
          <ChoiceSection
            id="bf-financing" title="How will the project be financed?"
            options={FINANCE} value={form.financing} onChange={(v) => set("financing", v)}
            required error={errors.financing}
          />
          {form.financing === "Other" && (
            <input
              className="bf-other-input"
              placeholder="Please specify financing…"
              value={form.financingOther}
              onChange={(e) => set("financingOther", e.target.value)}
            />
          )}

          {/* INTENDED USE (multi-select) */}
          <section className="bf-section" id="bf-intendedUse">
            <h4 className="bf-section-title">
              How will the ADU be used? <i className="bf-req">*</i>
              <span className="bf-multi-hint">select all that apply</span>
            </h4>
            <div className="bf-choices">
              {USE.map((u) => (
                <button
                  type="button"
                  key={u}
                  className={`bf-choice ${form.intendedUse.includes(u) ? "active" : ""}`}
                  onClick={() => toggleUse(u)}
                  aria-pressed={form.intendedUse.includes(u)}
                >
                  {u}
                </button>
              ))}
            </div>
            {errors.intendedUse && <span className="bf-error">{errors.intendedUse}</span>}
            {form.intendedUse.includes("Other") && (
              <input
                className="bf-other-input"
                placeholder="Please specify intended use…"
                value={form.intendedUseOther}
                onChange={(e) => set("intendedUseOther", e.target.value)}
              />
            )}
          </section>

          {submitError && <p className="bf-submit-error" role="alert">{submitError}</p>}
        </div>

        {/* Footer */}
        <div className="bf-foot">
          <span className="bf-foot-note">🔒 Your details are shared only with the FrameUpNow team.</span>
          <div className="bf-foot-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={busy}>
              {busy ? "Submitting…" : "Submit & unlock my site plan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ id, label, required, hint, error, children }) {
  return (
    <label className={`bf-field ${error ? "has-error" : ""}`} htmlFor={id}>
      <span className="bf-label">
        {label} {required && <i className="bf-req">*</i>}
        {hint && <i className="bf-hint">{hint}</i>}
      </span>
      {/* clone to inject id */}
      <span className="bf-control" id={id}>{children}</span>
      {error && <span className="bf-error">{error}</span>}
    </label>
  );
}

function ChoiceSection({ id, title, options, value, onChange, required, error }) {
  return (
    <section className="bf-section" id={id}>
      <h4 className="bf-section-title">
        {title} {required && <i className="bf-req">*</i>}
      </h4>
      <div className="bf-choices">
        {options.map((o) => (
          <button
            type="button"
            key={o}
            className={`bf-choice ${value === o ? "active" : ""}`}
            onClick={() => onChange(o)}
            aria-pressed={value === o}
          >
            {o}
          </button>
        ))}
      </div>
      {error && <span className="bf-error">{error}</span>}
    </section>
  );
}
