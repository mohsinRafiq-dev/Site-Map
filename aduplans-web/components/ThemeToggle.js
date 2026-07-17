"use client";

import { useEffect, useSyncExternalStore } from "react";

// The current theme is external state (a `data-theme` attribute on <html> set by
// the no-flash script in the root layout). Read it via useSyncExternalStore so
// there's no setState-in-effect and no hydration mismatch.
function subscribe(callback) {
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => obs.disconnect();
}
function getSnapshot() {
  return document.documentElement.getAttribute("data-theme") || "light";
}
function getServerSnapshot() {
  return "light";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";

  // Enable the color transition only after first paint (avoids a flash).
  useEffect(() => {
    requestAnimationFrame(() => document.documentElement.classList.add("theme-ready"));
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    // Setting the attribute triggers the MutationObserver → store re-render.
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("aduplans-theme", next);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:bg-mist hover:text-ink"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}
