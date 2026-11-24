// Which website sent this visitor to the tool, so each lead email can say so.
//
// Our sites add ?src=<site> to every link into the tool, plus ?from=<page>
// when the link sits on a plan page. A plain link with no ?src= falls back to
// the referrer. The answer is kept in localStorage so a reload — or finishing
// the request form days later — still credits the right site.
const KEY = "frameupnow-entry";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const SITES = {
  frameupnow:     { label: "frameupnow.com",     host: /(^|\.)frameupnow\.com$/i },
  aduplans:       { label: "aduplans.com",       host: /(^|\.)aduplans\.com$/i },
  houseplansfree: { label: "houseplansfree.com", host: /(^|\.)houseplansfree\.com$/i },
};

const siteForHost = (host) =>
  Object.keys(SITES).find((k) => SITES[k].host.test(host)) || null;

// Only accept a page on one of our own sites, so a crafted ?from= can't put
// an arbitrary link into the sales team's inbox.
function ownPage(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && siteForHost(u.hostname) ? `${u.origin}${u.pathname}` : null;
  } catch {
    return null;
  }
}

function remember(entry) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...entry, at: Date.now() })); } catch { /* ignore */ }
  return entry;
}

// → { site: "frameupnow" | "aduplans" | "houseplansfree" | "direct",
//     page: url | null,   the plan page they clicked from
//     plan: id | null }   the plan that page is about
export function readEntrySource() {
  const params = new URLSearchParams(window.location.search);
  const src = (params.get("src") || "").toLowerCase();
  const page = ownPage(params.get("from") || "");

  if (SITES[src]) {
    const samesite = page && siteForHost(new URL(page).hostname) === src;
    return remember({ site: src, page: samesite ? page : null, plan: samesite ? params.get("plan") : null });
  }

  let refSite = null;
  try { refSite = document.referrer ? siteForHost(new URL(document.referrer).hostname) : null; } catch { /* ignore */ }
  if (refSite) return remember({ site: refSite, page: null, plan: null });

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved?.site && Date.now() - (saved.at || 0) < MAX_AGE_MS) {
      return { site: saved.site, page: saved.page || null, plan: saved.plan || null };
    }
  } catch { /* ignore */ }
  return { site: "direct", page: null, plan: null };
}
