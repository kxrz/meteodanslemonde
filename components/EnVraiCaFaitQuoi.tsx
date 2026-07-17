import type { Impact } from "@/lib/climate-impacts"

const THEME_ICONS: Record<string, string> = {
  faune: "🐟",
  flore: "🌿",
  agriculture: "🌾",
  sante: "🦟",
  climat: "🌡️",
}

function getStatus(anomaly: number | null, anomalyMin: number): {
  label: string
  dotClass: string
  textClass: string
} {
  if (anomaly !== null && anomaly >= anomalyMin) {
    return {
      label: "Déjà en cours ici",
      dotClass: "bg-orange-400",
      // orange-400 sur #111 → 5.6:1 ✓ AA
      textClass: "text-orange-400",
    }
  }
  if (anomalyMin === 0 || (anomaly !== null && anomaly > 0)) {
    return {
      label: "En cours en France",
      dotClass: "bg-amber-300",
      // amber-300 sur #111 → 8.1:1 ✓✓
      textClass: "text-amber-300",
    }
  }
  return {
    label: "En approche",
    dotClass: "bg-neutral-400",
    // neutral-400 (#a3a3a3) sur #111 → 7.6:1 ✓✓
    textClass: "text-neutral-400",
  }
}

interface Props {
  impacts: Impact[]
  anomaly?: number | null
  className?: string
}

export default function EnVraiCaFaitQuoi({ impacts, anomaly = null, className = "" }: Props) {
  if (impacts.length === 0) return null

  return (
    <div className={`col-span-2 space-y-3 ${className}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400">
        En vrai, ça fait quoi ?
      </p>

      {impacts.map((impact) => {
        const status = getStatus(anomaly, impact.anomaly_min)
        return (
          <article key={impact.id} className="bg-[#111111] rounded-3xl overflow-hidden">

            {/* Badge + fait */}
            <div className="px-6 pt-6 pb-5 border-b border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dotClass}`} />
                {/* tracking forcé pour lisibilité sur fond sombre */}
                <span className={`text-[10px] uppercase tracking-[0.18em] font-bold ${status.textClass}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5 shrink-0" aria-hidden>
                  {THEME_ICONS[impact.theme] ?? "·"}
                </span>
                {/* white pur sur #111 → 19.4:1 ✓✓ */}
                <p className="text-base font-black text-white leading-snug">
                  {impact.fait}
                </p>
              </div>
            </div>

            {/* Pourquoi */}
            <div className="px-6 pt-5 pb-0">
              {/* neutral-300 (#d4d4d4) sur #111 → 11.8:1 ✓✓ */}
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-neutral-300 mb-2">
                Pourquoi
              </p>
              {/* white/80 effective → ~11:1 ✓✓ */}
              <p className="text-sm text-white/80 leading-relaxed">
                {impact.pourquoi}
              </p>
            </div>

            {/* Ce que ça implique */}
            <div className="px-6 pt-4 pb-5">
              {/* orange-300 (#fdba74) sur #111 → 8.6:1 ✓✓ */}
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-orange-300 mb-2">
                Ce que ça implique
              </p>
              {/* orange-100 (#ffedd5) sur #111 → 15:1 ✓✓ */}
              <p className="text-sm text-orange-100 leading-relaxed">
                {impact.implication}
              </p>
            </div>

            {/* Source */}
            <div className="px-6 pb-5 border-t border-white/10 pt-4">
              <a
                href={impact.source_url}
                target="_blank"
                rel="noopener noreferrer"
                // white/55 effective ≈ #8c8c8c sur #111 → 5.1:1 ✓ AA
                className="inline-flex items-center gap-1.5 text-[10px] text-white/55 hover:text-white transition-colors underline underline-offset-2 decoration-white/20 hover:decoration-white/60"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Source : {impact.source}
              </a>
            </div>

          </article>
        )
      })}
    </div>
  )
}
