import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { slugify } from "@/lib/slugify"
import { fmt, fmtDelta, fmtDeltaTemp } from "@/lib/format"
import { MONTHS, deMonth, isHotSeason, seasonOf, seasonalMean } from "@/lib/season"
import { loadClimateFull, seasonalProjections } from "@/lib/climate-season"
import { hasLiveData, inSeason, mean1, theSeason } from "@/lib/city-page"
import { REGIONS, regionDescription } from "@/lib/regions"
import { getWeatherData } from "@/lib/weather-data"
import { fetchFireRisk, fetchFireSummary, type FireRiskLevel } from "@/lib/fire-data"
import { getImpacts } from "@/lib/climate-impacts"
import PageShell from "@/components/ui/PageShell"
import Section from "@/components/ui/Section"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Num from "@/components/ui/Num"
import Card from "@/components/ui/Card"
import Stat from "@/components/ui/Stat"
import Eyebrow from "@/components/ui/Eyebrow"
import Explain from "@/components/ui/Explain"
import AnomalyChip from "@/components/ui/AnomalyChip"
import ScaleLegend from "@/components/ui/ScaleLegend"
import { Arrow } from "@/components/ui/Button"
import RegionCitiesMap from "@/components/RegionCitiesMap"
import EnVraiCaFaitQuoi from "@/components/EnVraiCaFaitQuoi"
import { cn } from "@/lib/cn"
import { meteoUrl } from "@/lib/open-meteo"

export const revalidate = 86400

const FIRE_PRONE = new Set(["provence-alpes-cote-d-azur", "occitanie", "nouvelle-aquitaine", "corse", "auvergne-rhone-alpes"])

const FIRE_RISK_STYLE: Record<FireRiskLevel, { card: string; label: string }> = {
  low: { card: "bg-paper-deep text-ink", label: "Faible" },
  moderate: { card: "bg-hl-signal text-ink", label: "Modéré" },
  high: { card: "bg-hl-chaud text-ink", label: "Élevé" },
  extreme: { card: "bg-chaud text-white", label: "Extrême" },
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const citiesFR = require("@/data/cities-fr.json") as Array<{ id: string; name: string; lat: number; lon: number; region: string }>

type Rain =
  | { kind: "ok"; city: string; current: number; normal: number; anomaly: number; daysElapsed: number }
  | { kind: "early"; city: string }
  | { kind: "error"; city: string }

/** Cumul de pluie du mois À UNE VILLE de référence (pas la région), comparé à 2013-2022 au prorata. */
async function fetchRain(city: { name: string; lat: number; lon: number }, now: Date): Promise<Rain> {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const daysInMonth = new Date(y, now.getMonth() + 1, 0).getDate()
  const daysElapsed = now.getDate()
  if (daysElapsed < 3) return { kind: "early", city: city.name }
  const rain = (start: string, end: string) => meteoUrl("archive", { latitude: city.lat, longitude: city.lon, daily: "precipitation_sum", start_date: start, end_date: end })
  try {
    const [rc, rn] = await Promise.all([
      fetch(rain(`${y}-${m}-01`, `${y}-${m}-${d}`), { next: { revalidate: 86400 } }),
      fetch(rain(`2013-${m}-01`, `2022-${m}-${String(daysInMonth).padStart(2, "0")}`), { next: { revalidate: 86400 } }),
    ])
    if (!rc.ok || !rn.ok) throw new Error("archive")
    const [dc, dn] = await Promise.all([rc.json(), rn.json()])
    const sum = (arr: (number | null)[]) => arr.filter((v): v is number => v != null).reduce((s, v) => s + v, 0)
    const current = Math.round(sum(dc.daily.precipitation_sum))
    const normal = Math.round((sum(dn.daily.precipitation_sum) / 10) * (daysElapsed / daysInMonth))
    if (normal <= 0) throw new Error("normale nulle")
    return { kind: "ok", city: city.name, current, normal, anomaly: Math.round(((current - normal) / normal) * 100), daysElapsed }
  } catch {
    return { kind: "error", city: city.name }
  }
}

export async function generateStaticParams() {
  return Object.keys(REGIONS).map((region) => ({ region }))
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params
  const meta = REGIONS[region]
  if (!meta) return {}
  const title = `${meta.label} : l'écart à la normale, ville par ville · cestchaud.fr`
  const description = `${meta.label} : écart du jour à la normale, tendance ERA5 sur 30 ans et projections GIEC par saison. ${regionDescription(region, new Date().getMonth())?.slice(0, 110) ?? ""}`
  return {
    title,
    description,
    alternates: { canonical: `https://www.cestchaud.fr/r/${region}` },
    openGraph: { title, description, url: `https://www.cestchaud.fr/r/${region}`, siteName: "cestchaud.fr", locale: "fr_FR", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params
  const meta = REGIONS[region]
  if (!meta) notFound()
  const cities = citiesFR.filter((c) => c.region === meta.label)
  if (cities.length === 0) notFound()

  const weather = await getWeatherData()
  const live = hasLiveData(weather.citiesFR)
  const refDate = live ? new Date(weather.fetchedAt) : new Date()
  const month = refDate.getMonth()
  const monthName = MONTHS[month]
  const season = seasonOf(month)
  const full = loadClimateFull()

  const rows = cities.map((c) => {
    const f = full[c.id]
    const w = live ? weather.citiesFR.find((x) => x.id === c.id) : undefined
    const normal = f?.normal?.[month] ?? null
    const temp = w ? w.apparent_temp_max : null
    const anomaly = temp != null && normal != null ? Math.round((temp - normal) * 10) / 10 : null
    return {
      ...c,
      slug: slugify(c.name),
      normal,
      temp,
      anomaly,
      seasonTrend: seasonalMean(f?.trend, season),
      p2050: seasonalProjections(f, season).find((p) => p.year === 2050) ?? null,
    }
  })
  const sorted = [...rows].sort((a, b) => (b.anomaly ?? -99) - (a.anomaly ?? -99))
  const avgAnomaly = mean1(rows.map((r) => r.anomaly))
  const avgTrend = mean1(rows.map((r) => r.seasonTrend))
  const avg2050 = mean1(rows.map((r) => r.p2050?.central))
  const avg2050Low = mean1(rows.map((r) => r.p2050?.low))
  const avg2050High = mean1(rows.map((r) => r.p2050?.high))
  const description = regionDescription(region, month)
  const single = cities.length === 1

  const hot = isHotSeason(month)
  const isFireProne = FIRE_PRONE.has(region)
  const refCity = cities[0] // ville de référence pour la pluie : la première (la plus peuplée) de la région
  const [rain, fireRisk, fireSummary] = await Promise.all([
    fetchRain(refCity, new Date()),
    isFireProne && hot ? fetchFireRisk(refCity.lat, refCity.lon) : Promise.resolve(null),
    isFireProne && hot ? fetchFireSummary() : Promise.resolve(null),
  ])

  const dayOfYear = Math.floor((refDate.getTime() - new Date(refDate.getFullYear(), 0, 0).getTime()) / 86_400_000)
  const impacts = getImpacts({ regionSlug: region, month: month + 1, count: 2, seed: dayOfYear })
  const tone = avgAnomaly == null ? "signal" : avgAnomaly >= 0.5 ? "chaud" : avgAnomaly <= -0.5 ? "froid" : "signal"
  const dataLabel = refDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  const enRegion = meta.label === "Corse" || meta.label === "Bretagne" || meta.label === "Normandie" || meta.label === "Occitanie" || meta.label === "Nouvelle-Aquitaine" || meta.label === "Île-de-France"
    ? `en ${meta.label}` : `dans la région ${meta.label}`

  const pageUrl = `https://www.cestchaud.fr/r/${region}`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: pageUrl,
    name: `${meta.label} : l'écart à la normale, ville par ville`,
    description: `Écart du jour, tendance ERA5 et projections GIEC pour les villes de ${meta.label}.`,
    about: { "@type": "AdministrativeArea", name: meta.label, containedInPlace: { "@type": "Country", name: "France", identifier: "FR" } },
    ...(avgTrend != null && {
      additionalProperty: { "@type": "PropertyValue", name: `Tendance ERA5 (${theSeason(season)})`, value: `${fmtDelta(avgTrend)} °C sur 30 ans` },
    }),
  }

  return (
    <PageShell crumbs={[{ label: "Ma ville", href: "/r" }, { label: meta.label }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex flex-col gap-16 sm:gap-20">
        {/* En-tête */}
        <header className="flex flex-col gap-5 pt-4 sm:pt-8">
          <Eyebrow>
            Région · {cities.length} ville{cities.length > 1 ? "s" : ""} suivie{cities.length > 1 ? "s" : ""} · <span className="first-letter:uppercase">{dataLabel}</span>
          </Eyebrow>
          <Title as="h1" size="hero" animate className="max-w-5xl">{meta.label}</Title>
          {avgAnomaly != null ? (
            <p className="max-w-4xl font-display text-[clamp(1.5rem,4vw,2.6rem)] font-extrabold leading-[1.08] tracking-tight">
              {single
                ? <>Aujourd&apos;hui, {cities[0].name} est à <Hl tone={tone}>{fmtDeltaTemp(avgAnomaly)}</Hl> de sa normale {deMonth(month)}.</>
                : <>Aujourd&apos;hui, ses villes sont en moyenne à <Hl tone={tone}>{fmtDeltaTemp(avgAnomaly)}</Hl> de leur normale {deMonth(month)}.</>}
            </p>
          ) : (
            <p className="max-w-3xl rounded-2xl bg-signal p-4 font-display text-xl font-bold" role="status">
              Relevés du jour indisponibles. Les normales, tendances et projections restent consultables ci-dessous.
            </p>
          )}
          {description && <p className="max-w-[62ch] text-[17px] leading-relaxed text-ink-soft">{description}</p>}
        </header>

        {/* Chiffres */}
        <section aria-label="Les chiffres de la région" className="grid gap-3 sm:grid-cols-3" data-anim="stagger">
          <Card tone="ink">
            <Stat
              invert
              label={single ? "Écart du jour" : "Écart moyen du jour"}
              value={<Num value={avgAnomaly} signed decimals={1} unit="&#8239;°C" />}
              sub={single ? `${cities[0].name}, comparée à son ${monthName} normal.` : `Moyenne des ${cities.length} villes, chacune comparée à son ${monthName} normal.`}
              explain="anomalie"
            />
          </Card>
          <Card tone="chaud">
            <Stat invert label={`Tendance de ${theSeason(season)}`} value={<Num value={avgTrend} signed decimals={1} unit="&#8239;°C" />} sub="Ce que 30 ans de réchauffement ont déjà ajouté, en moyenne sur la région (ERA5)." explain="tendance" />
          </Card>
          <Card tone="white">
            <Stat
              label={`2050, ${inSeason(season)}`}
              value={<Num value={avg2050} signed decimals={1} unit="&#8239;°C" />}
              sub={avg2050Low != null && avg2050High != null ? `Scénario SSP2-4.5 ; de ${fmtDelta(avg2050Low)} à ${fmtDelta(avg2050High)} °C selon les scénarios.` : "Scénario SSP2-4.5."}
              explain="ssp"
            />
          </Card>
        </section>

        {/* Carte + villes */}
        <Section
          id="villes"
          eyebrow="Ville par ville"
          title={single
            ? <>{cities[0].name}, <Hl>seule ville suivie</Hl> {enRegion}.</>
            : <>Qui s&apos;écarte <Hl>le plus</Hl> {enRegion}&#8239;?</>}
          intro={single
            ? "Sa couleur suit l'écart du jour à sa normale. Touchez-la pour ouvrir sa fiche."
            : "Chaque point prend la couleur de l'écart du jour à la normale de sa ville. Touchez une ville pour ouvrir sa fiche."}
        >
          <div className={cn("grid gap-4", !single && "lg:grid-cols-[1.1fr_1fr]")}>
            {!single && <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-[var(--radius-card)] border-2 border-ink">
                <RegionCitiesMap
                  label={`Carte des villes de ${meta.label}, colorées selon l'écart du jour`}
                  cities={rows.map((r) => ({ id: r.id, name: r.name, lat: r.lat, lon: r.lon, anomaly: r.anomaly, temp: r.temp }))}
                  showFires={isFireProne && hot}
                />
              </div>
              <ScaleLegend />
            </div>}
            <ul className="flex flex-col gap-2">
              {sorted.map((c) => (
                <li key={c.id}>
                  <Link href={`/a/${c.slug}`} className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 transition-colors hover:bg-paper-deep">
                    <span className="flex min-w-0 flex-col">
                      <span className="font-display text-[17px] font-extrabold group-hover:underline">{c.name}</span>
                      <span className="text-[13px] text-mute">
                        {c.temp != null ? `${fmt(c.temp, 0)} °C ressentis · ` : ""}normale {fmt(c.normal)} °C
                      </span>
                    </span>
                    {c.anomaly != null ? <AnomalyChip value={c.anomaly} /> : <span className="text-[13px] text-mute">relevé indisponible</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Pluie et feux */}
        <Section id="eau-feu" eyebrow={hot && isFireProne ? "Pluie et feux" : "Pluie"} title={<>La pluie du mois à <Hl tone="froid">{rain.city}</Hl>.</>}>
          <div className="grid gap-3 md:grid-cols-2">
            <Card tone="white">
              {rain.kind === "ok" ? (
                <Stat
                  label={`Cumul à ${rain.city} · du 1er au ${rain.daysElapsed} ${MONTHS[new Date().getMonth()]}`}
                  value={<><Num value={rain.current} /> mm</>}
                  sub={<>{rain.anomaly >= 0 ? "soit " : "soit "}<strong>{fmtDelta(rain.anomaly, 0)}&#8239;%</strong> par rapport à la moyenne 2013-2022 à la même date ({fmt(rain.normal, 0)} mm). Une seule station : ce n&apos;est pas le cumul de toute la région.</>}
                />
              ) : rain.kind === "early" ? (
                <p className="text-[15px] text-ink-soft">Le mois vient de commencer : le cumul de pluie à {rain.city} sera affiché après trois jours de relevés.</p>
              ) : (
                <p className="text-[15px] text-ink-soft" role="status">Relevé de pluie indisponible pour {rain.city} pour le moment.</p>
              )}
            </Card>

            {hot && isFireProne && (
              fireRisk ? (
                <div className={cn("flex flex-col gap-4 rounded-[var(--radius-card)] p-5 sm:p-6", FIRE_RISK_STYLE[fireRisk.level].card)}>
                  <div className="flex items-center justify-between gap-3">
                    <Eyebrow className="text-current opacity-80">Risque de feu autour de {refCity.name} · aujourd&apos;hui</Eyebrow>
                    <span className="rounded-full bg-ink px-3 py-1 font-display text-[14px] font-bold text-paper">{FIRE_RISK_STYLE[fireRisk.level].label}</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { k: "Temp. max", v: `${fmt(fireRisk.tempMax, 0)} °C` },
                      { k: "Humidité min", v: `${fmt(fireRisk.humMin, 0)} %` },
                      { k: "Vent max", v: `${fmt(fireRisk.windMax, 0)} km/h` },
                      { k: "Pluie 3 j", v: `${fmt(fireRisk.precip3d, 0)} mm` },
                    ].map(({ k, v }) => (
                      <div key={k}>
                        <dt className="text-[13px] opacity-80">{k}</dt>
                        <dd className="font-display text-xl font-extrabold tabular">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {fireSummary && fireSummary.activeCount > 0 && (
                    <Link href="/signaux/anomalies-thermiques" className="inline-flex min-h-11 items-center gap-1 font-display font-bold underline underline-offset-2">
                      {fmt(fireSummary.activeCount, 0)} détections satellite en France (7 jours) <Explain term="firms" /> <Arrow />
                    </Link>
                  )}
                  <p className="text-[13px] opacity-85">La saison des feux s&apos;est allongée en France méditerranéenne depuis les années 1970, et le GIEC (AR6) projette un allongement supplémentaire d&apos;ici 2050. Points rouges sur la carte : feux actifs détectés par satellite (NASA FIRMS, 7 derniers jours).</p>
                </div>
              ) : (
                <Card tone="paper"><p className="text-[15px] text-ink-soft" role="status">Indice de risque de feu indisponible pour le moment.</p></Card>
              )
            )}
          </div>
        </Section>

        {/* Impacts */}
        {impacts.length > 0 && (
          <Section
            id="impacts"
            eyebrow="En vrai, ça fait quoi ?"
            title={<>Le réchauffement, <Hl tone="chaud">concrètement</Hl>.</>}
            intro={<>Le statut de chaque impact repose sur la tendance de {theSeason(season)} dans la région ({fmtDeltaTemp(avgTrend)} en 30 ans), pas sur la météo du jour <Explain term="meteoClimat" />.</>}
          >
            <EnVraiCaFaitQuoi impacts={impacts} seasonTrend={avgTrend} seasonLabel={theSeason(season)}/>
          </Section>
        )}

        {/* Autres régions */}
        <Section eyebrow="Autres régions" title={<>Faire <Hl>le tour</Hl> de la France.</>}>
          <ul className="flex flex-wrap gap-2">
            {Object.entries(REGIONS).filter(([slug]) => slug !== region).map(([slug, r]) => (
              <li key={slug}>
                <Link href={`/r/${slug}`} className="inline-flex min-h-11 items-center rounded-full border-2 border-line bg-white px-4 font-display text-[15px] font-bold transition-colors hover:border-ink">
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-mute">
            Sources : ressenti maximal du jour Open-Meteo ; normales et tendances Copernicus ERA5 ; projections GIEC CMIP6 ; pluie : archive Open-Meteo ; contours : projet Liner (LesWWW).
          </p>
        </Section>
      </div>
    </PageShell>
  )
}
