import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// Emails allowed to view the admin panel. The Firestore rules enforce this
// server-side too — this list is also used there. Add/remove team members here.
export const ADMIN_EMAILS = [
  "fun.pradu@gmail.com",       // testing (yours)
  "rford@frameupnow.com",
  "hottmar@frameupnow.com",
  "bsendele@frameupnow.com",
];

export function isAdmin(user) {
  if (!user?.email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(user.email.toLowerCase());
}

// Load every lead, newest first. Requires the caller to be an admin (enforced
// by Firestore rules).
export async function loadLeads() {
  const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Update a lead's status (e.g. new → contacted → won/lost).
export async function setLeadStatus(id, status) {
  await updateDoc(doc(db, "leads", id), { status });
}

// Build a CSV string from the leads for download.
export function leadsToCsv(leads) {
  const cols = [
    ["Date", (l) => fmtDate(l.createdAt)],
    ["Name", (l) => l.name],
    ["Company", (l) => l.company],
    ["Email", (l) => l.email],
    ["Phone", (l) => l.phone],
    ["County", (l) => l.county],
    ["State", (l) => l.state],
    ["Timeline", (l) => l.timeline],
    ["Build method", (l) => l.buildMethod],
    ["Financing", (l) => l.financing],
    ["Intended use", (l) => (Array.isArray(l.intendedUse) ? l.intendedUse.join("; ") : l.intendedUse)],
    ["Plan", (l) => l.planName || l.planId],
    ["Plan series", (l) => l.planSeries],
    ["Plan sqft", (l) => l.planSqft],
    ["Address", (l) => l.address],
    ["Status", (l) => l.status],
  ];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = cols.map(([h]) => escape(h)).join(",");
  const rows = leads.map((l) => cols.map(([, fn]) => escape(fn(l))).join(","));
  return [header, ...rows].join("\r\n");
}

export function fmtDate(ts) {
  if (!ts) return "";
  const d = ts.toDate?.() ?? new Date(ts);
  return d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
