import MythCard, { type MythTone } from "@/components/myths/MythCard"
import MythDetails from "@/components/myths/MythDetails"
import SnapScroll from "@/components/myths/SnapScroll"
import type { Myth } from "@/lib/myths"
import type { PedagoContext } from "@/lib/pedago-data"
import { mythFact, mythShareText } from "@/lib/myth-facts"

const TONES: MythTone[] = ["signal", "ink", "white", "chaud"]
const SITE = "https://www.cestchaud.fr"

/** Le fil d'idées reçues : une carte story par idée reçue, avec les données de la ville choisie. */
export default function MythFeed({ myths, ctx, inSeason }: { myths: Myth[]; ctx: PedagoContext; inSeason: (m: Myth) => boolean }) {
  const { city } = ctx
  const withA = ctx.dotCities.filter((c) => c.anomaly != null)
  const facts = {
    cityName: city.name,
    month: ctx.month,
    trend: city.trend,
    shiftDays: city.shiftDays,
    frost: city.frost,
    extremesMin: city.extremes?.min ?? null,
    aboveCount: ctx.hasData ? withA.filter((c) => c.anomaly! >= 0.5).length : null,
    totalCities: ctx.dotCities.length,
    summer2050: city.future2050.find((s) => s.season === "ete")?.central ?? null,
  }
  return (
    <div className="flex flex-col gap-0 sm:gap-10">
      <SnapScroll />
      {myths.map((m, i) => (
        <MythCard
          key={m.slug}
          slug={m.slug}
          claim={m.claim}
          answer={m.answer}
          highlight={m.highlight}
          index={i}
          total={myths.length}
          inSeason={inSeason(m)}
          tone={TONES[i % TONES.length]}
          shareText={mythShareText(m, mythFact(m, facts))}
          shareUrl={`${SITE}/idees-recues/${m.slug}`}
          storyHref={`/idees-recues/${m.slug}/story-image`}
        >
          <MythDetails myth={m} ctx={ctx} />
        </MythCard>
      ))}
    </div>
  )
}
