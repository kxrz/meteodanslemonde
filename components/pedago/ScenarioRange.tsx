"use client"

import { useState } from "react"
import type { SeasonalProjection } from "@/lib/climate-season"
import { SEASON_LABEL, type Season } from "@/lib/season"
import { fmtDelta } from "@/lib/format"
import Explain from "@/components/ui/Explain"
import { cn } from "@/lib/cn"

const ORDER: Season[] = ["hiver", "printemps", "ete", "automne"]

interface Props {
  city: string
  /** projections saisonnières (seasonalProjections), par saison */
  bySeason: Record<Season, SeasonalProjection[]>
  initial: Season
}

/**
 * Projections par saison : valeur centrale SSP2-4.5 et fourchette entre scénarios (SSP1-2.6 → SSP5-8.5).
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
    <div className="flex flex-col gap-5 rounded-[var(--radius-card)] bg-white p-5 sm:p-7">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choisir la saison">
        {ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeason(s)}
            aria-pressed={season === s}
            className={cn(
              "min-h-11 rounded-full border-2 px-4 font-display text-[14px] font-bold capitalize transition-colors",
              season === s ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink",
            )}
          >
            {SEASON_LABEL[s]}
          </button>
        ))}
      </div>

      {has ? (
        <ul className="flex flex-col gap-6" aria-label={`Projections à ${city}, saison : ${SEASON_LABEL[season]}`}>
          {rows.map((r) => (
            <li key={r.year} className="grid grid-cols-[3.5rem_1fr] items-center gap-x-4 gap-y-1 sm:grid-cols-[4rem_1fr_13rem]">
              <span className="font-display text-[22px] font-extrabold tabular">{r.year}</span>
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
              <p className="col-start-2 text-[15px] leading-snug text-ink-soft sm:col-start-3">
                <strong className="font-display text-[19px] font-extrabold text-ink">{fmtDelta(r.central)}&#8239;°C</strong>
                {r.low != null && r.high != null && r.high - r.low >= 0.1 && (
                  <> · de {fmtDelta(r.low)} à {fmtDelta(r.high)}&#8239;°C</>
                )}
              </p>
            </li>
          ))}
          <li aria-hidden="true" className="grid grid-cols-[3.5rem_1fr] gap-x-4 sm:grid-cols-[4rem_1fr_13rem]">
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
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-chaud" /> scénario central SSP2-4.5</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-6 rounded-full bg-a-p1" /> fourchette entre scénarios <Explain term="ssp" /></span>
      </div>
      <p className="text-[13px] text-mute">
        Écart du ressenti maximal moyen de la saison par rapport au climat modélisé 2000-2020 (modèles CMIP6, GIEC AR6). Moyenne des trois mois de la saison.
      </p>
    </div>
  )
}
