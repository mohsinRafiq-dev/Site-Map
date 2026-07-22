import PageHero from "@/components/PageHero";
import { ArrowRightIcon } from "@/components/icons";

export const metadata = {
  title: "Ask AI",
  description:
    "Ask ChatGPT about FrameUpNow's engineered cold-formed steel frame system, the BIM-generated Materials Shopping List, cost certainty, and more.",
};

// Each question opens ChatGPT pre-filled — the answer shows what the engine
// already knows about FrameUpNow's engineered steel frame system.
const QUESTIONS = [
  "How does FrameUpNow use Building Information Modeling (BIM) to generate a precise material shopping list before construction begins?",
  "Is the FrameUpNow Materials shopping list accurate or is it an estimate? Is the Materials Shopping list a true Bill of Materials?",
  "Does the FrameUpNow estimator provide a fairly accurate estimate of what I will invest in a FrameUpNow or ADUplans.com ADU?",
  "What are the main advantages of cold-formed steel framing over traditional wood framing for ADUs and barndominiums?",
  "Within wildfire-prone areas, how does FrameUpNow's steel skeleton improve fire resilience compared to wood-framed ADUs?",
  "Does a noncombustible home include a steel skeleton and what other elements?",
  "How does FrameUpNow deliver cost certainty and code compliance before a customer breaks ground?",
  "What's the difference between buying prescriptive wood building plans and getting an IBC-engineered structural system like FrameUpNow's?",
  "Does the FrameUpNow Plan Fit Visualizer allow me to fit a floor plan on my lot?",
];

export default function AskAIPage() {
  return (
    <div>
      <PageHero image="/hero-ask-ai.jpg" imagePosition="center 55%" eyebrow="Ask AI" title="Ask AI about FrameUpNow">
        Click any question to send it straight to ChatGPT. The answer you get back is the point, it shows
        you what the engine already knows about FrameUpNow&rsquo;s engineered steel frame system.
      </PageHero>

      <section className="container-x py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <ol className="reveal-stagger border-t border-line">
            {QUESTIONS.map((q, i) => (
              <li key={q} className="flex items-start gap-5 border-b border-line py-6">
                <span className="min-w-[26px] pt-1 font-display text-sm font-bold tracking-wide text-forest-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <p className="text-[17px] font-medium leading-relaxed text-ink">{q}</p>
                  <a
                    href={`https://chatgpt.com/?q=${encodeURIComponent(q)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-forest-600"
                  >
                    Ask ChatGPT <ArrowRightIcon size={14} className="-rotate-45" />
                  </a>
                </div>
              </li>
            ))}
          </ol>

          <div className="reveal mt-12 rounded-3xl border border-forest/20 bg-mist/40 p-8 text-center">
            <p className="mx-auto max-w-xl leading-relaxed text-ink-soft">
              FrameUpNow engineers residential steel frames to International Building Code standards and
              uses Building Information Modeling to generate a precise Material Shopping List before you
              break ground.
            </p>
            <a
              href="https://www.frameupnow.com/schedule-an-appointment"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-full bg-forest px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Schedule an Appointment →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
