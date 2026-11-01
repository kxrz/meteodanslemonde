import type { Impact } from "@/lib/climate-impacts"
import { impactStatus } from "@/lib/city-page"
import { fmtDelta } from "@/lib/format"
import Card from "@/components/ui/Card"
import Eyebrow from "@/components/ui/Eyebrow"
import { cn } from "@/lib/cn"

const THEME_LABEL: Record<string, string> = {
  faune: "Faune",
  flore: "Flore",
  agriculture: "Agriculture",
  sante: "Santé",
  climat: "Climat",
}

interface Props {
  impacts: Impact[]
  /** tendance observée de la saison en cours (climat, 30 ans), PAS l'écart du jour */
  seasonTrend: number | null
  /** « l'automne », « l'hiver », « le printemps », « l'été » */
  seasonLabel: string
  className?: string
}

/**
 * Impacts concrets. Le statut repose sur la tendance de fond de la saison (le climat),
 * jamais sur l'anomalie d'une seule journée (la météo).
 */
export default function EnVraiCaFaitQuoi({ impacts, seasonTrend, seasonLabel, className }: Props) {
  if (impacts.length === 0) return null

  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      {impacts.map((impact) => {
        const status = impactStatus(seasonTrend, impact.anomaly_min)
        const badge =
          status === "tendance"
            ? { text: `Déjà là : ${seasonLabel} a pris ${fmtDelta(seasonTrend)} °C`, cls: "bg-chaud text-white" }
            : status === "france"
              ? { text: "Déjà observé en France", cls: "bg-signal text-ink" }
              : { text: "Seuil pas encore atteint ici", cls: "bg-paper text-ink" }
        return (
          <Card key={impact.id} as="article" tone="ink" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-xl px-3 py-1 font-mono text-[12px] font-semibold", badge.cls)}>{badge.text}</span>
              <Eyebrow as="span" className="text-paper/70">{THEME_LABEL[impact.theme] ?? impact.theme}</Eyebrow>
            </div>
            <p className="font-display text-[1.35rem] font-extrabold leading-tight">{impact.fait}</p>
            <div className="flex flex-col gap-1">
              <Eyebrow as="span" className="text-paper/70">Pourquoi</Eyebrow>
              <p className="text-[15px] leading-relaxed text-paper/85">{impact.pourquoi}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Eyebrow as="span" className="text-signal">Ce que ça implique</Eyebrow>
              <p className="text-[15px] leading-relaxed text-paper/85">{impact.implication}</p>
            </div>
            <a
              href={impact.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex min-h-11 items-center text-[13px] text-paper/75 underline underline-offset-2 hover:text-paper"
            >
              Source : {impact.source}
            </a>
          </Card>
        )
      })}
    </div>
  )
}
