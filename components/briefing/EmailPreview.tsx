import { anomalyWords } from "@/lib/anomaly"
import { fmt, fmtDeltaTemp, fmtTemp } from "@/lib/format"
import { MONTHS, SEASON_LABEL, deMonth, seasonOf } from "@/lib/season"
import { mythOfTheDay } from "@/lib/myths"
import { dailyAdvice } from "@/lib/email-builder"
import type { briefingExample } from "@/lib/briefing-example"
import { cn } from "@/lib/cn"

type Example = NonNullable<ReturnType<typeof briefingExample>>

/**
 * Aperçu fidèle de l'email du matin (mêmes règles que lib/email-builder.ts).
 * Purement illustratif : aucun élément focalisable, tout est décrit par la légende.
 */
export default function EmailPreview({ example, month, date }: { example: Example; month: number; date: Date }) {
  const season = seasonOf(month)
  const myth = mythOfTheDay(season, date)
  const advice = dailyAdvice(example)
  const dayLabel = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  const tone = example.anomaly! >= 0.5 ? "text-chaud" : example.anomaly! <= -0.5 ? "text-froid" : "text-ink"

  return (
    <figure className="mx-auto w-full max-w-sm">
      <div className="overflow-hidden rounded-[var(--radius-card)] border-2 border-ink bg-white shadow-[0_8px_0_0_var(--color-ink)]">
        <div className="bg-ink px-5 py-4 text-paper">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-signal">cestchaud.fr · briefing</p>
          <p className="font-display text-lg font-extrabold first-letter:uppercase">{dayLabel}</p>
        </div>
        <div className="flex flex-col gap-3 px-5 py-5">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-mute">{example.name}</p>
          <p className="font-display text-[3.2rem] font-extrabold leading-none">
            {fmt(example.apparentTempMax, 0)}°<span className="ml-1 align-middle font-sans text-[14px] font-normal text-mute">ressenti max</span>
          </p>
          <p className={cn("font-display text-[17px] font-bold leading-snug", tone)}>
            {fmtDeltaTemp(example.anomaly)} vs un {MONTHS[month]} normal ({fmtTemp(example.normal)}) : {anomalyWords(example.anomaly)}.
          </p>

          {advice && (
            <div className={cn("border-l-4 bg-paper px-3 py-2", advice.tone === "froid" ? "border-froid" : "border-chaud")}>
              <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em]">{advice.title}</p>
              <p className="text-[13px] leading-snug text-ink-soft">
                {example.tempMin != null && advice.title === "Nuit de gel" ? <>Minimale prévue : {fmtTemp(example.tempMin)}. </> : null}
                {advice.text}
              </p>
            </div>
          )}

          {(example.trend != null || example.projection?.central != null) && (
            <div className="border-l-4 border-line bg-paper px-3 py-2">
              <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em]">Le climat derrière la météo</p>
              {example.trend != null && (
                <p className="text-[13px] leading-snug text-ink-soft">En 30 ans, la normale {deMonth(month)} a bougé de <strong className="text-ink">{fmtDeltaTemp(example.trend)}</strong>.</p>
              )}
              {example.projection?.central != null && (
                <p className="mt-1 text-[13px] leading-snug text-ink-soft">
                  {SEASON_LABEL[season].charAt(0).toUpperCase() + SEASON_LABEL[season].slice(1)} 2050 : <strong className="text-ink">{fmtDeltaTemp(example.projection.central)}</strong>
                  {example.projection.low != null && example.projection.high != null && example.projection.high - example.projection.low >= 0.1 && <> (de {fmtDeltaTemp(example.projection.low)} à {fmtDeltaTemp(example.projection.high)})</>}.
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-signal px-3 py-3">
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em]">Idée reçue du jour</p>
            <p className="mt-1 font-display text-[15px] font-extrabold leading-snug">{myth.answer}</p>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-[13px] text-mute">
        Exemple pour {example.name} : normale, tendance et projection réelles, écart du jour fictif.
      </figcaption>
    </figure>
  )
}
