import { ANOMALY_STEPS } from "@/lib/anomaly"
import Explain from "@/components/ui/Explain"
import { cn } from "@/lib/cn"

/** Légende commune à toutes les cartes et à tous les graphiques d'anomalie. */
export default function ScaleLegend({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <figure className={cn("flex flex-col gap-1.5", className)} aria-label="Légende : écart à la normale du mois">
      <div className="grid h-3 grid-cols-9 overflow-hidden rounded-full" aria-hidden="true">
        {ANOMALY_STEPS.map((s) => <span key={s.key} style={{ background: s.hex }} />)}
      </div>
      <figcaption className="flex items-center justify-between gap-2 font-mono text-[12px] text-mute">
        <span>−6&#8239;°C</span>
        {!compact && (
          <span className="flex items-center gap-1">
            écart à la normale du mois <Explain term="anomalie" />
          </span>
        )}
        <span>+6&#8239;°C</span>
      </figcaption>
      <ul className="sr-only">
        {ANOMALY_STEPS.map((s) => <li key={s.key}>{s.label}</li>)}
      </ul>
    </figure>
  )
}
