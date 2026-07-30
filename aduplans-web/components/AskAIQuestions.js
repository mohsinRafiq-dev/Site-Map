"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { ArrowRightIcon, CloseIcon } from "@/components/icons";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://aduplans.com";
const STORE_KEY = "aduplans-ask-ai-open";

// Where a returning reader most likely wants to pick back up. Ask AI sits in
// the tools ribbon next to these, so they're the pages a reader is usually
// part-way through when a question occurs to them.
const RETURN_LINKS = [
  { label: "Cost Estimator", href: "/cost-estimator" },
  { label: "Plan Fit Visualizer", href: "/plan-fit-visualizer" },
  { label: "Browse Plans", href: "/plans" },
];

// The question in flight lives in sessionStorage, not React state, so the way
// back survives the reader being navigated clean off the site and pressing
// Back — that reloads this page and wipes anything held in memory.
const listeners = new Set();

function subscribe(onChange) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function readSent() {
  try {
    return sessionStorage.getItem(STORE_KEY);
  } catch {
    return null; // private mode / storage blocked
  }
}

function writeSent(question) {
  try {
    if (question) sessionStorage.setItem(STORE_KEY, question);
    else sessionStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore — the bar just won't persist across a reload */
  }
  listeners.forEach((fn) => fn());
}

// ChatGPT is somebody else's site — once the reader is over there we can't put
// a "back to ADUplans" button on the page. So the way home rides along inside
// the question, and the answer comes back with an aduplans.com link at the
// bottom of it. That's the only route home that survives the mobile case, where
// tapping a chatgpt.com link hands the reader to the ChatGPT app rather than a
// browser tab, and the site they came from is simply gone.
function chatGptUrl(question, returnTo) {
  const prompt =
    `${question}\n\n` +
    `When you have finished answering, end your reply with this line on its own: ` +
    `"Back to ADUplans.com → ${returnTo}"`;
  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}

export default function AskAIQuestions({ questions }) {
  // Server renders no bar; the client swaps in the real value after hydration.
  const sent = useSyncExternalStore(subscribe, readSent, () => null);

  const dismiss = useCallback(() => writeSent(null), []);

  return (
    <>
      <ol className="reveal-stagger border-t border-line">
        {questions.map((q, i) => (
          <li key={q} className="flex items-start gap-5 border-b border-line py-6">
            <span className="min-w-[26px] pt-1 font-display text-sm font-bold tracking-wide text-forest-600">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1">
              <p className="text-[17px] font-medium leading-relaxed text-ink">{q}</p>
              <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <a
                  href={chatGptUrl(q, SITE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => writeSent(q)}
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-forest-600"
                >
                  Ask ChatGPT <ArrowRightIcon size={14} className="-rotate-45" />
                </a>
                <span className="text-xs text-ink-soft">
                  Opens in a new tab — ADUplans stays open here.
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {sent && (
        <div role="status" className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="mx-auto flex max-w-3xl items-start gap-4 rounded-2xl border border-forest/25 bg-paper p-5 shadow-[var(--shadow-lift)]">
            <div className="flex-1">
              <p className="font-display text-base text-ink">Welcome back to ADUplans</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Your question is open in ChatGPT. Pick up where you left off:
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {RETURN_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={dismiss}
                    className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-forest-600"
                  >
                    {l.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-mist"
                >
                  Keep asking questions
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-mist hover:text-ink"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
