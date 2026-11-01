import Link from "next/link"
import AnomalyBreakdown from "@/components/pedago/AnomalyBreakdown"
import SeasonCurve from "@/components/pedago/SeasonCurve"
import FranceDotMap from "@/components/pedago/FranceDotMap"
import Card from "@/components/ui/Card"
import Eyebrow from "@/components/ui/Eyebrow"
import Explain from "@/components/ui/Explain"
import Hl from "@/components/ui/Hl"
import Num from "@/components/ui/Num"
import { ButtonLink, Arrow } from "@/components/ui/Button"
import type { Myth } from "@/lib/myths"
import type { PedagoContext } from "@/lib/pedago-data"
import { expectedFrostSeason, expectedFrostToDate } from "@/lib/pedago"
import { MONTHS, deMonth } from "@/lib/season"
import { fmt, fmtDelta } from "@/lib/format"
import { cn } from "@/lib/cn"

function Unavailable({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[var(--radius-card)] border-2 border-dashed border-line bg-white p-5 text-[16px] text-ink-soft">{children}</p>
}

const dateFr = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })

function FrostModule({ ctx }: { ctx: PedagoContext }) {
  const { city, month, monthLabel } = ctx
  const tonight = city.tonightMin
  if (!city.frost) {
    return (
      <Card tone="white" className="flex flex-col gap-4">
        <Eyebrow>Nuits de gel · {city.name}</Eyebrow>
        <p className="font-display text-[1.6rem] font-extrabold leading-tight">
          Données de gel <Hl tone="froid">en cours de calcul</Hl>.
        </p>
        <p className="text-[16px] text-ink-soft">
          Nous calculons le nombre de nuits de gel attendues, mois par mois, pour les 62 villes. En attendant : la normale {deMonth(month)} à {city.name} est de{" "}
          <strong>{fmt(city.normal)}&#8239;°C</strong> de ressenti maximal <Explain term="normale" />.
          {tonight != null && <> Cette nuit, le minimum relevé est de <strong>{fmt(tonight, 0)}&#8239;°C</strong>{tonight < 0 ? " : il a gelé." : " : pas de gel."}</>}
        </p>
      </Card>
    )
  }
  const frost = city.frost
  const max = Math.max(...frost, 1)
  const order = [7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6]
  const toDate = expectedFrostToDate(frost, new Date(ctx.dataDate))
  return (
    <Card tone="white" className="flex flex-col gap-4">
      <Eyebrow>Nuits de gel attendues · {city.name} <Explain term="nuitGel" /></Eyebrow>
      <p className="font-display text-[1.6rem] font-extrabold leading-tight">
        Un {monthLabel} normal, c&apos;est <Hl tone="froid"><Num value={frost[month]} decimals={0} /> nuits de gel</Hl>.
      </p>
      <div className="flex h-40 items-end gap-1.5" role="img" aria-label={`Nuits de gel attendues par mois à ${city.name}, d'août à juillet. ${expectedFrostSeason(frost)} par saison.`}>
        {order.map((m) => (
          <div key={m} className="flex flex-1 flex-col items-center gap-1">
            <span className="font-mono text-[12px] tabular text-mute">{frost[m] >= 0.5 ? fmt(frost[m], 0) : ""}</span>
            <span className={cn("w-full rounded-t-md", m === month ? "bg-froid" : "bg-a-m1")} style={{ height: `${(frost[m] / max) * 100}px` }} />
            <span className={cn("font-mono text-[12px]", m === month ? "font-bold text-ink" : "text-mute")}>{MONTHS[m][0].toUpperCase()}</span>
          </div>
        ))}
      </div>
      <p className="text-[16px] text-ink-soft">
        Depuis le 1er août, on en attendait <strong>{fmt(toDate, 0)}</strong> sur une saison qui en compte <strong>{fmt(expectedFrostSeason(frost), 0)}</strong> en moyenne (1991-2020).
        {city.tonightMin != null && <> Cette nuit : <strong>{fmt(city.tonightMin, 0)}&#8239;°C</strong>{city.tonightMin < 0 ? ", il a gelé." : ", pas de gel."}</>}
      </p>
    </Card>
  )
}

function ExtremesModule({ ctx }: { ctx: PedagoContext }) {
  const { city } = ctx
  const e = city.extremes
  if (!e) return <Unavailable>Extrêmes de l&apos;année indisponibles pour {city.name}.</Unavailable>
  const minMonth = new Date(`${e.minDate}T12:00:00`).getMonth()
  const minNormal = city.normals?.[minMonth] ?? null
  const year = e.maxDate.slice(0, 4)
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card tone="froid" className="flex flex-col gap-2">
        <Eyebrow className="text-white/80">Journée la plus froide de {year}</Eyebrow>
        <p className="font-display text-[clamp(2.4rem,6vw,3.6rem)] font-extrabold leading-none"><Num value={e.min} unit="&#8239;°C" /></p>
        <p className="text-[15px] leading-snug text-white/90">
          Ressenti maximal le {dateFr(e.minDate)} : même l&apos;après-midi, pas plus.
          {minNormal != null && <> Un {MONTHS[minMonth]} normal monte à {fmt(minNormal)}&#8239;°C.</>}
        </p>
      </Card>
      <Card tone="chaud" className="flex flex-col gap-2">
        <Eyebrow className="text-white/80">Journée la plus chaude de {year}</Eyebrow>
        <p className="font-display text-[clamp(2.4rem,6vw,3.6rem)] font-extrabold leading-none"><Num value={e.max} unit="&#8239;°C" /></p>
        <p className="text-[15px] leading-snug text-white/90">Ressenti maximal le {dateFr(e.maxDate)}.</p>
      </Card>
      <p className="text-[13px] text-mute sm:col-span-2">
        Les deux chiffres portent sur le ressenti maximal du jour (Open-Meteo) à {city.name}, depuis le 1er janvier. <Explain term="ressenti" />
        {city.trend != null && <> Tendance de fond pour {ctx.monthLabel} : {fmtDelta(city.trend)}&#8239;°C en 30 ans.</>}
      </p>
    </div>
  )
}

function TwinsModule({ ctx }: { ctx: PedagoContext }) {
  const { city } = ctx
  const summer = city.future2050.find((s) => s.season === "ete")
  const winter = city.future2050.find((s) => s.season === "hiver")
  return (
    <Card tone="ink" className="flex flex-col gap-4">
      <Eyebrow className="text-paper/70">{city.name} en 2050 <Explain term="projection" invert /></Eyebrow>
      {summer?.central != null && winter?.central != null ? (
        <p className="font-display text-[1.6rem] font-extrabold leading-tight">
          Été <span className="text-signal">{fmtDelta(summer.central)}&#8239;°C</span>, hiver <span className="text-signal">{fmtDelta(winter.central)}&#8239;°C</span>.
          <span className="mt-2 block font-sans text-[15px] font-normal text-paper/80">
            Scénario intermédiaire <Explain term="ssp" invert />, fourchette {fmtDelta(summer.low)} à {fmtDelta(summer.high)}&#8239;°C l&apos;été.
          </span>
        </p>
      ) : (
        <p className="text-[16px]">Projections indisponibles pour {city.name}.</p>
      )}
      <ButtonLink href={`/jumeaux?ville=${city.id}`} variant="paper" className="w-fit">Trouver le jumeau de {city.name} <Arrow /></ButtonLink>
    </Card>
  )
}

function Module({ myth, ctx }: { myth: Myth; ctx: PedagoContext }) {
  const { city, month, monthLabel, hasData } = ctx
  switch (myth.module) {
    case "breakdown":
      if (city.normal == null || city.trend == null) return <Unavailable>Normales indisponibles pour {city.name}.</Unavailable>
      if (city.today == null) return <Unavailable>Relevé du jour indisponible : impossible de décomposer l&apos;écart aujourd&apos;hui. La normale {deMonth(month)} à {city.name} a déjà pris {fmtDelta(city.trend)}&#8239;°C en 30 ans.</Unavailable>
      return <AnomalyBreakdown city={city.name} monthLabel={monthLabel} normal={city.normal} trend={city.trend} today={city.today} />
    case "curve":
      if (!city.normals || !city.trends || !city.proj2030 || !city.proj2050) return <Unavailable>Courbe indisponible pour {city.name}.</Unavailable>
      return <SeasonCurve city={city.name} normal={city.normals} trend={city.trends} proj2030={city.proj2030} proj2050={city.proj2050} month={month} shiftDays={city.shiftDays} />
    case "map":
      if (!hasData) return <Unavailable>Relevé du jour indisponible : la carte revient dès la prochaine mise à jour.</Unavailable>
      return <FranceDotMap cities={ctx.dotCities} monthLabel={monthLabel} />
    case "frost":
      return <FrostModule ctx={ctx} />
    case "extremes":
      return <ExtremesModule ctx={ctx} />
    case "twins":
      return <TwinsModule ctx={ctx} />
    default:
      return null
  }
}

/** Explication + données de la ville choisie + sources. Rendu serveur, glissé dans la carte story. */
export default function MythDetails({ myth, ctx }: { myth: Myth; ctx: PedagoContext }) {
  return (
    <>
      <div className="flex max-w-[65ch] flex-col gap-3">
        {myth.explanation.map((p, i) => (
          <p key={i} className={cn("leading-relaxed", i === 0 ? "text-[19px] font-medium text-ink" : "text-[17px] text-ink-soft")}>{p}</p>
        ))}
      </div>
      <Module myth={myth} ctx={ctx} />
      <div className="flex flex-col gap-1.5">
        <Eyebrow as="div">Sources</Eyebrow>
        <ul className="flex flex-col gap-1">
          {myth.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-2 hover:text-chaud">
                {s.label}<span className="sr-only"> (nouvel onglet)</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-mute">
          Chiffres de {ctx.city.name} : <Link href="/a-propos" className="underline underline-offset-2">méthode et sources</Link>.
        </p>
      </div>
    </>
  )
}
