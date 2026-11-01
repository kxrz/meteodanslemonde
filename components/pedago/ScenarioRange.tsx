"use client"

import { useState } from "react"
import type { SeasonalProjection } from "@/lib/climate-season"
import { SEASON_LABEL, type Season } from "@/lib/season"
import { fmtDelta } from "@/lib/format"
import Explain from "@/components/ui/Explain"
import MobileMore from "@/components/ui/MobileMore"
import { cn } from "@/lib/cn"

const ORDER: Season[] = ["hiver", "printemps", "ete", "automne"]

interface Props {
  city: string
  /** projections saisonnières (seasonalProjections), par saison */
  bySeason: Record<Season, SeasonalProjection[]>
  initial: Season
}

/**
 * Projections par saison : médiane des modèles et fourchette entre modèles (voir lib/climate-season.ts).
 * Écart au climat modélisé 2000-2020. Une barre par horizon, sur une échelle commune aux 4 saisons.
 */
export default function ScenarioRange({ city, bySeason, initial }: Props) {
  const [season, setSeason] = useState<Season>(initial)
  const rows = bySeason[season] ?? []

  const all = ORDER.flatMap((s) => bySeason[s] ?? []).flatMap((p) => [p.low, p.high, p.central]).filter((v): v is number => v != null)
  const lo = Math.min(0, Math.floor(Math.min(...all, 0)))
  const hi = Math.max(1, Math.ceil(Math.max(...all, 1)))
  const pct = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`
  const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  const has = rows.some((r) => r.central != null)

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-white p-4 sm:gap-5 sm:p-7">
      <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2" role="group" aria-label="Choisir la saison">
        {ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeason(s)}
            aria-pressed={season === s}
            className={cn(
              "min-h-11 rounded-full border-2 px-1 font-display text-[13px] font-bold capitalize transition-colors sm:px-4 sm:text-[14px]",
              season === s ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink",
            )}
          >
            {SEASON_LABEL[s]}
          </button>
        ))}
      </div>

      {has ? (
        <ul className="flex flex-col gap-3 sm:gap-6" aria-label={`Projections à ${city}, saison : ${SEASON_LABEL[season]}`}>
          {rows.map((r) => (
            <li key={r.year} className="grid grid-cols-[3rem_1fr_4.5rem] items-center gap-x-3 gap-y-1 sm:grid-cols-[4rem_1fr_13rem] sm:gap-x-4">
              <span className="font-display text-[19px] font-extrabold tabular sm:text-[22px]">{r.year}</span>
              <div className="relative h-8" aria-hidden="true">
                <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-paper-deep" />
                <span className="absolute top-1/2 h-full w-px -translate-y-1/2 bg-ink/30" style={{ left: pct(0) }} />
                {r.low != null && r.high != null && (
                  <span
                    className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-a-p1"
                    style={{ left: pct(r.low), width: `calc(${pct(r.high)} - ${pct(r.low)})`, minWidth: 6 }}
                  />
                )}
                {r.central != null && (
                  <span className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-chaud shadow" style={{ left: pct(r.central) }} />
                )}
              </div>
              <p className="text-right text-[15px] leading-snug text-ink-soft sm:text-left">
                <strong className="font-display text-[19px] font-extrabold text-ink">{fmtDelta(r.central)}&#8239;°C</strong>
                {r.low != null && r.high != null && r.high - r.low >= 0.1 && (
                  <span className="hidden sm:inline"> · de {fmtDelta(r.low)} à {fmtDelta(r.high)}&#8239;°C</span>
                )}
              </p>
            </li>
          ))}
          <li aria-hidden="true" className="grid grid-cols-[3rem_1fr_4.5rem] gap-x-3 sm:grid-cols-[4rem_1fr_13rem] sm:gap-x-4">
            <span />
            <div className="relative h-4">
              {ticks.map((t) => (
                <span key={t} className="absolute -translate-x-1/2 font-mono text-[12px] text-mute tabular" style={{ left: pct(t) }}>
                  {fmtDelta(t, 0)}°
                </span>
              ))}
            </div>
          </li>
        </ul>
      ) : (
        <p className="rounded-2xl bg-paper p-4 text-[15px] text-ink-soft">Projections indisponibles pour cette ville.</p>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-mute">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-chaud" /> médiane des modèles</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-6 rounded-full bg-a-p1" /> fourchette entre modèles <Explain term="ssp" /></span>
      </div>
      <MobileMore label="Comment c'est calculé">
        <p className="text-[13px] text-mute">
          Écart du ressenti maximal moyen de la saison par rapport au climat modélisé 2000-2020 (modèles CMIP6, GIEC AR6). Moyenne des trois mois de la saison. La barre claire montre la fourchette entre modèles.
        </p>
      </MobileMore>
    </div>
  )
}
