import Link from "next/link"
import { Metadata } from "next"
import { slugify } from "@/lib/slugify"
import { getWeatherData } from "@/lib/weather-data"
import { getWeather } from "@/lib/weather-codes"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "La chaleur en France · cestchaud.fr",
  description: "Vue d'ensemble de la chaleur en France : températures actuelles, anomalies, tendances ERA5 et projections GIEC CMIP6 pour les 36 principales villes françaises.",
  alternates: { canonical: "https://cestchaud.fr/en/france" },
  openGraph: {
    title: "La chaleur en France · cestchaud.fr",
    description: "Températures, anomalies et projections climatiques pour 36 villes françaises.",
    url: "https://cestchaud.fr/en/france",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "La chaleur en France",
  url: "https://cestchaud.fr/en/france",
  description: "Vue d'ensemble climatique de la France : températures actuelles et projections GIEC pour les 36 principales villes.",
  about: {
    "@type": "Country",
    name: "France",
    sameAs: "https://www.wikidata.org/wiki/Q142",
  },
}

type ClimateEntry = {
  normal: number[]
  trend: number[]
  proj2030: (number | null)[]
  proj2040: (number | null)[]
  proj2050: (number | null)[]
} | null

let climateMap: Record<string, unknown> = {}
try { climateMap = require("@/data/climate.json") } catch {}

function fmt(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return "—"
  return n.toFixed(decimals)
}

export default async function FrancePage() {
  const { citiesFR, fetchedAt } = await getWeatherData()

  const m = new Date().getMonth()
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })
  const dataLabel = new Date(fetchedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  const sorted = [...citiesFR].sort((a, b) => b.apparent_temp_max - a.apparent_temp_max)
  const hottest = sorted[0]
  const coolest = sorted[sorted.length - 1]
  const avgTemp = Math.round(citiesFR.reduce((s, c) => s + c.apparent_temp_max, 0) / citiesFR.length)

  // Enrich with climate data
  const enriched = citiesFR.map((city) => {
    const entry = (climateMap[city.id] ?? null) as ClimateEntry
    const normal = entry?.normal?.[m] ?? null
    const trend = entry?.trend?.[m] ?? null
    const proj2040 = entry?.proj2040?.[m] ?? null
    const proj2050 = entry?.proj2050?.[m] ?? null
    const anomaly = normal !== null ? city.apparent_temp_max - normal : null
    return { ...city, normal, trend, proj2040, proj2050, anomaly }
  })

  const withTrend = enriched.filter((c) => c.trend !== null)
  const withProj2040 = enriched.filter((c) => c.proj2040 !== null)
  const withProj2050 = enriched.filter((c) => c.proj2050 !== null)
  const withAnomaly = enriched.filter((c) => c.anomaly !== null)

  const avgTrend = withTrend.length
    ? withTrend.reduce((s, c) => s + c.trend!, 0) / withTrend.length
    : null
  const avgProj2040 = withProj2040.length
    ? withProj2040.reduce((s, c) => s + c.proj2040!, 0) / withProj2040.length
    : null
  const avgProj2050 = withProj2050.length
    ? withProj2050.reduce((s, c) => s + c.proj2050!, 0) / withProj2050.length
    : null

  const biggestAnomaly = withAnomaly.length
    ? [...withAnomaly].sort((a, b) => b.anomaly! - a.anomaly!)[0]
    : null

  const top6 = [...withProj2050]
    .sort((a, b) => b.proj2050! - a.proj2050!)
    .slice(0, 6)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="h-screen flex flex-col bg-[#f5f4f0] overflow-hidden">

        {/* Header */}
        <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-black/5 bg-[#f5f4f0]">
          <Link
            href="/"
            className="font-black text-base tracking-tight text-neutral-900 hover:opacity-70 transition-opacity"
          >
            ← En vrai, c'est chaud.
          </Link>
          <span className="text-xs text-neutral-400 hidden sm:block">{today}</span>
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-3 pb-4">

              {/* Title */}
              <div className="col-span-2 bg-white rounded-3xl p-6">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                  Vue d'ensemble · {dataLabel}
                </p>
                <h1 className="text-2xl font-black text-neutral-900 leading-tight">
                  La chaleur en France
                </h1>
                <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                  Ressenti maximal journalier pour {citiesFR.length} villes françaises. Cliquez une ville pour voir sa fiche complète.
                </p>
              </div>

              {/* Ressenti moyen + ville la plus chaude */}
              <div className="bg-[#dbeafe] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-800/60 mb-3">
                  Ressenti moyen
                </p>
                <div className="text-5xl font-black text-blue-900 leading-none">{avgTemp}°C</div>
                <p className="text-xs text-blue-700/60 mt-2">moy. {citiesFR.length} villes · aujourd'hui</p>
              </div>

              {/* Plus chaud */}
              <div className="bg-[#f4a27a]/40 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900/50 mb-3">
                  Plus chaud aujourd'hui
                </p>
                <div className="text-3xl font-black text-orange-900 leading-none">{hottest.apparent_temp_max}°C</div>
                <p className="text-sm font-bold text-orange-900/70 mt-1.5">{hottest.name}</p>
                <p className="text-xs text-orange-900/40">{hottest.region}</p>
              </div>

              {/* Anomalie la plus forte */}
              <div className="bg-[#f4a27a]/20 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900/50 mb-3">
                  Plus forte anomalie
                </p>
                {biggestAnomaly ? (
                  <>
                    <div className="text-3xl font-black text-orange-900 leading-none">
                      {biggestAnomaly.anomaly! > 0 ? "+" : ""}{fmt(biggestAnomaly.anomaly)}°C
                    </div>
                    <p className="text-sm font-bold text-orange-900/70 mt-1.5">{biggestAnomaly.name}</p>
                    <p className="text-xs text-orange-900/40">vs. normale {monthName}</p>
                  </>
                ) : (
                  <p className="text-2xl font-black text-orange-900/20">—</p>
                )}
              </div>

              {/* Tendance 30 ans */}
              <div className="bg-white rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                  Tendance 30 ans
                </p>
                {avgTrend !== null ? (
                  <>
                    <div className="text-3xl font-black text-neutral-900 leading-none">
                      {avgTrend > 0 ? "+" : ""}{fmt(avgTrend)}°C
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">moy. France · depuis 1990 · {monthName}</p>
                  </>
                ) : (
                  <p className="text-2xl font-black text-neutral-300">—</p>
                )}
              </div>

              {/* Projections GIEC */}
              <div className="col-span-2 bg-[#c4b8d4] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/50 mb-1">
                  Si rien ne change…
                </p>
                <p className="text-[10px] text-purple-900/40 mb-4">
                  Modèle CMIP6 (GIEC AR6) · moyenne France · écart vs. 2000–2020
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-purple-900/60 mb-0.5">2040</p>
                    <p className="font-black text-3xl text-purple-900">
                      {avgProj2040 !== null ? `${avgProj2040 >= 0 ? "+" : ""}${fmt(avgProj2040)}°C` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-900/60 mb-0.5">2050</p>
                    <p className="font-black text-3xl text-purple-900">
                      {avgProj2050 !== null ? `${avgProj2050 >= 0 ? "+" : ""}${fmt(avgProj2050)}°C` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top 6 villes les plus impactées */}
              {top6.length > 0 && (
                <div className="col-span-2 bg-neutral-900 rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-4">
                    Villes les plus impactées · projection 2050
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {top6.map((city, i) => (
                      <Link
                        key={city.id}
                        href={`/a/${slugify(city.name)}`}
                        className="flex items-center justify-between py-2 px-3 rounded-2xl hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-white/20 text-xs font-mono w-4 shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-white truncate">{city.name}</div>
                            <div className="text-[10px] text-white/40 truncate">{city.region}</div>
                          </div>
                        </div>
                        <span className="font-black text-sm text-white/80 shrink-0 ml-2">
                          +{fmt(city.proj2050)}°C
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Toutes les villes */}
              <div className="col-span-2 bg-white rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-4">
                  Toutes les villes · du plus chaud au plus frais
                </p>
                <div className="space-y-1">
                  {sorted.map((city) => {
                    const weather = getWeather(city.weathercode)
                    return (
                      <Link
                        key={city.id}
                        href={`/a/${slugify(city.name)}`}
                        className="flex items-center justify-between py-2.5 px-3 rounded-2xl hover:bg-neutral-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-base">{weather.emoji}</span>
                          <div className="min-w-0">
                            <span className="font-semibold text-sm text-neutral-800 group-hover:text-neutral-900">{city.name}</span>
                            <span className="text-xs text-neutral-400 ml-2">{city.region}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-black text-sm text-neutral-700">{city.apparent_temp_max}°C</span>
                          <span className="text-neutral-300 group-hover:text-neutral-500 transition-colors text-sm">→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Plus frais */}
              <div className="col-span-2 bg-[#a8c4d4]/40 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/50 mb-3">
                  Plus frais aujourd'hui
                </p>
                <div className="text-3xl font-black text-blue-900 leading-none">{coolest.apparent_temp_max}°C</div>
                <p className="text-sm font-bold text-blue-900/70 mt-1.5">{coolest.name}</p>
                <p className="text-xs text-blue-900/40">{coolest.region}</p>
              </div>

              {/* Footer */}
              <div className="col-span-2 text-center text-xs text-neutral-400 pb-1">
                cestchaud.fr · Open-Meteo · ERA5 · CMIP6 ·{" "}
                <a
                  href="https://leswww.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-600"
                >
                  © LesWWW
                </a>
                {" · "}
                <a
                  href="https://leswww.com/mentions-legales/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-neutral-600"
                >
                  Mentions légales
                </a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
