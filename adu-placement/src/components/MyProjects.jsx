import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { loadProjects, deleteProject } from "../lib/projects";

export default function MyProjects({ open, onClose, onLoad }) {
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    loadProjects(user.uid)
      .then(setProjects)
      .catch((e) => console.error("Load projects failed:", e))
      .finally(() => setLoading(false));
  }, [open, user]);

  if (!open) return null;

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteProject(user.uid, id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally { setDeletingId(null); }
  }

  function formatDate(ts) {
    if (!ts) return "";
    const d = ts.toDate?.() ?? new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const initials = user?.displayName
    ? user.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="projects-overlay" onClick={onClose} role="presentation">
      <aside
        className="projects-drawer"
        onClick={(e) => e.stopPropagation()}
        role="complementary"
        aria-label="My saved projects"
      >
        {/* Header */}
        <div className="projects-drawer-head">
          <div className="projects-user-row">
            <div className="projects-avatar">{initials}</div>
            <div className="projects-user-info">
              <span className="projects-user-name">
                {user?.displayName || user?.email}
              </span>
              <button
                className="auth-link"
                onClick={async () => { await signOut(); onClose(); }}
              >
                Sign out
              </button>
            </div>
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <h4 className="projects-drawer-title">My Projects</h4>

        {/* Project list */}
        <div className="projects-list">
          {loading && (
            <div className="projects-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="project-card-skeleton" />
              ))}
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="projects-empty">
              <p>No saved projects yet.</p>
              <p className="projects-empty-sub">
                Complete the wizard and click <strong>Save project</strong> in Step 6.
              </p>
            </div>
          )}

          {!loading && projects.map((pr) => (
            <div className="project-card" key={pr.id}>
              <button
                className="project-card-body"
                onClick={() => { onLoad(pr); onClose(); }}
                title="Load this project"
              >
                <span className="project-card-name">{pr.name || "Unnamed project"}</span>
                {pr.location?.placeName && (
                  <span className="project-card-address">
                    {pr.location.placeName.split(",").slice(0, 2).join(",")}
                  </span>
                )}
                <div className="project-card-meta">
                  {pr.floorPlanId && (
                    <span className="project-card-plan">
                      Plan · {pr.floorPlanId.split("-").slice(-1)[0]}
                    </span>
                  )}
                  <span className="project-card-date">{formatDate(pr.updatedAt)}</span>
                </div>
              </button>
              <button
                className="project-delete-btn"
                onClick={(e) => handleDelete(e, pr.id)}
                disabled={deletingId === pr.id}
                aria-label="Delete project"
                title="Delete"
              >
                {deletingId === pr.id ? "…" : "🗑"}
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
