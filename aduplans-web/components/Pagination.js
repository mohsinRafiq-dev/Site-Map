import Link from "next/link";

export default function Pagination({ current, totalPages, makeHref }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const push = (n) => pages.push(n);
  push(1);
  for (let n = current - 1; n <= current + 1; n++) if (n > 1 && n < totalPages) push(n);
  if (totalPages > 1) push(totalPages);
  const unique = [...new Set(pages)].sort((a, b) => a - b);

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <PageLink disabled={current === 1} href={makeHref(current - 1)}>‹ Prev</PageLink>
      {unique.map((n, i) => {
        const gap = i > 0 && n - unique[i - 1] > 1;
        return (
          <span key={n} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-muted">…</span>}
            <Link
              href={makeHref(n)}
              scroll
              className={`grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                n === current
                  ? "bg-forest text-white"
                  : "border border-line bg-paper text-ink-soft hover:border-forest/40"
              }`}
            >
              {n}
            </Link>
          </span>
        );
      })}
      <PageLink disabled={current === totalPages} href={makeHref(current + 1)}>Next ›</PageLink>
    </nav>
  );
}

function PageLink({ disabled, href, children }) {
  if (disabled) {
    return (
      <span className="grid h-10 place-items-center rounded-lg border border-line/60 px-3 text-sm font-medium text-line">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll
      className="grid h-10 place-items-center rounded-lg border border-line bg-paper px-3 text-sm font-medium text-ink-soft transition-colors hover:border-forest/40"
    >
      {children}
    </Link>
  );
}
