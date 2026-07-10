import type { Metadata } from "next"
import Link from "next/link"
import CitySearch from "@/components/CitySearch"
import GeolocateButton from "@/components/GeolocateButton"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { fmtDelta } from "@/lib/format"
import { slugify } from "@/lib/slugify"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import ShareButton from "@/components/ShareButton"
import type { ClimateEntry } from "@/lib/climate"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "En vrai, c'est chaud - cestchaud.fr",
  description: "Tableau de bord climatique du jour : anomalies, records, tendances ERA5 et projections GIEC 2050 pour les grandes villes françaises.",
  metadataBase: new URL("https://www.cestchaud.fr"),
  openGraph: {
    title: "En vrai, c'est chaud - cestchaud.fr",
    description: "Anomalies du jour, records de chaleur, projections GIEC 2050. Le tableau de bord climatique de la France.",
    url: "https://www.cestchaud.fr",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "https://www.cestchaud.fr/og/home.png", width: 1200, height: 630, alt: "En vrai, c'est chaud - cestchaud.fr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "En vrai, c'est chaud - cestchaud.fr",
    description: "Anomalies du jour, records de chaleur, projections GIEC 2050.",
    images: ["https://www.cestchaud.fr/og/home.png"],
  },
}

const MONTHS_DISPLAY = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]

function anomalyBg(a: number | null): string {
  if (a === null) return "bg-neutral-200"
  if (a > 5) return "bg-[#ef4444]/20"
  if (a > 3) return "bg-[#f4a27a]"
  if (a > 1) return "bg-[#fde68a]"
  if (a < -3) return "bg-[#60a5fa]/30"
  if (a < -1) return "bg-[#a5f3fc]/50"
  return "bg-neutral-100"
}

function anomalyHex(a: number | null): string {
  if (a === null) return "#cbd5e1"
  if (a <= -6) return "#1d4ed8"
  if (a <= -3) return "#60a5fa"
  if (a <= 0) return "#a5f3fc"
  if (a <= 3) return "#fde68a"
  if (a <= 6) return "#fb923c"
  if (a <= 10) return "#ef4444"
  return "#7f1d1d"
}

function daySeed() {
  return Math.floor(Date.now() / 86_400_000)
}

type CityWithClimate = {
  id: string
  name: string
  region: string
  lat: number
  lon: number
  apparent_temp_max: number
  normal: number | null
  anomaly: number | null
  trend: number | null
  proj2030: number | null
  proj2050: number | null
}

function buildInsights(params: {
  citiesWithClimate: CityWithClimate[]
  month: number
  avgTemp: number
  avgAnomaly: number | null
  avgTrend: number | null
}) {
  const { citiesWithClimate, month, avgAnomaly, avgTrend } = params
  const monthName = MONTHS_DISPLAY[month]
  const withAnomaly = citiesWithClimate.filter((c) => c.anomaly !== null)
  const withProj = citiesWithClimate.filter((c) => c.proj2050 !== null)
  const sorted = [...citiesWithClimate].sort((a, b) => b.apparent_temp_max - a.apparent_temp_max)
  const hottest = sorted[0]
  const coolest = sorted[sorted.length - 1]
  const above30 = citiesWithClimate.filter((c) => c.apparent_temp_max >= 30).length
  const above35 = citiesWithClimate.filter((c) => c.apparent_temp_max >= 35).length

  const topHotAnomaly = withAnomaly.filter((c) => c.anomaly! > 0).reduce<CityWithClimate | null>(
    (a, b) => (a === null || b.anomaly! > a.anomaly!) ? b : a, null
  )
  const topColdAnomaly = withAnomaly.filter((c) => c.anomaly! < 0).reduce<CityWithClimate | null>(
    (a, b) => (a === null || b.anomaly! < a.anomaly!) ? b : a, null
  )
  const mostImpacted2050 = withProj.reduce<CityWithClimate | null>(
    (a, b) => (a === null || b.proj2050! > a.proj2050!) ? b : a, null
  )

  const insights: Array<{ label: string; value: string; detail: string; color: string; slug?: string }> = []

  if (topHotAnomaly && topHotAnomaly.anomaly! >= 1.5) {
    const a = topHotAnomaly.anomaly!
    const intensity = a >= 6 ? "un écart exceptionnel" : a >= 4 ? "une anomalie marquée" : "un léger excès de chaleur"
    insights.push({
      label: "Anomalie du jour",
      value: `+${a.toFixed(1)}°C`,
      detail: `${topHotAnomaly.name} (${topHotAnomaly.region}) affiche ${intensity} par rapport à la normale ERA5 de ${monthName}.`,
      color: a >= 5 ? "bg-[#f4a27a]" : "bg-[#fde68a]",
      slug: slugify(topHotAnomaly.name),
    })
  } else if (topColdAnomaly && topColdAnomaly.anomaly! <= -1.5) {
    const a = topColdAnomaly.anomaly!
    insights.push({
      label: "Fraîcheur du jour",
      value: `${a.toFixed(1)}°C`,
      detail: `${topColdAnomaly.name} (${topColdAnomaly.region}) est en dessous de la normale ERA5 de ${monthName}. Un répit bienvenu.`,
      color: "bg-[#a8c4d4]",
      slug: slugify(topColdAnomaly.name),
    })
  }

  if (hottest && coolest) {
    const spread = hottest.apparent_temp_max - coolest.apparent_temp_max
    const spreadDesc = spread >= 15 ? "un gradient nord-sud très marqué" : spread >= 10 ? "un écart notable" : "une relative homogénéité"
    insights.push({
      label: "Amplitude nationale",
      value: `${spread.toFixed(0)}°C`,
      detail: `De ${coolest.apparent_temp_max}°C à ${coolest.name} jusqu'à ${hottest.apparent_temp_max}°C à ${hottest.name}. ${spreadDesc} ce ${monthName}.`,
      color: "bg-[#dbeafe]",
    })
  }

  if (avgTrend !== null) {
    const trendAbs = Math.abs(avgTrend)
    insights.push({
      label: "Tendance ERA5 - 30 ans",
      value: `${fmtDelta(avgTrend)}°C`,
      detail: `En moyenne nationale, ${monthName} a gagné ${fmtDelta(avgTrend)}°C depuis 1990. ${trendAbs >= 1.5 ? "Une tendance qui s'accélère et dépasse les moyennes mondiales." : "Une évolution mesurée, mais continue et documentée."}`,
      color: "bg-[#d1fae5]",
    })
  }

  if (mostImpacted2050) {
    const delta = mostImpacted2050.proj2050!
    insights.push({
      label: "Projection GIEC 2050",
      value: `+${delta.toFixed(1)}°C`,
      detail: `${mostImpacted2050.name} (${mostImpacted2050.region}) est la ville la plus impactée d'ici 2050 selon le scénario SSP2-4.5.`,
      color: "bg-[#c4b8d4]",
      slug: slugify(mostImpacted2050.name),
    })
  }

  if (avgAnomaly !== null && Math.abs(avgAnomaly) >= 0.5) {
    const avgSign = avgAnomaly > 0 ? "+" : ""
    const ctx = avgAnomaly > 0
      ? above35 > 0 ? `${above35} ville${above35 > 1 ? "s" : ""} dépass${above35 > 1 ? "ent" : "e"} 35°C.`
        : above30 > 0 ? `${above30} ville${above30 > 1 ? "s" : ""} sont au-dessus de 30°C.`
        : "Les températures restent sous 30°C malgré l'excédent."
      : "Les températures sont en retrait par rapport aux normales."
    insights.push({
      label: "Vue d'ensemble",
      value: `${avgSign}${avgAnomaly.toFixed(1)}°C`,
      detail: `La France est en moyenne ${avgSign}${avgAnomaly.toFixed(1)}°C ${avgAnomaly > 0 ? "au-dessus" : "en dessous"} des normales de ${monthName}. ${ctx}`,
      color: avgAnomaly > 1 ? "bg-[#fff1e6]" : "bg-[#e0f2fe]",
    })
  }

  return insights
}

export default async function Home() {
  const { citiesFR, fetchedAt } = await getWeatherData()
  const climateMap = loadClimateMap()

  const month = new Date(fetchedAt).getMonth()
  const monthName = MONTHS_DISPLAY[month]

  const citiesWithClimate: CityWithClimate[] = citiesFR.map((c) => {
    const entry = climateMap[c.id] as ClimateEntry
    const normal = entry?.normal?.[month] ?? null
    const anomaly = normal !== null ? Math.round((c.apparent_temp_max - normal) * 10) / 10 : null
    const trend = entry?.trend?.[month] ?? null
    const proj2030 = entry?.proj2030?.[month] ?? null
    const proj2050 = entry?.proj2050?.[month] ?? null
    return { ...c, normal, anomaly, trend, proj2030, proj2050 }
  })

  const sorted = [...citiesWithClimate].sort((a, b) => b.apparent_temp_max - a.apparent_temp_max)
  const hottest = sorted[0]
  const coolest = sorted[sorted.length - 1]

  const top3Anomaly = [...citiesWithClimate]
    .filter((c) => c.anomaly !== null)
    .sort((a, b) => b.anomaly! - a.anomaly!)
    .slice(0, 3)

  const avgTemp = Math.round(citiesWithClimate.reduce((s, c) => s + c.apparent_temp_max, 0) / citiesWithClimate.length)

  const anomalyValues = citiesWithClimate.map((c) => c.anomaly).filter((a): a is number => a !== null)
  const avgAnomaly = anomalyValues.length > 0
    ? Math.round((anomalyValues.reduce((a, b) => a + b, 0) / anomalyValues.length) * 10) / 10
    : null

  const trendValues = citiesWithClimate.map((c) => c.trend).filter((t): t is number => t !== null)
  const avgTrend = trendValues.length > 0
    ? Math.round((trendValues.reduce((a, b) => a + b, 0) / trendValues.length) * 10) / 10
    : null

  const insights = buildInsights({ citiesWithClimate, month, avgTemp, avgAnomaly, avgTrend })

  const spectreSorted = [...citiesWithClimate].sort((a, b) => (a.anomaly ?? 0) - (b.anomaly ?? 0))
  const spectreMax = spectreSorted[spectreSorted.length - 1]
  const spectreMin = spectreSorted[0]

  const seed = daySeed()
  const spotlightCity = citiesWithClimate[seed % citiesWithClimate.length]
  const spotlightEntry = climateMap[spotlightCity.id] as ClimateEntry
  const spotlightNormal = spotlightEntry?.normal?.[month] ?? null
  const spotlightProj2050 = spotlightEntry?.proj2050?.[month] ?? null

  const discoverCity = citiesWithClimate[(seed + Math.floor(citiesWithClimate.length / 2)) % citiesWithClimate.length]

  const dataLabel = new Date(fetchedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  const citiesForSearch = citiesFR.map(c => ({ id: c.id, name: c.name, lat: c.lat, lon: c.lon, region: c.region }))

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <SiteHeader subtitle={`Données du ${dataLabel}. Ressenti max, anomalies ERA5, projections GIEC 2030-2050.`} />

      <main className="flex-1 px-3 lg:px-4 pb-4">
        <div className="space-y-3">

          {/* ── 0. Recherche ── */}
          <div className="flex items-center gap-2 max-w-lg">
            <div className="flex-1">
              <CitySearch cities={citiesForSearch} />
            </div>
            <GeolocateButton cities={citiesForSearch} />
          </div>

          {/* ── 1. Records du jour ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href={`/a/${slugify(hottest.name)}`} className="bg-[#fed7aa]/80 hover:bg-[#fbbf77]/80 transition-colors rounded-3xl p-5 group">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900/50 mb-3">Plus chaud aujourd&apos;hui</p>
              <div className="text-4xl font-black text-orange-900 leading-none">{hottest.apparent_temp_max}&deg;C</div>
              <p className="text-sm font-bold text-orange-900/80 mt-1.5 truncate group-hover:underline">{hottest.name}</p>
              <p className="text-xs text-orange-900/50 truncate">{hottest.region}</p>
            </Link>

            <Link href={`/a/${slugify(coolest.name)}`} className="bg-[#bfdbfe]/70 hover:bg-[#93c5fd]/60 transition-colors rounded-3xl p-5 group">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/50 mb-3">Plus frais aujourd&apos;hui</p>
              <div className="text-4xl font-black text-blue-900 leading-none">{coolest.apparent_temp_max}&deg;C</div>
              <p className="text-sm font-bold text-blue-900/80 mt-1.5 truncate group-hover:underline">{coolest.name}</p>
              <p className="text-xs text-blue-900/50 truncate">{coolest.region}</p>
            </Link>

            <div className="bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">Moyenne France</p>
              <div className="text-4xl font-black text-neutral-900 leading-none">{avgTemp}&deg;C</div>
              <p className="text-xs text-neutral-400 mt-1.5">ressenti max &middot; {monthName}</p>
              {avgAnomaly !== null && (
                <p className={`text-xs font-semibold mt-1 ${avgAnomaly > 0 ? "text-orange-600" : "text-blue-600"}`}>
                  {fmtDelta(avgAnomaly)}&deg;C vs normale
                </p>
              )}
            </div>

            <div className={`rounded-3xl p-5 ${
              avgAnomaly !== null && avgAnomaly > 2 ? "bg-[#f4a27a]"
              : avgAnomaly !== null && avgAnomaly > 0 ? "bg-[#fde68a]"
              : avgAnomaly !== null && avgAnomaly < -2 ? "bg-[#a8c4d4]"
              : avgAnomaly !== null ? "bg-[#d1fae5]"
              : "bg-neutral-200"
            }`}>
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/40 mb-3">Anomalie nationale</p>
              {avgAnomaly !== null ? (
                <>
                  <div className="text-4xl font-black text-neutral-900 leading-none">{fmtDelta(avgAnomaly)}&deg;C</div>
                  <p className="text-xs text-black/50 mt-1.5">
                    {avgAnomaly > 2 ? "nettement au-dessus" : avgAnomaly > 0 ? "légèrement au-dessus" : avgAnomaly < -2 ? "nettement en dessous" : "dans la normale"} de la normale ERA5
                  </p>
                </>
              ) : (
                <div className="text-2xl font-black text-black/20">-</div>
              )}
            </div>
          </div>

          {/* ── 2. Spectre + Top 3 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

            <div className="lg:col-span-2 bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">
                Spectre de chaleur &middot; {citiesWithClimate.length} villes
              </p>
              <p className="text-xs text-neutral-400 mb-4">
                Anomalie vs normale ERA5 de {monthName}, de la plus froide à la plus chaude
              </p>

              <div className="flex rounded-xl overflow-hidden h-10 mb-3">
                {spectreSorted.map((city) => (
                  <div
                    key={city.id}
                    title={`${city.name} : ${city.anomaly !== null ? (city.anomaly > 0 ? "+" : "") + city.anomaly.toFixed(1) + "°C" : "N/A"}`}
                    style={{ flex: 1, backgroundColor: anomalyHex(city.anomaly) }}
                  />
                ))}
              </div>

              <div className="flex justify-between text-xs text-neutral-500 mb-5">
                <span>
                  {spectreMin.anomaly !== null ? `${spectreMin.anomaly > 0 ? "+" : ""}${spectreMin.anomaly.toFixed(1)}°C` : "?"} &middot; {spectreMin.name}
                </span>
                <span>
                  {spectreMax.name} &middot; {spectreMax.anomaly !== null ? `${spectreMax.anomaly > 0 ? "+" : ""}${spectreMax.anomaly.toFixed(1)}°C` : "?"}
                </span>
              </div>

              {/* 3 stats chocs -- colonne sur mobile, 3 cols sur sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {top3Anomaly[0] && (
                  <Link href={`/a/${slugify(top3Anomaly[0].name)}`} className={`rounded-2xl p-4 ${anomalyBg(top3Anomaly[0].anomaly)} group`}>
                    <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-black/40 mb-1">Anomalie max</p>
                    <p className="text-2xl font-black text-neutral-900 leading-none">{fmtDelta(top3Anomaly[0].anomaly)}&deg;C</p>
                    <p className="text-sm text-black/50 mt-1.5 group-hover:underline">{top3Anomaly[0].name}</p>
                    <p className="text-xs text-black/30">{top3Anomaly[0].apparent_temp_max}&deg;C ressenti</p>
                  </Link>
                )}

                <div className="rounded-2xl p-4 bg-[#d1fae5]">
                  <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-green-900/40 mb-1">Tendance 30 ans</p>
                  {avgTrend !== null ? (
                    <>
                      <p className="text-2xl font-black text-green-900 leading-none">{fmtDelta(avgTrend)}&deg;C</p>
                      <p className="text-sm text-green-900/60 mt-1.5">depuis 1990 en {monthName}</p>
                      <p className="text-xs text-green-900/40">moyenne nationale ERA5</p>
                    </>
                  ) : (
                    <p className="text-xl font-black text-green-900/20">N/A</p>
                  )}
                </div>

                {top3Anomaly[0] && (
                  <div className="rounded-2xl p-4 bg-[#c4b8d4]">
                    <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-purple-900/40 mb-1">GIEC 2050</p>
                    {top3Anomaly[0].proj2050 !== null ? (
                      <>
                        <p className="text-2xl font-black text-purple-900 leading-none">+{top3Anomaly[0].proj2050.toFixed(1)}&deg;C</p>
                        <p className="text-sm text-purple-900/60 mt-1.5">supplémentaires</p>
                        <p className="text-xs text-purple-900/40">à {top3Anomaly[0].name}</p>
                      </>
                    ) : (
                      <p className="text-xl font-black text-purple-900/20">N/A</p>
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/citoyens"
                className="mt-4 flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-2xl px-4 py-3 group"
              >
                <p className="text-sm font-semibold text-white">Ces chiffres changent chaque jour. La tendance, elle, ne change pas.</p>
                <span className="shrink-0 text-white/40 group-hover:text-white ml-3 transition-colors whitespace-nowrap">Écrire à vos élus &rarr;</span>
              </Link>
            </div>

            {/* Top 3 anomalies */}
            <div className="bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-4">Top anomalies du jour</p>
              {top3Anomaly.length === 0 ? (
                <p className="text-sm text-neutral-400">Données insuffisantes.</p>
              ) : (
                <div className="space-y-3">
                  {top3Anomaly.map((city, i) => {
                    const a = city.anomaly!
                    return (
                      <Link key={city.id} href={`/a/${slugify(city.name)}`} className="flex items-center gap-3 group">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-black text-neutral-500">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-900 truncate group-hover:underline">{city.name}</p>
                          <p className="text-xs text-neutral-400 truncate">{city.region}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-sm font-black ${a > 4 ? "text-red-600" : a > 2 ? "text-orange-500" : "text-neutral-700"}`}>
                            {fmtDelta(a)}&deg;C
                          </p>
                          <p className="text-[10px] text-neutral-400">{city.apparent_temp_max}&deg;C ressenti</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
              <Link href="/carte" className="mt-5 block text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors">
                Carte des anomalies &rarr;
              </Link>

              <div className="mt-5 pt-5 border-t border-neutral-100">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">Découverte du jour</p>
                <Link href={`/a/${slugify(discoverCity.name)}`} className="group block">
                  <p className="text-sm font-black text-neutral-900 group-hover:underline">{discoverCity.name}</p>
                  <p className="text-xs text-neutral-400 mb-2">{discoverCity.region}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-neutral-100 rounded-xl px-2.5 py-1 text-xs font-semibold text-neutral-700">
                      {discoverCity.apparent_temp_max}&deg;C aujourd&apos;hui
                    </span>
                    {discoverCity.anomaly !== null && (
                      <span className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${anomalyBg(discoverCity.anomaly)} text-neutral-800`}>
                        {fmtDelta(discoverCity.anomaly)}&deg;C vs normale
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">Voir toutes les projections GIEC &rarr;</p>
                </Link>
              </div>
            </div>
          </div>

          {/* ── 3. Ville du jour ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className={`rounded-3xl p-6 ${anomalyBg(spotlightCity.anomaly)}`}>
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/40 mb-1">Ville du jour</p>
              <p className="text-xs text-black/40 mb-4">Change chaque matin &middot; ERA5 + GIEC</p>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-black/40 mb-0.5">{spotlightCity.region}</p>
                  <h2 className="text-2xl font-black text-neutral-900 leading-tight">{spotlightCity.name}</h2>
                  <div className="mt-3 space-y-1.5">
                    <p className="text-sm text-black/70">
                      Ressenti max : <strong className="text-neutral-900">{spotlightCity.apparent_temp_max}&deg;C</strong>
                    </p>
                    {spotlightCity.anomaly !== null && (
                      <p className="text-sm text-black/70">
                        Anomalie :{" "}
                        <strong className={spotlightCity.anomaly > 2 ? "text-orange-700" : spotlightCity.anomaly < -2 ? "text-blue-700" : "text-neutral-900"}>
                          {fmtDelta(spotlightCity.anomaly)}&deg;C
                        </strong>{" "}
                        vs normale {monthName}
                      </p>
                    )}
                    {spotlightNormal !== null && (
                      <p className="text-sm text-black/70">
                        Normale ERA5 : <strong className="text-neutral-900">{spotlightNormal.toFixed(1)}&deg;C</strong>
                      </p>
                    )}
                    {spotlightProj2050 !== null && (
                      <p className="text-sm text-black/70">
                        Projection 2050 : <strong className="text-purple-900">+{spotlightProj2050.toFixed(1)}&deg;C</strong> supplémentaires
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-6xl font-black text-neutral-900 leading-none">{spotlightCity.apparent_temp_max}&deg;</div>
                  <div className="text-sm text-black/30 mt-1">ressenti max</div>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <Link
                  href={`/a/${slugify(spotlightCity.name)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-black text-neutral-900 hover:underline"
                >
                  Fiche complète &rarr;
                </Link>
                <ShareButton
                  text={`${spotlightCity.name} aujourd'hui : ${spotlightCity.apparent_temp_max}°C de ressenti${spotlightCity.anomaly !== null ? `, soit ${spotlightCity.anomaly > 0 ? "+" : ""}${spotlightCity.anomaly.toFixed(1)}°C vs la normale de ${MONTHS_DISPLAY[month]}` : ""}${spotlightProj2050 !== null ? `. GIEC 2050 : +${spotlightProj2050.toFixed(1)}°C supplémentaires.` : "."} cestchaud.fr`}
                  url="https://www.cestchaud.fr"
                  label="Partager"
                  variant="inline"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {insights.slice(0, 2).map((ins, i) => (
                <div key={i} className={`${ins.color} rounded-3xl p-5`}>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/40 mb-2">{ins.label}</p>
                  <div className="text-3xl font-black text-neutral-900 leading-none mb-2">{ins.value}</div>
                  <p className="text-sm text-black/60 leading-relaxed">{ins.detail}</p>
                  {ins.slug && (
                    <Link href={`/a/${ins.slug}`} className="mt-2 text-xs font-semibold text-black/40 hover:text-black/70 transition-colors block">
                      Fiche de la ville &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. Insights restants ── */}
          {insights.length > 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.slice(2).map((ins, i) => (
                <div key={i} className={`${ins.color} rounded-3xl p-5`}>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/40 mb-2">{ins.label}</p>
                  <div className="text-3xl font-black text-neutral-900 leading-none mb-2">{ins.value}</div>
                  <p className="text-sm text-black/60 leading-relaxed">{ins.detail}</p>
                  {ins.slug && (
                    <Link href={`/a/${ins.slug}`} className="mt-2 text-xs font-semibold text-black/40 hover:text-black/70 transition-colors block">
                      Fiche de la ville &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── 5. Nudge partage du jour ── */}
          <ShareButton
            text={`En France ce ${dataLabel} : ressenti moyen ${avgTemp}°C${avgAnomaly !== null ? `, soit ${avgAnomaly > 0 ? "+" : ""}${avgAnomaly.toFixed(1)}°C vs la normale ERA5` : ""}${top3Anomaly[0] ? `. Anomalie max : ${top3Anomaly[0].name} à ${top3Anomaly[0].anomaly !== null ? (top3Anomaly[0].anomaly > 0 ? "+" : "") + top3Anomaly[0].anomaly.toFixed(1) + "°C" : ""}` : ""}.`}
            url="https://www.cestchaud.fr"
            label="Partager l'état du jour"
            variant="nudge"
          />

          {/* ── 6. Pages du site ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/explorer" className="bg-white rounded-3xl p-5 hover:bg-neutral-50 transition-colors group flex flex-col">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">Explorer</p>
              <p className="text-base font-black text-neutral-900 leading-snug mb-2">Jumeaux climatiques</p>
              <p className="text-xs text-neutral-500 leading-relaxed flex-1">
                Cliquez une ville française et découvrez ses équivalents dans le monde entier. Ces villes vivent aujourd&apos;hui ce que la France vivra demain.
              </p>
              <span className="text-neutral-300 group-hover:text-neutral-700 text-lg transition-colors mt-4 block">&rarr;</span>
            </Link>

            <Link href="/carte" className="bg-[#fff1e6] rounded-3xl p-5 hover:bg-[#ffe0c8] transition-colors group flex flex-col">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900/50 mb-2">Carte</p>
              <p className="text-base font-black text-orange-900 leading-snug mb-2">Carte de chaleur</p>
              <p className="text-xs text-orange-900/60 leading-relaxed flex-1">
                Visualisez les anomalies thermiques du jour sur toute la France en un coup d&apos;oeil. Où fait-il anormalement chaud aujourd&apos;hui ?
              </p>
              <span className="text-orange-400 group-hover:text-orange-600 text-lg transition-colors mt-4 block">&rarr;</span>
            </Link>

            <Link href="/en/france" className="bg-[#dbeafe] rounded-3xl p-5 hover:bg-[#bfdbfe] transition-colors group flex flex-col">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/50 mb-2">France</p>
              <p className="text-base font-black text-blue-900 leading-snug mb-2">France en chiffres</p>
              <p className="text-xs text-blue-900/60 leading-relaxed flex-1">
                60 villes, leurs anomalies du jour, leurs tendances sur 30 ans et ce que le GIEC prédit pour 2030, 2040 et 2050.
              </p>
              <span className="text-blue-400 group-hover:text-blue-600 text-lg transition-colors mt-4 block">&rarr;</span>
            </Link>

            <Link href="/citoyens" className="bg-neutral-900 rounded-3xl p-5 hover:bg-neutral-800 transition-colors group flex flex-col">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-2">Agir</p>
              <p className="text-base font-black text-white leading-snug mb-2">Écrire à vos élus</p>
              <p className="text-xs text-white/50 leading-relaxed flex-1">
                Contactez vos sénateurs, email pré-rédigé et fondé sur les données scientifiques. Parce que la prise de conscience ne suffit pas.
              </p>
              <span className="text-white/30 group-hover:text-white text-lg transition-colors mt-4 block">&rarr;</span>
            </Link>
          </div>

          {/* ── Bloc push ── */}
          <div className="bg-white rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-5 opacity-50">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">Notifications</p>
              <p className="text-base font-black text-neutral-900 leading-snug mb-1">Le ressenti de ta ville, chaque matin</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Choisis une ville française et reçois chaque matin son ressenti max, son anomalie vs la normale ERA5, et son jumeau climatique du jour. Aucun compte requis.
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-2 bg-neutral-200 text-neutral-400 font-semibold text-sm rounded-2xl px-5 py-3 cursor-not-allowed">
              Bientôt disponible
            </span>
          </div>

          {/* ── 6. Bloc pédagogique élus ── */}
          <div className="bg-neutral-900 rounded-3xl p-6 lg:p-8">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-3">Pourquoi agir</p>
              <h2 className="text-2xl font-black text-white leading-tight mb-4">
                La science mesure. Le Sénat légifère.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                Les données ERA5 et CMIP6 documentent ce qui se passe et ce qui viendra. Mais transformer ces courbes en politiques publiques, c&apos;est le rôle des élus.
                Les sénateurs siègent dans les commissions qui définissent les normes de construction, les plans canicule, les codes de l&apos;urbanisme, la gestion de l&apos;eau.
              </p>
              <p className="text-sm text-white/70 leading-relaxed mb-5">
                Un email personnel, factuel, reçu par plusieurs citoyens d&apos;une même région a plus d&apos;impact qu&apos;une pétition. C&apos;est documentable, traçable, et ça reste dans les archives parlementaires.
              </p>
              <Link
                href="/citoyens"
                className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 transition-colors text-neutral-900 font-black text-sm rounded-2xl px-5 py-3"
              >
                Trouver mon sénateur et envoyer un email &rarr;
              </Link>
            </div>
          </div>

          <PageFooter />
        </div>
      </main>
    </div>
  )
}
