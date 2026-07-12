import Link from "next/link";
import Image from "next/image";
import { proxyImg } from "@/lib/img";
import { ImagePlaceholderIcon } from "@/components/icons";

export default function PlanCard({ plan, priority = false }) {
  const raw = plan.cardImage || plan.elevationImage || plan.floorPlanImage || plan.lotImage;
  const img = proxyImg(raw, 640); // cached, resized WebP via our edge proxy
  // Elevation renders look best filling the frame; floor-plan / lot drawings get
  // cropped by `cover`, so show those contained on a tinted panel instead.
  const isRender = !!plan.elevationImage;
  return (
    <Link
      href={`/plans/${plan.id}`}
      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-card)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-mist">
        {img ? (
          <Image
            src={img}
            alt={`${plan.displayName} — ${plan.bedsLabel}${plan.sqft ? `, ${plan.sqft} sq ft` : ""} ADU plan`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={
              isRender
                ? "object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                : "object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
            }
            priority={priority}
          />
        ) : (
          <div className="grid h-full place-items-center text-forest/25">
            <ImagePlaceholderIcon size={44} />
          </div>
        )}

        {plan.placeable && (
          <span className="chip absolute left-3 top-3 bg-forest text-white shadow-sm">
            <Dot /> Fits on your lot
          </span>
        )}
        {plan.stories === 2 && (
          <span className="chip absolute right-3 top-3 bg-night/80 text-white">2-Story</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-forest-600">
          <span>{plan.state}</span>
          {plan.jurisdiction && <span className="text-line">•</span>}
          <span className="truncate text-muted">{plan.jurisdiction}</span>
        </div>

        <h3 className="font-display text-[1.05rem] leading-snug text-ink line-clamp-2">
          {plan.displayName}
        </h3>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-ink-soft">
          {plan.sqft && <Spec>{plan.sqft.toLocaleString()} sqft</Spec>}
          <Spec>{plan.bedsLabel}</Spec>
          {plan.baths != null && <Spec>{plan.baths} bath</Spec>}
          {plan.width && plan.depth && (
            <Spec>{plan.width}′×{plan.depth}′</Spec>
          )}
        </div>
      </div>
    </Link>
  );
}

function Spec({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1 w-1 rounded-full bg-forest/40" />
      {children}
    </span>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-amber" />;
}
