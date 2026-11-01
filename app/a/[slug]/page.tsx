import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import * as fs from "fs"
import * as path from "path"
import { slugify } from "@/lib/slugify"
import { fmt, fmtDelta, fmtDeltaTemp } from "@/lib/format"
import { anomalyWords } from "@/lib/anomaly"
import { MONTHS, deMonth, isColdHalf, isHotSeason, seasonOf, seasonalMean, type Season } from "@/lib/season"
import { loadClimateFull, seasonalProjections, seasonShiftDays, smoothedAt, type SeasonalProjection } from "@/lib/climate-season"
import {
  countDays, expectedNights, extremesView, hasLiveData, inSeason, isSummerNarrative, signalPeriod, theSeason, trailingStreak,
  type SignalPeriod, type YearExtremeRaw,
} from "@/lib/city-page"
import { getWeatherData, fetchCityWeather } from "@/lib/weather-data"
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
import { ButtonLink, Arrow } from "@/components/ui/Button"
import AnomalyBreakdown from "@/components/pedago/AnomalyBreakdown"
import SeasonCurve from "@/components/pedago/SeasonCurve"
import ScenarioRange from "@/components/pedago/ScenarioRange"
import ShareButton from "@/components/ShareButton"
import TempSparkline from "@/components/TempSparkline"
import EnVraiCaFaitQuoi from "@/components/EnVraiCaFaitQuoi"
import CityLocator from "@/components/CityLocator"
import { meteoUrl } from "@/lib/open-meteo"

export const revalidate = 86400

// eslint-disable-next-line @typescript-eslint/no-require-imports
const citiesFR = require("@/data/cities-fr.json") as Array<{ id: string; name: string; lat: number; lon: number; region: string }>
// eslint-disable-next-line @typescript-eslint/no-require-imports
const citiesWorld = require("@/data/cities-world.json") as Array<{ id: string; name: string; lat: number; lon: number; country: string }>

type CityFR = { id: string; name: string; lat: number; lon: number; region: string; isWorld?: false }
type CityWorld = { id: string; name: string; lat: number; lon: number; country: string; isWorld: true }
type AnyCity = CityFR | CityWorld

let narratives: Record<string, string> = {}
// eslint-disable-next-line @typescript-eslint/no-require-imports
try { narratives = require("@/data/narratives.json") } catch {}

let yearExtremesMap: Record<string, YearExtremeRaw> = {}
// eslint-disable-next-line @typescript-eslint/no-require-imports
try { yearExtremesMap = require("@/data/year-extremes.json") } catch {}

/** Nuits de gel moyennes par mois (1991-2020), produit par un autre script. Absent : pas de comparaison. */
function loadFrostNormals(): Record<string, number[]> | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/frost-normals.json"), "utf8"))
  } catch {
    return null
  }
}

const SEASONS: Season[] = ["hiver", "printemps", "ete", "automne"]

function getCityBySlug(slug: string): AnyCity | null {
  const fr = citiesFR.find((c) => slugify(c.name) === slug)
  if (fr) return fr
  const world = citiesWorld.find((c) => slugify(c.name) === slug)
  if (world) return { ...world, isWorld: true as const }
  return null
}

export async function generateStaticParams() {
  return [
    ...citiesFR.map((c) => ({ slug: slugify(c.name) })),
    ...citiesWorld.map((c) => ({ slug: slugify(c.name) })),
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) return {}

  const season = seasonOf(new Date().getMonth())
  const p2050 = seasonalProjections(loadClimateFull()[city.id], season).find((p) => p.year === 2050)?.central ?? null
  const projStr = p2050 != null ? ` En 2050, ${inSeason(season)} : ${fmtDeltaTemp(p2050)} (GIEC, SSP2-4.5).` : ""
  const location = city.isWorld ? city.country : city.region
  const description = `L'écart à la normale du jour, la tendance ERA5 sur 30 ans et les projections GIEC saison par saison pour ${city.name} (${location}).${projStr}`
  const title = `${city.name} : écart à la normale, tendance et projections · cestchaud.fr`

  return {
    title,
    description,
    alternates: { canonical: `https://www.cestchaud.fr/a/${slug}` },
    openGraph: {
      title: `${city.name} : météo du jour ou climat qui change ?`,
      description,
      url: `https://www.cestchaud.fr/a/${slug}`,
      siteName: "cestchaud.fr",
      locale: "fr_FR",
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `${city.name} : météo du jour ou climat qui change ?`, description },
  }
}

type Signals =
  | { ok: true; period: SignalPeriod; dates: string[]; mins: (number | null)[]; maxes: (number | null)[] }
  | { ok: false; period: SignalPeriod }

/** Relevés quotidiens depuis le début de la période (archive Open-Meteo, ~2 jours de retard). */
async function fetchSignals(lat: number, lon: number, now: Date): Promise<Signals> {
  const period = signalPeriod(now)
  const end = new Date(now)
  end.setDate(end.getDate() - 2)
  try {
    const res = await fetch(
      meteoUrl("archive", { latitude: lat, longitude: lon, daily: "temperature_2m_min,apparent_temperature_max", start_date: period.start, end_date: end.toISOString().slice(0, 10), timezone: "Europe/Paris" }),
      { next: { revalidate: 86400 } },
    )
    if (!res.ok) throw new Error(`archive ${res.status}`)
    const data = await res.json()
    if (data?.error || !data?.daily?.time) throw new Error("archive: réponse invalide")
    return { ok: true, period, dates: data.daily.time, mins: data.daily.temperature_2m_min, maxes: data.daily.apparent_temperature_max }
  } catch {
    return { ok: false, period }
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function frDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) notFound()
  const isFR = !city.isWorld

  // ── Valeur du jour : cache d'abord, appel direct ensuite ──
  const weather = await getWeatherData()
  const live = hasLiveData(weather.citiesFR)
  const cached = live
    ? (isFR ? weather.citiesFR : weather.citiesWorld).find((c) => c.id === city.id)
    : undefined
  let today: number | null = cached?.apparent_temp_max ?? null
  if (today == null) today = (await fetchCityWeather(city.lat, city.lon))?.apparent_temp_max ?? null

  const refDate = live ? new Date(weather.fetchedAt) : new Date()
  const month = refDate.getMonth()
  const monthName = MONTHS[month]
  const season = seasonOf(month)

  // ── Climat ──
  const full = loadClimateFull()[city.id]
  const normal = full?.normal?.[month] ?? null
  const trendNow = smoothedAt(full?.trend, month)
  const anomaly = today != null && normal != null ? Math.round((today - normal) * 10) / 10 : null
  const seasonTrend = seasonalMean(full?.trend, season)
  const bySeason = Object.fromEntries(SEASONS.map((s) => [s, seasonalProjections(full, s)])) as Record<Season, SeasonalProjection[]>
  const p2050 = bySeason[season].find((p) => p.year === 2050) ?? null
  const shiftDays = full && trendNow != null ? seasonShiftDays(full.normal, month, trendNow) : null

  // ── Signaux de saison (villes françaises) ──
  const signalMode = !isFR ? null : isColdHalf(month) ? "froid" : isHotSeason(month) ? "chaud" : null
  const signals = signalMode ? await fetchSignals(city.lat, city.lon, new Date()) : null
  const frostNormals = signalMode === "froid" ? loadFrostNormals() : null

  // ── Extrêmes, impacts, portrait ──
  const extremes = isFR && yearExtremesMap[city.id] ? extremesView(yearExtremesMap[city.id]) : null
  const extremesYear = extremes ? extremes.hot.date.slice(0, 4) : null
  const regionSlug = isFR ? slugify(city.region) : null
  const dayOfYear = Math.floor((refDate.getTime() - new Date(refDate.getFullYear(), 0, 0).getTime()) / 86_400_000)
  const cityHash = city.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const impacts = isFR ? getImpacts({ regionSlug, month: month + 1, count: 2, seed: dayOfYear + cityHash }) : []
  const narrative = narratives[city.id] ?? null
  const narrativeIsSummer = narrative ? isSummerNarrative(narrative) : false

  const location = isFR ? city.region : city.country
  const pageUrl = `https://www.cestchaud.fr/a/${slug}`
  const dataLabel = refDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  const tone = anomaly == null ? "signal" : anomaly >= 0.5 ? "chaud" : anomaly <= -0.5 ? "froid" : "signal"

  const shareText = anomaly != null
    ? `À ${city.name} aujourd'hui : ${fmt(today, 0)} °C ressentis, soit ${fmtDeltaTemp(anomaly)} par rapport à un ${monthName} normal.${p2050?.central != null ? ` En 2050, ${inSeason(season)} : ${fmtDeltaTemp(p2050.central)} selon le GIEC.` : ""}`
    : p2050?.central != null
      ? `À ${city.name}, le GIEC projette ${fmtDeltaTemp(p2050.central)} ${inSeason(season)} d'ici 2050.`
      : `Le climat de ${city.name}, expliqué simplement :`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${city.name} : écart à la normale, tendance et projections`,
    url: pageUrl,
    description: `Données climatiques et projections GIEC pour ${city.name}, ${location}.`,
    about: {
      "@type": "Place",
      name: city.name,
      geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lon },
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: location,
        containedInPlace: { "@type": "Country", name: isFR ? "France" : city.country },
      },
    },
  }

  const crumbs = isFR
    ? [{ label: "Ma ville", href: "/r" }, { label: city.region, href: `/r/${regionSlug}` }, { label: city.name }]
    : [{ label: "Ma ville", href: "/r" }, { label: city.country }, { label: city.name }]

  return (
    <PageShell crumbs={crumbs}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex flex-col gap-16 sm:gap-20">
        {/* ── 1. En-tête : la phrase du jour ── */}
        <header className="flex flex-col gap-6 pt-4 sm:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-3">
              <Eyebrow>
                {location} · <span className="first-letter:uppercase">{dataLabel}</span>
              </Eyebrow>
              <Title as="h1" size="hero" animate className="break-words">{city.name}</Title>
            </div>
            <div className="w-28 shrink-0 sm:w-44 lg:w-64">
              <CityLocator name={city.name} lat={city.lat} lon={city.lon} anomaly={anomaly} world={!isFR} country={city.isWorld ? city.country : undefined} />
            </div>
          </div>

          {today != null ? (
            <div className="flex max-w-4xl flex-col gap-3">
              <p className="font-display text-[clamp(1.7rem,4.6vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight">
                Aujourd&apos;hui, <Num value={today} from={normal ?? undefined} unit="&#8239;°C" /> ressentis.
                {anomaly != null && (
                  <> C&apos;est <Hl tone={tone}>{fmtDeltaTemp(anomaly)}</Hl> par rapport à un {monthName} normal.</>
                )}
              </p>
              {anomaly != null && normal != null && (
                <p className="text-[17px] leading-relaxed text-ink-soft">
                  {capitalize(anomalyWords(anomaly))} : un {monthName} normal ici, c&apos;est {fmt(normal)}&#8239;°C de ressenti maximal{" "}
                  <Explain term="ressenti" /> en moyenne sur 1991-2020 <Explain term="normale" />.
                </p>
              )}
            </div>
          ) : (
            <p className="max-w-3xl rounded-2xl bg-signal p-4 font-display text-xl font-bold" role="status">
              Relevé du jour indisponible pour {city.name}. La normale, la tendance et les projections restent consultables ci-dessous.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <ShareButton text={shareText} url={pageUrl} />
            {isFR && <ButtonLink href="/notifications" variant="chaud">Recevoir le briefing <Arrow /></ButtonLink>}
          </div>
        </header>

        {/* ── 2. Météo ou climat ── */}
        {normal != null && trendNow != null && (
          <Section
            id="meteo-climat"
            eyebrow="Météo ou climat"
            title={trendNow >= 0.3
              ? <>Ce que le climat <Hl tone="chaud">a déjà changé</Hl> ici.</>
              : <>Ici, l&apos;écart du jour, c&apos;est <Hl>surtout la météo</Hl>.</>}
            intro={<>La normale {deMonth(month)} a déjà bougé de {fmtDeltaTemp(trendNow)} en 30 ans <Explain term="tendance" />. L&apos;écart du jour se lit par-dessus.</>}
          >
            {today != null ? (
              <AnomalyBreakdown city={city.name} monthLabel={monthName} normal={normal} trend={trendNow} today={today} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Card><Stat label={`Normale ${deMonth(month)}`} value={<Num value={normal} decimals={1} unit="&#8239;°C" />} sub="Ressenti maximal moyen, 1991-2020." explain="normale" /></Card>
                <Card tone="chaud"><Stat invert label="Tendance sur 30 ans" value={<Num value={trendNow} signed decimals={1} unit="&#8239;°C" />} sub="Lissée sur trois mois autour du mois en cours." explain="tendance" /></Card>
              </div>
            )}
          </Section>
        )}

        {/* ── 3. La courbe qui glisse ── */}
        {full && (
          <Section
            id="saisons"
            eyebrow="Saison par saison"
            title={<>Le calendrier de {city.name} <Hl>glisse</Hl>.</>}
            intro="La courbe de l'année, telle qu'elle était sur 1991-2020, telle qu'elle est aujourd'hui, et telle qu'elle pourrait être en 2050."
          >
            <SeasonCurve
              city={city.name}
              normal={full.normal}
              trend={full.trend}
              proj2030={full.ssp245?.proj2030 ?? Array(12).fill(null)}
              proj2050={full.ssp245?.proj2050 ?? Array(12).fill(null)}
              month={month}
              shiftDays={shiftDays}
            />
          </Section>
        )}

        {/* ── 4. Projections par saison ── */}
        {full && (
          <Section
            id="projections"
            eyebrow="Projections GIEC"
            title={p2050?.central != null
              ? <>En 2050, {inSeason(season)} : <Hl tone="chaud">{fmtDeltaTemp(p2050.central)}</Hl>.</>
              : <>Et <Hl tone="chaud">demain</Hl>&#8239;?</>}
            intro={<>Hausse projetée par rapport au climat 2000-2020 (la courbe ci-dessus part, elle, de 1991-2020) : valeur centrale du scénario intermédiaire et fourchette entre scénarios <Explain term="projection" />. Jusqu&apos;en 2050, les scénarios divergent encore peu : la suite dépend de nos émissions.</>}
          >
            <ScenarioRange city={city.name} bySeason={bySeason} initial={season} />
          </Section>
        )}

        {/* ── 5. Extrêmes de l'année ── */}
        {extremes && (
          <Section id="extremes" eyebrow={`Extrêmes de ${extremesYear}, jusqu'ici`} title={<>L&apos;année {extremesYear} à {city.name}, <Hl>en deux jours</Hl>.</>}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card tone="white">
                <Stat label={extremes.hot.label} value={<span className="text-chaud"><Num value={extremes.hot.value} unit="&#8239;°C" /></span>} sub={<>{capitalize(extremes.hot.detail)}, le {frDate(extremes.hot.date)}.</>} explain="ressenti" />
              </Card>
              <Card tone="white">
                <Stat label={extremes.cold.label} value={<span className="text-froid"><Num value={extremes.cold.value} unit="&#8239;°C" /></span>} sub={<>{capitalize(extremes.cold.detail)}, le {frDate(extremes.cold.date)}.</>} />
              </Card>
            </div>
          </Section>
        )}

        {/* ── 6. Signaux de saison ── */}
        {signals && (
          <Section
            id="signaux"
            eyebrow={`Signaux ${deMonth(signals.period.month)}`}
            title={signalMode === "froid"
              ? <>Le gel, <Hl tone="froid">encore au rendez-vous</Hl>&#8239;?</>
              : <>Quand la chaleur <Hl tone="chaud">ne redescend plus</Hl>.</>}
            intro={`Relevés du 1er au ${signals.period.days} ${MONTHS[signals.period.month]} à ${city.name}.`}
          >
            {!signals.ok ? (
              <p className="rounded-2xl bg-paper-deep p-4 text-[15px] text-ink-soft" role="status">
                Relevés quotidiens indisponibles pour le moment : impossible de compter les nuits de {signalMode === "froid" ? "gel" : "chaleur"} ce mois-ci.
              </p>
            ) : (() => {
              const inPeriod = signals.dates.map((d) => d >= signals.period.start && d <= signals.period.end)
              const mins = signals.mins.map((v, i) => (inPeriod[i] ? v : null))
              const maxes = signals.maxes.map((v, i) => (inPeriod[i] ? v : null))
              if (signalMode === "froid") {
                const frost = countDays(mins, (v) => v < 0)
                const expected = expectedNights(frostNormals?.[city.id], signals.period)
                const nm = full?.normal?.[signals.period.month]
                const mild = nm != null ? countDays(maxes, (v) => v - nm >= 3) : null
                return (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card tone="froid">
                      <Stat
                        invert
                        label="Nuits de gel"
                        value={<Num value={frost} />}
                        sub={expected != null
                          ? <>pour <strong>{fmt(expected)}</strong> attendue{expected >= 2 ? "s" : ""} en moyenne sur cette période (1991-2020).</>
                          : "nuits sous 0 °C sur la période."}
                        explain="nuitGel"
                      />
                    </Card>
                    {mild != null && (
                      <Card tone="chaud">
                        <Stat invert label="Journées très douces" value={<Num value={mild} />} sub={`jours à +3 °C ou plus au-dessus de la normale ${deMonth(signals.period.month)}.`} explain="anomalie" />
                      </Card>
                    )}
                  </div>
                )
              }
              const tropical = countDays(mins, (v) => v >= 20)
              const streak = trailingStreak(signals.maxes, (v) => v >= 35)
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card tone="ink">
                    <Stat invert label="Nuits tropicales" value={<Num value={tropical} />} sub={`nuits sur ${signals.period.days} sans descendre sous 20 °C.`} explain="nuitTropicale" />
                  </Card>
                  <Card tone={streak >= 3 ? "chaud" : "white"}>
                    <Stat
                      invert={streak >= 3}
                      label="Série de jours chauds"
                      value={<><Num value={streak} /> j</>}
                      sub={streak >= 3 ? "jours consécutifs à 35 °C ressentis ou plus : épisode de forte chaleur." : "jours consécutifs à 35 °C ressentis ou plus (une série commence à 3)."}
                    />
                  </Card>
                </div>
              )
            })()}
          </Section>
        )}

        {/* ── 7. Impacts ── */}
        {impacts.length > 0 && (
          <Section
            id="impacts"
            eyebrow="En vrai, ça fait quoi ?"
            title={<>Le réchauffement, <Hl tone="chaud">concrètement</Hl>.</>}
            intro={<>Le statut de chaque impact repose sur la tendance de {theSeason(season)} ici ({fmtDeltaTemp(seasonTrend)} en 30 ans), pas sur la météo du jour <Explain term="meteoClimat" />.</>}
          >
            <EnVraiCaFaitQuoi impacts={impacts} seasonTrend={seasonTrend} seasonLabel={theSeason(season)}/>
          </Section>
        )}

        {/* ── 8. Les 30 derniers jours ── */}
        <Section id="trente-jours" eyebrow="Les 30 derniers jours" title={<>Un mois, <Hl>jour par jour</Hl>.</>}>
          <Card tone="white">
            <TempSparkline lat={city.lat} lon={city.lon} normals={full?.normal ?? null} />
          </Card>
        </Section>

        {/* ── 9. Portrait ── */}
        {narrative && (
          <Section id="portrait" eyebrow="Portrait climatique" title={<>Portrait de <Hl>{city.name}</Hl>.</>}>
            <Card tone="paper" className="flex max-w-4xl flex-col gap-3">
              {isFR && narrativeIsSummer && !isHotSeason(month) && <Eyebrow>Ce portrait décrit l&apos;été</Eyebrow>}
              <p className="text-[17px] leading-relaxed text-ink-soft">{narrative}</p>
            </Card>
          </Section>
        )}

        {/* ── 10. Aller plus loin ── */}
        <Section eyebrow="Aller plus loin" title={<>Comparer, suivre, <Hl tone="chaud">agir</Hl>.</>}>
          {isFR ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card href={`/jumeaux?ville=${slug}`} tone="ink" className="flex flex-col gap-3">
                <Eyebrow className="text-paper/70">Jumeau 2050</Eyebrow>
                <p className="font-display text-xl font-extrabold leading-tight">Le climat de {city.name} en 2050 existe déjà ailleurs.</p>
                <span className="mt-auto inline-flex items-center gap-1 font-display font-bold text-signal">Trouver son jumeau <Arrow /></span>
              </Card>
              <Card href={`/r/${regionSlug}`} tone="white" className="flex flex-col gap-3">
                <Eyebrow>Région</Eyebrow>
                <p className="font-display text-xl font-extrabold leading-tight">{city.region}, ville par ville.</p>
                <span className="mt-auto inline-flex items-center gap-1 font-display font-bold">Voir la région <Arrow /></span>
              </Card>
              <Card href="/notifications" tone="signal" className="flex flex-col gap-3">
                <Eyebrow>Briefing</Eyebrow>
                <p className="font-display text-xl font-extrabold leading-tight">L&apos;écart de {city.name}, chaque matin.</p>
                <span className="mt-auto inline-flex items-center gap-1 font-display font-bold">S&apos;inscrire <Arrow /></span>
              </Card>
              <Card href="/citoyens" tone="outline" className="flex flex-col gap-3">
                <Eyebrow>Agir</Eyebrow>
                <p className="font-display text-xl font-extrabold leading-tight">Écrire à vos élus avec ces chiffres.</p>
                <span className="mt-auto inline-flex items-center gap-1 font-display font-bold">Préparer mon message <Arrow /></span>
              </Card>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Card href="/r" tone="white" className="flex flex-col gap-3">
                <Eyebrow>Toutes les villes</Eyebrow>
                <p className="font-display text-xl font-extrabold leading-tight">Comparer avec les villes françaises et du monde.</p>
                <span className="mt-auto inline-flex items-center gap-1 font-display font-bold">Ma ville <Arrow /></span>
              </Card>
              <Card href="/jumeaux" tone="ink" className="flex flex-col gap-3">
                <Eyebrow className="text-paper/70">Jumeaux 2050</Eyebrow>
                <p className="font-display text-xl font-extrabold leading-tight">Quelle ville française aura le climat d&apos;ailleurs&#8239;?</p>
                <span className="mt-auto inline-flex items-center gap-1 font-display font-bold text-signal">Découvrir <Arrow /></span>
              </Card>
            </div>
          )}
          <p className="text-[13px] text-mute">
            Sources : ressenti maximal du jour Open-Meteo ; normales et tendances Copernicus ERA5 (1991-2020) <Explain term="era5" /> ; projections GIEC CMIP6 <Explain term="cmip6" />
            {extremes && " ; extrêmes de l'année Open-Meteo"}.{" "}
            <Link href="/a-propos" className="underline underline-offset-2">Méthode détaillée</Link>.
          </p>
        </Section>
      </div>
    </PageShell>
  )
}
