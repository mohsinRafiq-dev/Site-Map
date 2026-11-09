// One rule set for both sides of the wire. The form runs these for instant
// per-field feedback; the API route runs the exact same function again, because
// a client-side check is a convenience and never a guarantee.
//
// Every rule here exists to stop a lead reaching Salesforce that Salesforce
// would reject. Web-to-Lead answers HTTP 200 no matter what and reports
// nothing back, so a rejection is invisible to us — the only trace is a
// "Salesforce Could Not Create This Lead" email to the org admin, and a
// customer who was told their message went through when it didn't. Catching it
// here is the only place we can still show the person a useful error.

// Standard Salesforce Lead field lengths. Overshoot these and the record is
// dropped rather than truncated.
export const LIMITS = {
  firstName: 40,
  lastName: 80,
  email: 80,
  phone: 40,
  subject: 255,
  message: 5000,
};

// Salesforce's documented Web-to-Lead phone rule, quoted verbatim in its
// rejection emails: "not more than 15 digits and not less than 9 digits".
export const PHONE_MIN_DIGITS = 9;
export const PHONE_MAX_DIGITS = 15;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export function phoneDigits(raw) {
  return (raw || "").replace(/\D/g, "");
}

// Drop a leading US country code so a normal 10-digit US number goes over as
// 10 digits rather than 11 — Salesforce counts digits, not formatting.
export function normalizePhone(raw) {
  const d = phoneDigits(raw);
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
}

// Salesforce requires Last Name and treats First Name as optional, so a
// single-word entry becomes the last name rather than being thrown away.
export function splitName(fullName) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: "", last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

// Returns { fieldName: message }. An empty object means the payload is clean.
export function validateContact(data = {}) {
  const errors = {};

  const fullName = (data.fullName || "").trim();
  const phone = (data.phone || "").trim();
  const email = (data.email || "").trim();
  const subject = (data.subject || "").trim();
  const message = (data.message || "").trim();

  if (!fullName) {
    errors.fullName = "Please enter your name.";
  } else {
    const { first, last } = splitName(fullName);
    if (last.length > LIMITS.lastName) {
      errors.fullName = `Please keep your name to ${LIMITS.lastName} characters or fewer.`;
    } else if (first.length > LIMITS.firstName) {
      errors.fullName = `Please keep your first name to ${LIMITS.firstName} characters or fewer.`;
    }
  }

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "That doesn't look like a valid email address.";
  } else if (email.length > LIMITS.email) {
    errors.email = `Email must be ${LIMITS.email} characters or fewer.`;
  }

  if (!phone) {
    errors.phone = "Please enter your phone number.";
  } else {
    const digits = normalizePhone(phone);
    if (digits.length < PHONE_MIN_DIGITS) {
      errors.phone = `Please enter a complete phone number — at least ${PHONE_MIN_DIGITS} digits.`;
    } else if (digits.length > PHONE_MAX_DIGITS) {
      errors.phone = `Phone number can be at most ${PHONE_MAX_DIGITS} digits.`;
    }
  }

  if (!subject) {
    errors.subject = "Please add a subject.";
  } else if (subject.length > LIMITS.subject) {
    errors.subject = `Please keep the subject to ${LIMITS.subject} characters or fewer.`;
  }

  if (!message) {
    errors.message = "Please enter a message.";
  } else if (message.length > LIMITS.message) {
    errors.message = `Please keep your message to ${LIMITS.message.toLocaleString()} characters or fewer.`;
  }

  return errors;
}
