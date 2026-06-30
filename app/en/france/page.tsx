import Link from "next/link"
import { Metadata } from "next"
import { slugify } from "@/lib/slugify"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { fmtDelta } from "@/lib/format"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import type { ClimateEntry } from "@/lib/climate"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "La chaleur en France · cestchaud.fr",
  description: "Vue d'ensemble de la chaleur en France : températures actuelles, anomalies, tendances ERA5 et projections GIEC CMIP6 pour les 36 principales villes françaises.",
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
  description: "Vue d'ensemble climatique de la France : températures actuelles et projections GIEC pour les 36 principales villes.",
  about: {
    "@type": "Country",
    name: "France",
    sameAs: "https://www.wikidata.org/wiki/Q142",
  },
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

  const m = new Date().getMonth()
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })

  type CityWithClimate = typeof citiesFR[0] & {
    proj2050: number | null
    normal: number | null
    anomaly: number | null
  }

  const withClimate: CityWithClimate[] = citiesFR.map((c) => {
    const entry = (climateMap[c.id] ?? null) as ClimateEntry
    const proj2050 = entry?.proj2050?.[m] ?? null
    const normal = entry?.normal?.[m] ?? null
    const anomaly = normal !== null ? Math.round((c.apparent_temp_max - normal) * 10) / 10 : null
    return { ...c, proj2050, normal, anomaly }
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

  const trendsThisMonth = citiesFR
    .map((c) => ((climateMap[c.id] ?? null) as ClimateEntry)?.trend?.[m] ?? null)
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen flex flex-col bg-[#f5f4f0]">

        <SiteHeader asLink />

        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-3 pb-4">

              <div className="col-span-2 bg-white rounded-3xl p-6">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                  France · {dataLabel}
                </p>
                <h1 className="text-2xl font-black text-neutral-900 leading-tight">
                  La chaleur en France
                </h1>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  Ressenti maximal journalier pour {citiesFR.length} villes françaises.
                </p>
              </div>

              <div className="bg-[#a8c4d4]/60 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/60 mb-3">
                  Plus frais aujourd'hui
                </p>
                <div className="text-4xl font-black text-blue-900 leading-none">{coolest.apparent_temp_max}°C</div>
                <Link
                  href={`/a/${slugify(coolest.name)}`}
                  className="text-sm font-bold text-blue-900/80 mt-1.5 block hover:underline"
                >
                  {coolest.name}
                </Link>
                <p className="text-xs text-blue-900/50">{coolest.region}</p>
              </div>
              <div className="bg-[#f4a27a]/60 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900/60 mb-3">
                  Plus chaud aujourd'hui
                </p>
                <div className="text-4xl font-black text-orange-900 leading-none">{hottest.apparent_temp_max}°C</div>
                <Link
                  href={`/a/${slugify(hottest.name)}`}
                  className="text-sm font-bold text-orange-900/80 mt-1.5 block hover:underline"
                >
                  {hottest.name}
                </Link>
                <p className="text-xs text-orange-900/50">{hottest.region}</p>
              </div>

              <div className="bg-[#fed7aa]/70 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900/60 mb-3">
                  Villes ≥ 30°C
                </p>
                <div className="text-5xl font-black text-orange-900 leading-none">{above30}</div>
                <p className="text-xs text-orange-900/50 mt-1.5">sur {citiesFR.length} villes</p>
              </div>

              <div className="bg-[#fef9c3]/80 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-yellow-900/60 mb-3">
                  Plus grande anomalie
                </p>
                {biggestAnomaly ? (
                  <>
                    <div className="text-4xl font-black text-yellow-900 leading-none">
                      {fmtDelta(biggestAnomaly.anomaly)}°C
                    </div>
                    <Link
                      href={`/a/${slugify(biggestAnomaly.name)}`}
                      className="text-sm font-bold text-yellow-900/80 mt-1.5 block hover:underline"
                    >
                      {biggestAnomaly.name}
                    </Link>
                    <p className="text-xs text-yellow-900/50">vs. normale {monthName}</p>
                  </>
                ) : (
                  <p className="text-2xl font-black text-yellow-900/30">—</p>
                )}
              </div>

              <div className="bg-purple-50 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/60 mb-3">
                  GIEC 2050 · plus exposée
                </p>
                {mostImpacted ? (
                  <>
                    <div className="text-4xl font-black text-purple-900 leading-none">
                      {fmtDelta(mostImpacted.proj2050)}°C
                    </div>
                    <Link
                      href={`/a/${slugify(mostImpacted.name)}`}
                      className="text-sm font-bold text-purple-900/80 mt-1.5 block hover:underline"
                    >
                      {mostImpacted.name}
                    </Link>
                    <p className="text-xs text-purple-900/50">{mostImpacted.region}</p>
                  </>
                ) : (
                  <p className="text-2xl font-black text-purple-900/20">—</p>
                )}
              </div>

              <div className="bg-indigo-50 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-indigo-900/60 mb-3">
                  GIEC 2050 · moins exposée
                </p>
                {leastImpacted ? (
                  <>
                    <div className="text-4xl font-black text-indigo-900 leading-none">
                      {fmtDelta(leastImpacted.proj2050)}°C
                    </div>
                    <Link
                      href={`/a/${slugify(leastImpacted.name)}`}
                      className="text-sm font-bold text-indigo-900/80 mt-1.5 block hover:underline"
                    >
                      {leastImpacted.name}
                    </Link>
                    <p className="text-xs text-indigo-900/50">{leastImpacted.region}</p>
                  </>
                ) : (
                  <p className="text-2xl font-black text-indigo-900/20">—</p>
                )}
              </div>

              {avgTrend !== null && (
                <div className="col-span-2 bg-white rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                    Tendance 30 ans · moyenne France
                  </p>
                  <p className="font-black text-2xl text-neutral-900">
                    {fmtDelta(avgTrend)}°C
                    <span className="text-sm font-normal text-neutral-400 ml-2">
                      depuis 1990 · {monthName}
                    </span>
                  </p>
                </div>
              )}

              <div className="bg-[#dbeafe] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-800/60 mb-3">
                  Ressenti moyen France
                </p>
                <div className="text-5xl font-black text-blue-900 leading-none">{avgTemp}°C</div>
                <p className="text-xs text-blue-700/60 mt-2">moy. {citiesFR.length} villes</p>
              </div>

              <div className="bg-neutral-900 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-3">
                  GIEC moy. top 6
                </p>
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">2040</span>
                    <span className="font-black text-lg text-white">{fmtDelta(avgProj2040)}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">2050</span>
                    <span className="font-black text-lg text-white">{fmtDelta(avgProj2050)}°C</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {top6.map((c) => (
                    <Link
                      key={c.id}
                      href={`/a/${slugify(c.name)}`}
                      className="block text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="col-span-2 bg-white rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-4">
                  Toutes les villes · du plus chaud au plus frais
                </p>
                <div className="space-y-1">
                  {sorted.map((city) => {
                    const entry = (climateMap[city.id] ?? null) as ClimateEntry
                    const proj2050 = entry?.proj2050?.[m] ?? null
                    return (
                      <Link
                        key={city.id}
                        href={`/a/${slugify(city.name)}`}
                        className="flex items-center justify-between py-2.5 px-3 rounded-2xl hover:bg-neutral-50 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-neutral-800 group-hover:text-neutral-900">{city.name}</span>
                          <span className="text-xs text-neutral-400 ml-2">{city.region}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-black text-sm text-neutral-700">{city.apparent_temp_max}°C</span>
                          {proj2050 !== null && (
                            <span className="text-xs text-purple-700/70 hidden sm:block">
                              2050 : {fmtDelta(proj2050)}
                            </span>
                          )}
                          <span className="text-neutral-300 group-hover:text-neutral-500 transition-colors text-sm">→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              <PageFooter className="col-span-2" />

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
