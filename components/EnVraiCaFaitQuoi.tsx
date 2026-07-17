import type { Impact } from "@/lib/climate-impacts"

const THEME_ICONS: Record<string, string> = {
  faune: "🐟",
  flore: "🌿",
  agriculture: "🌾",
  sante: "🦟",
  climat: "🌡️",
}

interface Props {
  impacts: Impact[]
  className?: string
}

export default function EnVraiCaFaitQuoi({ impacts, className = "" }: Props) {
  if (impacts.length === 0) return null

  return (
    <div className={`col-span-2 space-y-3 ${className}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400">
        En vrai, ça fait quoi ?
      </p>

      {impacts.map((impact) => (
        <article key={impact.id} className="bg-[#111111] rounded-3xl overflow-hidden">
          {/* Fait — accroche forte */}
          <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5 shrink-0" aria-hidden>
                {THEME_ICONS[impact.theme] ?? "·"}
              </span>
              <p className="text-base font-black text-white leading-snug">
                {impact.fait}
              </p>
            </div>
          </div>

          {/* Pourquoi + Implication */}
          <div className="px-6 py-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-1.5">
                Pourquoi
              </p>
              <p className="text-sm text-white/60 leading-relaxed">
                {impact.pourquoi}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-400/70 mb-1.5">
                Ce que ça implique
              </p>
              <p className="text-sm text-orange-100/80 leading-relaxed">
                {impact.implication}
              </p>
            </div>
          </div>

          {/* Source */}
          <div className="px-6 pb-5">
            <a
              href={impact.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-white/20 hover:text-white/50 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Source : {impact.source}
            </a>
          </div>
        </article>
      ))}
    </div>
  )
}
