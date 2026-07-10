import type { Metadata } from "next"
import Link from "next/link"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { fmtDelta } from "@/lib/format"
import { slugify } from "@/lib/slugify"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import MiniHeatMap from "@/components/MiniHeatMap"
import type { ClimateEntry } from "@/lib/climate"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "En vrai, c'est chaud - cestchaud.fr",
  description: "Tableau de bord climatique du jour : anomalies, records, projections GIEC. La météo de la France vue par les données ERA5 et CMIP6.",
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

const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]

function buildInsights(params: {
  citiesWithClimate: Array<{
    id: string
    name: string
    region: string
    apparent_temp_max: number
    normal: number | null
    anomaly: number | null
    trend: number | null
    proj2030: number | null
    proj2050: number | null
  }>
  month: number
  avgTemp: number
  avgAnomaly: number | null
  avgTrend: number | null
}) {
  const { citiesWithClimate, month, avgTemp, avgAnomaly, avgTrend } = params
  const monthName = MONTHS_FR[month]
  const withAnomaly = citiesWithClimate.filter((c) => c.anomaly !== null)
  const withProj = citiesWithClimate.filter((c) => c.proj2050 !== null)
  const sorted = [...citiesWithClimate].sort((a, b) => b.apparent_temp_max - a.apparent_temp_max)

  const hottest = sorted[0]
  const coolest = sorted[sorted.length - 1]
  const above30 = citiesWithClimate.filter((c) => c.apparent_temp_max >= 30).length
  const above35 = citiesWithClimate.filter((c) => c.apparent_temp_max >= 35).length

  const topAnomaly = withAnomaly.length > 0
    ? withAnomaly.reduce((a, b) => Math.abs(b.anomaly!) > Math.abs(a.anomaly!) ? b : a)
    : null

  const hotAnomaly = withAnomaly.filter((c) => c.anomaly! > 0)
  const topHotAnomaly = hotAnomaly.length > 0
    ? hotAnomaly.reduce((a, b) => b.anomaly! > a.anomaly! ? b : a)
    : null

  const coldAnomaly = withAnomaly.filter((c) => c.anomaly! < 0)
  const topColdAnomaly = coldAnomaly.length > 0
    ? coldAnomaly.reduce((a, b) => b.anomaly! < a.anomaly! ? b : a)
    : null

  const mostImpacted2050 = withProj.length > 0
    ? withProj.reduce((a, b) => b.proj2050! > a.proj2050! ? b : a)
    : null

  const insights: Array<{ label: string; value: string; detail: string; color: string; slug?: string }> = []

  // Insight 1 — Anomalie dominante du jour
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
  } else if (topAnomaly) {
    const a = topAnomaly.anomaly!
    const sign = a > 0 ? "+" : ""
    insights.push({
      label: "Anomalie du jour",
      value: `${sign}${a.toFixed(1)}°C`,
      detail: `${topAnomaly.name} (${topAnomaly.region}) s'écarte le plus des normales de ${monthName}.`,
      color: "bg-neutral-200",
      slug: slugify(topAnomaly.name),
    })
  }

  // Insight 2 — Amplitude nationale
  if (hottest && coolest) {
    const spread = hottest.apparent_temp_max - coolest.apparent_temp_max
    const spreadDesc = spread >= 15 ? "un gradient nord-sud très marqué" : spread >= 10 ? "un écart notable" : "une homogénéité relative"
    insights.push({
      label: "Amplitude nationale",
      value: `${spread.toFixed(0)}°C`,
      detail: `De ${coolest.apparent_temp_max}°C à ${coolest.name} jusqu'à ${hottest.apparent_temp_max}°C à ${hottest.name} — ${spreadDesc} ce ${monthName}.`,
      color: "bg-[#dbeafe]",
    })
  }

  // Insight 3 — Tendance 30 ans
  if (avgTrend !== null) {
    const trendAbs = Math.abs(avgTrend)
    const trendDesc = trendAbs >= 2 ? "une hausse très rapide" : trendAbs >= 1 ? "une hausse significative" : "un réchauffement régulier"
    insights.push({
      label: "Tendance ERA5 — 30 ans",
      value: `${fmtDelta(avgTrend)}°C`,
      detail: `En moyenne nationale, ${monthName} a gagné ${fmtDelta(avgTrend)}°C depuis 1990. ${trendAbs >= 1.5 ? "Une tendance qui s'accélère et dépasse les moyennes mondiales." : "Une évolution mesurée, mais continue et documentée."}`,
      color: "bg-[#d1fae5]",
    })
  }

  // Insight 4 — Projection 2050
  if (mostImpacted2050) {
    const delta = mostImpacted2050.proj2050!
    const city2050Desc = delta >= 3 ? "une transformation climatique radicale" : delta >= 2 ? "un réchauffement sensible" : "une évolution notable"
    insights.push({
      label: "Projection GIEC 2050",
      value: `+${delta.toFixed(1)}°C`,
      detail: `${mostImpacted2050.name} (${mostImpacted2050.region}) est la ville la plus impactée d'ici 2050 selon le scénario SSP2-4.5 — ${city2050Desc} attendu pour ce mois.`,
      color: "bg-[#c4b8d4]",
      slug: slugify(mostImpacted2050.name),
    })
  }

  // Insight 5 — Contexte du jour (chaleur ou fraîcheur générale)
  if (avgAnomaly !== null) {
    const absAvg = Math.abs(avgAnomaly)
    const avgSign = avgAnomaly > 0 ? "+" : ""
    if (absAvg >= 0.5) {
      const ctx = avgAnomaly > 0
        ? above35 > 0
          ? `${above35} ville${above35 > 1 ? "s" : ""} dépass${above35 > 1 ? "ent" : "e"} 35°C.`
          : above30 > 0
            ? `${above30} ville${above30 > 1 ? "s" : ""} sont au-dessus de 30°C.`
            : "Les températures restent en dessous de 30°C malgré l'excédent."
        : "Les températures sont en retrait par rapport aux normales."
      insights.push({
        label: "Vue d'ensemble",
        value: `${avgSign}${avgAnomaly.toFixed(1)}°C`,
        detail: `La France est en moyenne ${avgSign}${avgAnomaly.toFixed(1)}°C ${avgAnomaly > 0 ? "au-dessus" : "en dessous"} des normales de ${monthName}. ${ctx}`,
        color: avgAnomaly > 1 ? "bg-[#fff1e6]" : "bg-[#e0f2fe]",
      })
    }
  }

  return insights
}

export default async function Home() {
  const { citiesFR, fetchedAt } = await getWeatherData()
  const climateMap = loadClimateMap()

  const month = new Date(fetchedAt).getMonth()
  const monthName = MONTHS_FR[month]

  const citiesWithClimate = citiesFR.map((c) => {
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

  const citiesForMap = citiesWithClimate.map(({ id, name, lat, lon, region, apparent_temp_max, normal, anomaly }) => ({
    id, name, lat, lon, region, apparent_temp_max, normal, anomaly,
  }))

  const insights = buildInsights({ citiesWithClimate, month, avgTemp, avgAnomaly, avgTrend })

  const dataLabel = new Date(fetchedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <SiteHeader subtitle={`Tableau de bord climatique du ${dataLabel} — données ERA5, CMIP6 / GIEC.`} />

      <main className="flex-1 px-3 lg:px-4 pb-4">
        <div className="max-w-5xl mx-auto">

          {/* ── Ligne 1 : records + mini-carte ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">

            {/* Plus chaud */}
            <Link
              href={`/a/${slugify(hottest.name)}`}
              className="bg-[#fed7aa]/80 hover:bg-[#fbbf77]/80 transition-colors rounded-3xl p-5 group"
            >
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900/50 mb-3">
                Plus chaud aujourd'hui
              </p>
              <div className="text-4xl font-black text-orange-900 leading-none">
                {hottest.apparent_temp_max}°C
              </div>
              <p className="text-sm font-bold text-orange-900/80 mt-1.5 truncate group-hover:underline">{hottest.name}</p>
              <p className="text-xs text-orange-900/50 truncate">{hottest.region}</p>
            </Link>

            {/* Plus frais */}
            <Link
              href={`/a/${slugify(coolest.name)}`}
              className="bg-[#bfdbfe]/70 hover:bg-[#93c5fd]/60 transition-colors rounded-3xl p-5 group"
            >
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/50 mb-3">
                Plus frais aujourd'hui
              </p>
              <div className="text-4xl font-black text-blue-900 leading-none">
                {coolest.apparent_temp_max}°C
              </div>
              <p className="text-sm font-bold text-blue-900/80 mt-1.5 truncate group-hover:underline">{coolest.name}</p>
              <p className="text-xs text-blue-900/50 truncate">{coolest.region}</p>
            </Link>

            {/* Moyenne France */}
            <div className="bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                Moyenne France
              </p>
              <div className="text-4xl font-black text-neutral-900 leading-none">{avgTemp}°C</div>
              <p className="text-xs text-neutral-400 mt-1.5">ressenti max · {monthName}</p>
              {avgAnomaly !== null && (
                <p className={`text-xs font-semibold mt-1 ${avgAnomaly > 0 ? "text-orange-600" : "text-blue-600"}`}>
                  {fmtDelta(avgAnomaly)}°C vs normale
                </p>
              )}
            </div>

            {/* Anomalie nationale */}
            <div className={`rounded-3xl p-5 ${
              avgAnomaly !== null && avgAnomaly > 2 ? "bg-[#f4a27a]"
              : avgAnomaly !== null && avgAnomaly > 0 ? "bg-[#fde68a]"
              : avgAnomaly !== null && avgAnomaly < -2 ? "bg-[#a8c4d4]"
              : avgAnomaly !== null ? "bg-[#d1fae5]"
              : "bg-neutral-200"
            }`}>
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/40 mb-3">
                Anomalie nationale
              </p>
              {avgAnomaly !== null ? (
                <>
                  <div className="text-4xl font-black text-neutral-900 leading-none">{fmtDelta(avgAnomaly)}°C</div>
                  <p className="text-xs text-black/50 mt-1.5">
                    {avgAnomaly > 2 ? "nettement au-dessus" : avgAnomaly > 0 ? "légèrement au-dessus" : avgAnomaly < -2 ? "nettement en dessous" : "dans la normale"} de la normale ERA5
                  </p>
                </>
              ) : (
                <div className="text-2xl font-black text-black/20">—</div>
              )}
            </div>
          </div>

          {/* ── Ligne 2 : mini-carte + top 3 anomalies ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">

            {/* Mini-carte cliquable */}
            <Link href="/carte" className="lg:col-span-2 rounded-3xl overflow-hidden relative group block" style={{ minHeight: 260 }}>
              <div className="absolute inset-0 z-10 rounded-3xl ring-1 ring-black/5 pointer-events-none" />
              <MiniHeatMap cities={citiesForMap} />
              <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-0.5">Carte de chaleur</p>
                <p className="text-sm font-black text-neutral-900 group-hover:underline">Voir les anomalies du jour →</p>
              </div>
            </Link>

            {/* Top 3 anomalies */}
            <div className="bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-4">
                Top anomalies du jour
              </p>
              {top3Anomaly.length === 0 ? (
                <p className="text-sm text-neutral-400">Données insuffisantes.</p>
              ) : (
                <div className="space-y-3">
                  {top3Anomaly.map((city, i) => {
                    const a = city.anomaly!
                    return (
                      <Link
                        key={city.id}
                        href={`/a/${slugify(city.name)}`}
                        className="flex items-center gap-3 group"
                      >
                        <span className="shrink-0 w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-black text-neutral-500">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-900 truncate group-hover:underline">{city.name}</p>
                          <p className="text-xs text-neutral-400 truncate">{city.region}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-sm font-black ${a > 4 ? "text-red-600" : a > 2 ? "text-orange-500" : "text-neutral-700"}`}>
                            {fmtDelta(a)}°C
                          </p>
                          <p className="text-[10px] text-neutral-400">{city.apparent_temp_max}°C ressenti</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
              <Link
                href="/carte"
                className="mt-5 block text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                Voir toutes les anomalies →
              </Link>
            </div>
          </div>

          {/* ── Ligne 3 : insights dynamiques ── */}
          {insights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              {insights.map((ins, i) => (
                <div key={i} className={`${ins.color} rounded-3xl p-5`}>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/40 mb-2">
                    {ins.label}
                  </p>
                  <div className="text-3xl font-black text-neutral-900 leading-none mb-2">
                    {ins.value}
                  </div>
                  <p className="text-xs text-black/60 leading-relaxed">{ins.detail}</p>
                  {ins.slug && (
                    <Link
                      href={`/a/${ins.slug}`}
                      className="mt-3 text-xs font-semibold text-black/40 hover:text-black/70 transition-colors block"
                    >
                      Fiche de la ville →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Ligne 4 : entrées vers les pages ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Link href="/explorer" className="bg-white rounded-3xl p-5 hover:bg-neutral-50 transition-colors group">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">Explorer</p>
              <p className="text-base font-black text-neutral-900 leading-snug mb-1">Jumeaux climatiques</p>
              <p className="text-xs text-neutral-500 leading-relaxed">Votre ville et ses équivalents dans le monde.</p>
              <span className="text-neutral-300 group-hover:text-neutral-700 text-lg transition-colors mt-3 block">→</span>
            </Link>

            <Link href="/carte" className="bg-[#fff1e6] rounded-3xl p-5 hover:bg-[#ffe0c8] transition-colors group">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900/50 mb-3">Carte</p>
              <p className="text-base font-black text-orange-900 leading-snug mb-1">Carte de chaleur</p>
              <p className="text-xs text-orange-900/60 leading-relaxed">Anomalies du jour sur toute la France.</p>
              <span className="text-orange-400 group-hover:text-orange-600 text-lg transition-colors mt-3 block">→</span>
            </Link>

            <Link href="/en/france" className="bg-[#dbeafe] rounded-3xl p-5 hover:bg-[#bfdbfe] transition-colors group">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/50 mb-3">France</p>
              <p className="text-base font-black text-blue-900 leading-snug mb-1">France en chiffres</p>
              <p className="text-xs text-blue-900/60 leading-relaxed">36 villes, anomalies et projections GIEC.</p>
              <span className="text-blue-400 group-hover:text-blue-600 text-lg transition-colors mt-3 block">→</span>
            </Link>

            <Link href="/citoyens" className="bg-neutral-900 rounded-3xl p-5 hover:bg-neutral-800 transition-colors group">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-3">Agir</p>
              <p className="text-base font-black text-white leading-snug mb-1">Écrire à vos élus</p>
              <p className="text-xs text-white/50 leading-relaxed">Contactez vos sénateurs, email pré-rédigé.</p>
              <span className="text-white/30 group-hover:text-white text-lg transition-colors mt-3 block">→</span>
            </Link>
          </div>

          <PageFooter />
        </div>
      </main>
    </div>
  )
}
