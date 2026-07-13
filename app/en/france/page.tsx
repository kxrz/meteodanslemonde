import Link from "next/link"
import { Metadata } from "next"
import { slugify } from "@/lib/slugify"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { fmtDelta } from "@/lib/format"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"
import ShareButton from "@/components/ShareButton"
import CitySearch from "@/components/CitySearch"
import FranceCitiesMapWrapper from "@/components/FranceCitiesMapWrapper"
import type { ClimateEntry } from "@/lib/climate"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "La chaleur en France · cestchaud.fr",
  description: "Vue d'ensemble de la chaleur en France : ressenti max, anomalies, tendances ERA5 sur 30 ans et projections GIEC CMIP6 pour 60 villes françaises.",
  alternates: { canonical: "https://www.cestchaud.fr/en/france" },
  openGraph: {
    title: "La chaleur en France · cestchaud.fr",
    description: "Ressenti max, anomalies et projections GIEC CMIP6 2030–2050 pour 60 villes françaises.",
    url: "https://www.cestchaud.fr/en/france",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og/france.png", width: 1200, height: 630, alt: "La chaleur en France · cestchaud.fr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "La chaleur en France · cestchaud.fr",
    description: "Ressenti max, anomalies et projections GIEC CMIP6 2030–2050 pour 60 villes françaises.",
    images: ["/og/france.png"],
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "La chaleur en France",
  url: "https://www.cestchaud.fr/en/france",
  description: "Vue d'ensemble climatique de la France : temperatures actuelles et projections GIEC pour 60 villes.",
  about: { "@type": "Country", name: "France", sameAs: "https://www.wikidata.org/wiki/Q142" },
}

export default async function FrancePage() {
  const { citiesFR, fetchedAt } = await getWeatherData()
  const climateMap = loadClimateMap()

  const sorted = [...citiesFR].sort((a, b) => b.apparent_temp_max - a.apparent_temp_max)
  const dataLabel = new Date(fetchedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  const hottest = sorted[0]
  const coolest = sorted[sorted.length - 1]
  const avgTemp = Math.round(citiesFR.reduce((s, c) => s + c.apparent_temp_max, 0) / citiesFR.length)
  const above30 = citiesFR.filter((c) => c.apparent_temp_max >= 30).length
  const above35 = citiesFR.filter((c) => c.apparent_temp_max >= 35).length

  const m = new Date().getMonth()
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })

  type CityWithClimate = typeof citiesFR[0] & {
    proj2050: number | null
    normal: number | null
    anomaly: number | null
    trend: number | null
  }

  const withClimate: CityWithClimate[] = citiesFR.map((c) => {
    const entry = (climateMap[c.id] ?? null) as ClimateEntry
    const proj2050 = entry?.proj2050?.[m] ?? null
    const normal = entry?.normal?.[m] ?? null
    const trend = entry?.trend?.[m] ?? null
    const anomaly = normal !== null ? Math.round((c.apparent_temp_max - normal) * 10) / 10 : null
    return { ...c, proj2050, normal, anomaly, trend }
  })

  const withProj = withClimate.filter((c) => c.proj2050 !== null)
  const mostImpacted = withProj.length > 0
    ? withProj.reduce((a, b) => (b.proj2050! > a.proj2050! ? b : a))
    : null
  const leastImpacted = withProj.length > 0
    ? withProj.reduce((a, b) => (b.proj2050! < a.proj2050! ? b : a))
    : null

  const withAnomaly = withClimate.filter((c) => c.anomaly !== null)
  const biggestAnomaly = withAnomaly.length > 0
    ? withAnomaly.reduce((a, b) => (Math.abs(b.anomaly!) > Math.abs(a.anomaly!) ? b : a))
    : null
  const top3Anomaly = withAnomaly
    .filter((c) => c.anomaly !== null && c.anomaly > 0)
    .sort((a, b) => b.anomaly! - a.anomaly!)
    .slice(0, 3)

  const trendsThisMonth = withClimate
    .map((c) => c.trend)
    .filter((t): t is number => t !== null)
  const avgTrend = trendsThisMonth.length > 0
    ? trendsThisMonth.reduce((a, b) => a + b, 0) / trendsThisMonth.length
    : null

  const top6 = sorted.slice(0, 6)
  const getAvgProj = (year: "proj2040" | "proj2050") => {
    const vals = top6
      .map((c) => ((climateMap[c.id] ?? null) as ClimateEntry)?.[year]?.[m] ?? null)
      .filter((v): v is number => v !== null)
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }
  const avgProj2040 = getAvgProj("proj2040")
  const avgProj2050 = getAvgProj("proj2050")

  function buildFranceNarrative() {
    const parts: string[] = []

    {
      const tempDesc = avgTemp >= 35 ? "une vague de chaleur intense" : avgTemp >= 30 ? "une chaleur estivale prononcee" : avgTemp >= 25 ? "des temperatures estivales" : "des temperatures moderees"
      const spread = above30 > 0
        ? ` On compte ${above30} ville${above30 > 1 ? "s" : ""} au-dessus de 30 degres${above35 > 0 ? ` dont ${above35} au-dessus de 35` : ""}, de ${hottest.name} (${hottest.region}) a ${coolest.name} (${coolest.region}) ou le thermometre s'arrete a ${coolest.apparent_temp_max} degres.`
        : ` De ${hottest.name} (${hottest.region}) a ${coolest.name} (${coolest.region}) ou le ressenti plafonne a ${coolest.apparent_temp_max} degres, l'amplitude reste sensible.`
      parts.push(`En ce mois de ${monthName}, la France traverse ${tempDesc} avec un ressenti moyen de ${avgTemp}°C sur l'ensemble du territoire.${spread}`)
    }

    if (biggestAnomaly) {
      const sign = biggestAnomaly.anomaly! > 0 ? "au-dessus" : "en dessous"
      const absAnomaly = Math.abs(biggestAnomaly.anomaly!)
      const trendStr = avgTrend !== null
        ? ` A l'echelle nationale, les données ERA5 montrent une hausse moyenne de ${fmtDelta(avgTrend)}°C depuis 1990 pour ce mois : une trajectoire qui s'accelere.`
        : ""
      parts.push(`C'est a ${biggestAnomaly.name} que l'ecart par rapport aux normales saisonnieres est le plus marque : ${absAnomaly}°C ${sign} de la reference ERA5. Des anomalies de cette amplitude ne sont plus des exceptions.${trendStr}`)
    } else if (avgTrend !== null) {
      parts.push(`Les données ERA5 revelent une tendance de ${fmtDelta(avgTrend)}°C sur 30 ans pour ce mois a l'echelle nationale. Ce chiffre illustre une mutation profonde du climat francais.`)
    }

    if (mostImpacted && leastImpacted) {
      parts.push(`Les projections GIEC CMIP6 dessinent des trajectoires tres contrastees selon les territoires. ${mostImpacted.name} (${mostImpacted.region}) est la ville la plus exposee au scenario 2050, avec une hausse projetee de ${fmtDelta(mostImpacted.proj2050!)}°C. ${leastImpacted.name} (${leastImpacted.region}) figure parmi les moins impactees, a ${fmtDelta(leastImpacted.proj2050!)}°C. Le Sud et les plaines continentales seront frappe es plus tot et plus fort que les facades atlantiques.`)
    }

    if (avgProj2040 !== null || avgProj2050 !== null) {
      const proj40Str = avgProj2040 !== null ? `${fmtDelta(Math.round(avgProj2040 * 10) / 10)}°C en 2040` : null
      const proj50Str = avgProj2050 !== null ? `${fmtDelta(Math.round(avgProj2050 * 10) / 10)}°C en 2050` : null
      const projStr = [proj40Str, proj50Str].filter(Boolean).join(", ")
      const top3Names = top6.map(c => c.name).slice(0, 3).join(", ")
      parts.push(`Pour les six villes les plus chaudes du pays, dont ${top3Names}, le scenario median CMIP6 anticipe ${projStr} de hausse supplementaire. Ces villes concentrent deja les ressentis les plus eleves. Leur trajectoire exige une adaptation urgente : vegetalisation, plans canicule, gestion de l'eau.`)
    }

    return parts
  }

  const narrativeParagraphs = buildFranceNarrative()

  const citiesForSearch = citiesFR.map(c => ({
    id: c.id,
    name: c.name,
    lat: c.lat,
    lon: c.lon,
    region: c.region,
  }))

  const citiesForMap = withClimate.map(c => ({
    id: c.id,
    name: c.name,
    lat: c.lat,
    lon: c.lon,
    region: c.region,
    apparent_temp_max: c.apparent_temp_max,
    anomaly: c.anomaly,
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-[#f5f4f0]">

        <SiteHeader asLink />
        <Breadcrumb crumbs={[{ label: "France en chiffres" }]} />

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

          {/* Left panel — map */}
          <div className="h-[55vw] max-h-[400px] lg:max-h-none lg:h-auto lg:w-[40%] shrink-0 relative p-3 lg:p-4 lg:sticky lg:top-0 lg:h-[calc(100vh-80px)]">
            <div className="w-full h-full rounded-3xl overflow-hidden">
              <FranceCitiesMapWrapper cities={citiesForMap} />
            </div>

            {/* Title overlay */}
            <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm max-w-[220px]">
              <p className="text-[9px] uppercase tracking-[0.15em] font-semibold text-neutral-400 leading-none mb-1">
                France · {dataLabel}
              </p>
              <h1 className="text-base font-black text-neutral-900 leading-tight">
                La chaleur en France
              </h1>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 lg:overflow-y-auto p-3 lg:p-4">
            {/* Search */}
            <div className="mb-3">
              <CitySearch cities={citiesForSearch} />
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="col-span-3 bg-[#dbeafe] rounded-2xl px-4 py-3 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-800/60">Ressenti moyen · {citiesFR.length} villes</p>
                <div className="text-3xl font-black text-blue-900">{avgTemp}&deg;C</div>
              </div>
              <div className="bg-[#fed7aa]/70 rounded-2xl p-3">
                <p className="text-[9px] uppercase tracking-[0.1em] font-semibold text-orange-900/50 mb-1">Plus de 30°C</p>
                <div className="text-xl font-black text-orange-900">{above30}</div>
                <p className="text-[10px] text-orange-900/40">villes</p>
              </div>
              <div className="bg-[#fecaca]/70 rounded-2xl p-3">
                <p className="text-[9px] uppercase tracking-[0.1em] font-semibold text-red-900/50 mb-1">Plus de 35°C</p>
                <div className="text-xl font-black text-red-900">{above35}</div>
                <p className="text-[10px] text-red-900/40">villes</p>
              </div>
              {biggestAnomaly ? (
                <div className="bg-[#fef9c3]/80 rounded-2xl p-3">
                  <p className="text-[9px] uppercase tracking-[0.1em] font-semibold text-yellow-900/50 mb-1">Anomalie max</p>
                  <div className="text-xl font-black text-yellow-900">{fmtDelta(biggestAnomaly.anomaly)}&deg;</div>
                  <Link href={`/a/${slugify(biggestAnomaly.name)}`} className="text-[10px] font-bold text-yellow-900/70 hover:underline block truncate">{biggestAnomaly.name}</Link>
                </div>
              ) : (
                <div className="bg-[#fef9c3]/80 rounded-2xl p-3">
                  <p className="text-[9px] uppercase tracking-[0.1em] font-semibold text-yellow-900/50 mb-1">Anomalie max</p>
                  <div className="text-xl font-black text-yellow-900/30">N/A</div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 pb-4 mt-0">

              {/* Spectre d'anomalies */}
              {withAnomaly.length > 0 && (() => {
                const spectreSorted = [...withAnomaly].sort((a, b) => (a.anomaly ?? 0) - (b.anomaly ?? 0))
                const spectreMin = spectreSorted[0]
                const spectreMax = spectreSorted[spectreSorted.length - 1]
                const segments = [
                  { label: "< -2°C", color: "#3b82f6", count: spectreSorted.filter(c => (c.anomaly ?? 0) < -2).length },
                  { label: "-2 à 0°C", color: "#93c5fd", count: spectreSorted.filter(c => { const a = c.anomaly ?? 0; return a >= -2 && a < 0 }).length },
                  { label: "0 à +2°C", color: "#fca5a5", count: spectreSorted.filter(c => { const a = c.anomaly ?? 0; return a >= 0 && a < 2 }).length },
                  { label: "> +2°C", color: "#ef4444", count: spectreSorted.filter(c => (c.anomaly ?? 0) >= 2).length },
                ]
                const anomalyHex = (a: number | null) => {
                  if (a === null) return "#e5e5e5"
                  if (a <= -3) return "#1d4ed8"
                  if (a <= -1) return "#93c5fd"
                  if (a <= 1) return "#fca5a5"
                  if (a <= 3) return "#f97316"
                  return "#ef4444"
                }
                return (
                  <div className="col-span-2 bg-white rounded-3xl p-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                      Spectre d&apos;anomalies · {withAnomaly.length} villes
                    </p>
                    <div className="flex h-5 rounded-lg overflow-hidden mb-2">
                      {spectreSorted.map((city) => (
                        <div
                          key={city.id}
                          title={`${city.name} : ${city.anomaly !== null ? (city.anomaly > 0 ? "+" : "") + city.anomaly.toFixed(1) + "°C" : "N/A"}`}
                          style={{ flex: 1, backgroundColor: anomalyHex(city.anomaly) }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-3 flex-wrap mt-2 mb-1">
                      {segments.filter(s => s.count > 0).map(s => (
                        <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          {s.label} · <strong className="text-neutral-700">{s.count} ville{s.count > 1 ? "s" : ""}</strong>
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
                      <span>{spectreMin.anomaly !== null ? (spectreMin.anomaly > 0 ? "+" : "") + spectreMin.anomaly.toFixed(1) + "°C" : "?"} · {spectreMin.name}</span>
                      <span>{spectreMax.name} · {spectreMax.anomaly !== null ? (spectreMax.anomaly > 0 ? "+" : "") + spectreMax.anomaly.toFixed(1) + "°C" : "?"}</span>
                    </div>
                  </div>
                )
              })()}

              {/* Top 3 anomalies */}
              {top3Anomaly.length > 0 && (
                <div className="col-span-2 bg-[#fff7ed] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900/60 mb-3">
                    Top 3 anomalies du jour
                  </p>
                  <div className="space-y-2">
                    {top3Anomaly.map((c, i) => (
                      <Link
                        key={c.id}
                        href={`/a/${slugify(c.name)}`}
                        className="flex items-center gap-3 py-2 hover:opacity-80 transition-opacity group"
                      >
                        <span className="text-xs font-black text-orange-900/40 w-4">{i + 1}</span>
                        <span className="flex-1 text-sm font-semibold text-orange-900">{c.name}</span>
                        <span className="text-xs text-orange-900/50">{c.apparent_temp_max}&deg;C</span>
                        <span className="font-black text-base text-orange-700">{fmtDelta(c.anomaly)}&deg;</span>
                        <span className="text-orange-300 group-hover:text-orange-600 text-sm transition-colors">&rarr;</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* GIEC 2050 : plus et moins exposee */}
              <div className="bg-purple-50 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/60 mb-3">
                  GIEC 2050 · plus exposee
                </p>
                {mostImpacted ? (
                  <>
                    <div className="text-4xl font-black text-purple-900 leading-none">
                      {fmtDelta(mostImpacted.proj2050)}&deg;C
                    </div>
                    <Link href={`/a/${slugify(mostImpacted.name)}`} className="text-sm font-bold text-purple-900/80 mt-1.5 block hover:underline">
                      {mostImpacted.name}
                    </Link>
                    <p className="text-xs text-purple-900/50">{mostImpacted.region}</p>
                  </>
                ) : (
                  <p className="text-2xl font-black text-purple-900/20">N/A</p>
                )}
              </div>

              <div className="bg-indigo-50 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-indigo-900/60 mb-3">
                  GIEC 2050 · moins exposee
                </p>
                {leastImpacted ? (
                  <>
                    <div className="text-4xl font-black text-indigo-900 leading-none">
                      {fmtDelta(leastImpacted.proj2050)}&deg;C
                    </div>
                    <Link href={`/a/${slugify(leastImpacted.name)}`} className="text-sm font-bold text-indigo-900/80 mt-1.5 block hover:underline">
                      {leastImpacted.name}
                    </Link>
                    <p className="text-xs text-indigo-900/50">{leastImpacted.region}</p>
                  </>
                ) : (
                  <p className="text-2xl font-black text-indigo-900/20">N/A</p>
                )}
              </div>

              {/* Tendance nationale */}
              {avgTrend !== null && (
                <div className="col-span-2 bg-white rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                    Tendance 30 ans · moyenne France
                  </p>
                  <p className="font-black text-2xl text-neutral-900">
                    {fmtDelta(avgTrend)}&deg;C
                    <span className="text-sm font-normal text-neutral-400 ml-2">
                      depuis 1990 · {monthName}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-2">
                    Moyenne calculee sur les {trendsThisMonth.length} villes avec données ERA5 disponibles
                  </p>
                </div>
              )}

              {/* Editorial */}
              {narrativeParagraphs.length > 0 && (
                <div className="col-span-2 bg-neutral-950 rounded-3xl p-6">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/50 mb-5">
                    Analyse · {monthName} {new Date().getFullYear()}
                  </p>
                  <div className="space-y-4">
                    {narrativeParagraphs.map((para, i) => (
                      <p key={i} className={`leading-relaxed ${i === 0 ? "text-base font-semibold text-white" : "text-sm text-white/80"}`}>
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* GIEC moy. top 6 */}
              <div className="col-span-2 bg-[#c4b8d4] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/60 mb-4">
                  GIEC · moyenne des 6 villes les plus chaudes
                </p>
                <div className="flex gap-8 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-purple-900/50 mb-1">2040</p>
                    <p className="font-black text-3xl text-purple-900">{fmtDelta(avgProj2040)}&deg;C</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-900/50 mb-1">2050</p>
                    <p className="font-black text-3xl text-purple-900">{fmtDelta(avgProj2050)}&deg;C</p>
                  </div>
                </div>
                <div className="border-t border-purple-900/10 pt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {top6.map((c) => (
                    <Link
                      key={c.id}
                      href={`/a/${slugify(c.name)}`}
                      className="text-xs font-semibold text-purple-900/70 hover:text-purple-900 hover:underline transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Toutes les villes */}
              <div className="col-span-2 bg-white rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-4">
                  {citiesFR.length} villes · du plus chaud au plus frais
                </p>
                <div className="space-y-0.5">
                  {sorted.map((city) => {
                    const entry = (climateMap[city.id] ?? null) as ClimateEntry
                    const proj2050 = entry?.proj2050?.[m] ?? null
                    const normal = entry?.normal?.[m] ?? null
                    const anomaly = normal !== null ? Math.round((city.apparent_temp_max - normal) * 10) / 10 : null
                    return (
                      <Link
                        key={city.id}
                        href={`/a/${slugify(city.name)}`}
                        className="flex items-center justify-between py-2 px-3 rounded-2xl hover:bg-neutral-50 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-neutral-800 group-hover:text-neutral-900">{city.name}</span>
                          <span className="text-xs text-neutral-400 ml-2 hidden sm:inline">{city.region}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-black text-sm text-neutral-700">{city.apparent_temp_max}&deg;C</span>
                          {anomaly !== null && (
                            <span className={`text-xs font-semibold hidden sm:block ${anomaly > 0 ? "text-orange-600" : "text-blue-600"}`}>
                              {fmtDelta(anomaly)}&deg;
                            </span>
                          )}
                          {proj2050 !== null && (
                            <span className="text-xs text-purple-700/60 hidden lg:block">
                              2050 : {fmtDelta(proj2050)}
                            </span>
                          )}
                          <span className="text-neutral-300 group-hover:text-neutral-500 transition-colors text-sm">&rarr;</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Nudge partage */}
              <div className="col-span-2">
                <ShareButton
                  text={`La France en ${monthName} : ressenti moyen ${avgTemp}°C sur ${citiesFR.length} villes${biggestAnomaly ? `. Anomalie max : ${biggestAnomaly.name} a ${biggestAnomaly.anomaly !== null ? (biggestAnomaly.anomaly > 0 ? "+" : "") + biggestAnomaly.anomaly.toFixed(1) + " degres" : ""}` : ""}. Données ERA5 / GIEC sur cestchaud.fr`}
                  url="https://www.cestchaud.fr/en/france"
                  label="Partager ce classement"
                  variant="nudge"
                />
              </div>

            </div>
          </div>
        </div>
        <PageFooter className="px-5 py-3" />
      </div>
    </>
  )
}
