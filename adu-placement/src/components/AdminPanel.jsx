import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { isAdmin, loadLeads, setLeadStatus, leadsToCsv, fmtDate } from "../lib/leadsAdmin";
import AuthModal from "./AuthModal";

const STATUSES = ["new", "contacted", "quoted", "won", "lost"];

export default function AdminPanel({ onExit }) {
  const { user, authLoading, signOut } = useAuth();
  const admin = isAdmin(user);

  const [authOpen, setAuthOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!admin) return;
    setLoading(true);
    setError(null);
    loadLeads()
      .then(setLeads)
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [admin]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 864e5;
    const inWeek = leads.filter((l) => {
      const d = l.createdAt?.toDate?.() ?? (l.createdAt ? new Date(l.createdAt) : null);
      return d && d.getTime() >= weekAgo;
    }).length;
    return {
      total: leads.length,
      neu: leads.filter((l) => (l.status || "new") === "new").length,
      week: inWeek,
    };
  }, [leads]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && (l.status || "new") !== statusFilter) return false;
      if (!q) return true;
      return [l.name, l.email, l.phone, l.county, l.state, l.planName, l.planId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [leads, search, statusFilter]);

  async function changeStatus(id, status) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    if (selected?.id === id) setSelected((s) => ({ ...s, status }));
    try { await setLeadStatus(id, status); } catch (e) { console.error(e); }
  }

  function downloadCsv() {
    const csv = leadsToCsv(visible);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `frameupnow-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  // ---- Gates ----
  if (authLoading) {
    return <AdminShell onExit={onExit}><div className="admin-center">Loading…</div></AdminShell>;
  }
  if (!user) {
    return (
      <AdminShell onExit={onExit}>
        <div className="admin-center admin-gate">
          <div className="admin-gate-icon">🔒</div>
          <h2>Team sign-in required</h2>
          <p>Sign in with your FrameUpNow account to view leads.</p>
          <button className="btn btn-accent" onClick={() => setAuthOpen(true)}>Sign in</button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />
      </AdminShell>
    );
  }
  if (!admin) {
    return (
      <AdminShell onExit={onExit} user={user} onSignOut={signOut}>
        <div className="admin-center admin-gate">
          <div className="admin-gate-icon">⛔</div>
          <h2>Access denied</h2>
          <p><strong>{user.email}</strong> isn't on the admin list. Ask an admin to add you.</p>
          <button className="btn btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </AdminShell>
    );
  }

  // ---- Dashboard ----
  return (
    <AdminShell onExit={onExit} user={user} onSignOut={signOut}>
      <div className="admin-stats">
        <Stat label="Total leads" value={stats.total} />
        <Stat label="New" value={stats.neu} accent />
        <Stat label="This week" value={stats.week} />
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <input
            placeholder="Search name, email, phone, plan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-select">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button className="btn btn-ghost sm" onClick={downloadCsv} disabled={!visible.length}>⬇ CSV</button>
        <button className="btn btn-ghost sm" onClick={() => { setLoading(true); loadLeads().then(setLeads).finally(() => setLoading(false)); }}>↻</button>
      </div>

      {error && <div className="admin-error">Couldn't load leads. Check your access / Firestore rules.</div>}

      {loading ? (
        <div className="admin-center">Loading leads…</div>
      ) : visible.length === 0 ? (
        <div className="admin-center admin-empty">{leads.length === 0 ? "No leads yet." : "No leads match your filters."}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th><th>Name</th><th>Contact</th><th>Location</th><th>Plan</th><th>Timeline</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((l) => (
                <tr key={l.id} onClick={() => setSelected(l)} className="admin-row">
                  <td className="admin-dim">{fmtDate(l.createdAt)}</td>
                  <td><strong>{l.name || "—"}</strong></td>
                  <td className="admin-dim">{l.email}<br />{l.phone}</td>
                  <td className="admin-dim">{[l.county, l.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="admin-dim">{l.planName || l.planId || "—"}</td>
                  <td className="admin-dim">{l.timeline || "—"}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <StatusPill value={l.status || "new"} onChange={(s) => changeStatus(l.id, s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <LeadDetail lead={selected} onClose={() => setSelected(null)} onStatus={(s) => changeStatus(selected.id, s)} />
      )}
    </AdminShell>
  );
}

function AdminShell({ children, onExit, user, onSignOut }) {
  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="admin-brand">
          <div className="admin-brand-mark">
            <svg viewBox="0 0 32 32" width="20" height="20"><path d="M4 16 L16 6 L28 16 L28 26 L20 26 L20 18 L12 18 L12 26 L4 26 Z" fill="currentColor"/></svg>
          </div>
          <div>
            <strong>FrameUpNow</strong>
            <span className="admin-tag">Lead Dashboard</span>
          </div>
        </div>
        <div className="admin-header-actions">
          {user && <span className="admin-user">{user.email}</span>}
          {user && onSignOut && <button className="btn btn-ghost sm" onClick={onSignOut}>Sign out</button>}
          <button className="btn btn-ghost sm" onClick={onExit}>← Back to tool</button>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`admin-stat ${accent ? "accent" : ""}`}>
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  );
}

function StatusPill({ value, onChange }) {
  return (
    <select className={`admin-status admin-status--${value}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
    </select>
  );
}

function LeadDetail({ lead, onClose, onStatus }) {
  const uses = Array.isArray(lead.intendedUse) ? lead.intendedUse.join(", ") : lead.intendedUse;
  const Row = ({ k, v }) => (
    <div className="admin-d-row"><span>{k}</span><span>{v || "—"}</span></div>
  );
  return (
    <div className="admin-detail-overlay" onClick={onClose}>
      <aside className="admin-detail" onClick={(e) => e.stopPropagation()}>
        <div className="admin-detail-head">
          <div>
            <h3>{lead.name || "Lead"}</h3>
            <span className="admin-dim">{fmtDate(lead.createdAt)}</span>
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="admin-detail-body">
          <StatusPill value={lead.status || "new"} onChange={onStatus} />
          <h4>Contact</h4>
          <Row k="Email" v={lead.email} />
          <Row k="Phone" v={lead.phone} />
          <Row k="Company" v={lead.company} />
          <Row k="County" v={lead.county} />
          <Row k="State" v={lead.state} />
          <h4>Project</h4>
          <Row k="Timeline" v={lead.timeline} />
          <Row k="Build method" v={lead.buildMethod} />
          <Row k="Financing" v={lead.financing} />
          <Row k="Intended use" v={uses} />
          <h4>Plan &amp; Lot</h4>
          <Row k="Plan" v={lead.planName ? `${lead.planName} (${lead.planSeries || ""})` : lead.planId} />
          <Row k="Plan size" v={lead.planSqft ? `${lead.planSqft} sq ft` : "—"} />
          <Row k="Address" v={lead.address} />
          <Row k="Lot" v={lead.lot ? `${lead.lot.width}' × ${lead.lot.length}'` : "—"} />
          <a className="btn btn-accent w-full" href={`mailto:${lead.email}`} style={{ marginTop: 14 }}>✉ Email {lead.name?.split(" ")[0] || "lead"}</a>
        </div>
      </aside>
    </div>
  );
}
