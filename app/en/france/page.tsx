import Link from "next/link"
import { Metadata } from "next"
import { slugify } from "@/lib/slugify"
import { getWeatherData } from "@/lib/weather-data"
import { getWeather } from "@/lib/weather-codes"
import SiteHeader from "@/components/SiteHeader"

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
  about: { "@type": "Country", name: "France", sameAs: "https://www.wikidata.org/wiki/Q142" },
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

function fmt(n: number | null | undefined, d = 1) {
  if (n == null) return "—"
  return (n > 0 ? "+" : "") + n.toFixed(d)
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
  const tempDelta = hottest.apparent_temp_max - coolest.apparent_temp_max
  const avgTemp = Math.round(citiesFR.reduce((s, c) => s + c.apparent_temp_max, 0) / citiesFR.length)
  const citiesAbove30 = citiesFR.filter(c => c.apparent_temp_max >= 30).length

  const enriched = citiesFR.map(city => {
    const e = (climateMap[city.id] ?? null) as ClimateEntry
    return {
      ...city,
      normal: e?.normal?.[m] ?? null,
      trend: e?.trend?.[m] ?? null,
      proj2040: e?.proj2040?.[m] ?? null,
      proj2050: e?.proj2050?.[m] ?? null,
      anomaly: e?.normal?.[m] != null ? city.apparent_temp_max - e!.normal![m] : null,
    }
  })

  const withTrend = enriched.filter(c => c.trend != null)
  const withProj40 = enriched.filter(c => c.proj2040 != null)
  const withProj50 = enriched.filter(c => c.proj2050 != null)
  const withAnomaly = enriched.filter(c => c.anomaly != null)

  const avgTrend = withTrend.length ? withTrend.reduce((s, c) => s + c.trend!, 0) / withTrend.length : null
  const avgProj40 = withProj40.length ? withProj40.reduce((s, c) => s + c.proj2040!, 0) / withProj40.length : null
  const avgProj50 = withProj50.length ? withProj50.reduce((s, c) => s + c.proj2050!, 0) / withProj50.length : null

  const biggestAnomaly = withAnomaly.length ? [...withAnomaly].sort((a, b) => b.anomaly! - a.anomaly!)[0] : null
  const trendMax = withTrend.length ? [...withTrend].sort((a, b) => b.trend! - a.trend!)[0] : null
  const proj50Champion = withProj50.length ? [...withProj50].sort((a, b) => b.proj2050! - a.proj2050!)[0] : null
  const proj50Least = withProj50.length ? [...withProj50].sort((a, b) => a.proj2050! - b.proj2050!)[0] : null
  const top6 = [...withProj50].sort((a, b) => b.proj2050! - a.proj2050!).slice(0, 6)

  const footer = (
    <div className="col-span-2 text-center text-xs text-neutral-500 pb-1">
      cestchaud.fr · Open-Meteo · ERA5 · CMIP6 ·{" "}
      <a href="https://leswww.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700">© LesWWW</a>
      {" · "}
      <a href="https://leswww.com/mentions-legales/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-neutral-700">Mentions légales</a>
      {" · "}
      <Link href="/contact" className="underline underline-offset-2 hover:text-neutral-700">Contact</Link>
    </div>
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="h-screen flex flex-col bg-[#f5f4f0] overflow-hidden">
        <SiteHeader asLink />

        <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-3 pb-4">

              {/* Titre */}
              <div className="col-span-2 bg-white rounded-3xl p-6">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-2">
                  Vue d'ensemble · {dataLabel}
                </p>
                <h2 className="text-2xl font-black text-neutral-900 leading-tight">La chaleur en France</h2>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  Ressenti maximal journalier pour {citiesFR.length} villes françaises. Cliquez une ville pour sa fiche complète.
                </p>
              </div>

              {/* ── FUN STATS ── */}

              {/* Extrêmes du jour */}
              <div className="col-span-2 bg-[#dbeafe] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-800 mb-3">Les extrêmes du jour</p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-4xl font-black text-blue-900 leading-none">{coolest.apparent_temp_max}°C</div>
                    <Link href={`/a/${slugify(coolest.name)}`} className="text-sm font-bold text-blue-800 hover:underline underline-offset-2 mt-1 block">{coolest.name}</Link>
                    <p className="text-xs text-blue-700">{coolest.region}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-blue-800">{tempDelta}°C</div>
                    <p className="text-[10px] uppercase tracking-widest text-blue-700 font-semibold">d'écart</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-blue-900 leading-none">{hottest.apparent_temp_max}°C</div>
                    <Link href={`/a/${slugify(hottest.name)}`} className="text-sm font-bold text-blue-800 hover:underline underline-offset-2 mt-1 block text-right">{hottest.name}</Link>
                    <p className="text-xs text-blue-700 text-right">{hottest.region}</p>
                  </div>
                </div>
              </div>

              {/* Villes > 30°C */}
              <div className="bg-[#f4a27a]/60 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900 mb-3">
                  Villes ≥ 30°C
                </p>
                <div className="text-5xl font-black text-orange-900 leading-none">{citiesAbove30}</div>
                <p className="text-sm text-orange-800 mt-2">villes sur {citiesFR.length} aujourd'hui</p>
              </div>

              {/* Plus grande anomalie */}
              <div className="bg-[#fef9c3] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-yellow-800 mb-3">
                  Anomalie max
                </p>
                {biggestAnomaly ? (
                  <>
                    <div className="text-3xl font-black text-yellow-900 leading-none">{fmt(biggestAnomaly.anomaly)}°C</div>
                    <Link href={`/a/${slugify(biggestAnomaly.name)}`} className="text-sm font-bold text-yellow-800 hover:underline underline-offset-2 mt-1.5 block">{biggestAnomaly.name}</Link>
                    <p className="text-xs text-yellow-700">vs. normale {monthName}</p>
                  </>
                ) : <p className="text-2xl font-black text-yellow-800/40">—</p>}
              </div>

              {/* Champion GIEC 2050 */}
              <div className="bg-[#7c3aed] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/80 mb-3">
                  Plus impactée · 2050
                </p>
                {proj50Champion ? (
                  <>
                    <div className="text-3xl font-black text-white leading-none">{fmt(proj50Champion.proj2050)}°C</div>
                    <Link href={`/a/${slugify(proj50Champion.name)}`} className="text-sm font-bold text-white/90 hover:text-white underline-offset-2 mt-1.5 block">{proj50Champion.name}</Link>
                    <p className="text-xs text-white/70">projection CMIP6</p>
                  </>
                ) : <p className="text-2xl font-black text-white/30">—</p>}
              </div>

              {/* Moins impactée GIEC 2050 */}
              <div className="bg-[#e0e7ff] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-indigo-800 mb-3">
                  Moins impactée · 2050
                </p>
                {proj50Least ? (
                  <>
                    <div className="text-3xl font-black text-indigo-900 leading-none">{fmt(proj50Least.proj2050)}°C</div>
                    <Link href={`/a/${slugify(proj50Least.name)}`} className="text-sm font-bold text-indigo-800 hover:underline underline-offset-2 mt-1.5 block">{proj50Least.name}</Link>
                    <p className="text-xs text-indigo-700">projection CMIP6</p>
                  </>
                ) : <p className="text-2xl font-black text-indigo-800/30">—</p>}
              </div>

              {/* Record tendance 30 ans */}
              {trendMax && (
                <div className="col-span-2 bg-white rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-2">
                    Record tendance observée · 30 ans
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black text-neutral-900">{fmt(trendMax.trend)}°C</div>
                      <p className="text-xs text-neutral-600 mt-1">depuis 1990 en {monthName}</p>
                    </div>
                    <Link href={`/a/${slugify(trendMax.name)}`} className="text-right">
                      <p className="text-base font-black text-neutral-900 hover:underline underline-offset-2">{trendMax.name}</p>
                      <p className="text-xs text-neutral-500">{trendMax.region}</p>
                    </Link>
                  </div>
                </div>
              )}

              {/* ── DONNÉES ── */}

              {/* Ressenti moyen */}
              <div className="bg-[#dbeafe] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-800 mb-3">Ressenti moyen</p>
                <div className="text-5xl font-black text-blue-900 leading-none">{avgTemp}°C</div>
                <p className="text-xs text-blue-800 mt-2">moy. {citiesFR.length} villes · aujourd'hui</p>
              </div>

              {/* Plus chaud */}
              <div className="bg-[#f4a27a]/60 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900 mb-3">Plus chaud</p>
                <div className="text-3xl font-black text-orange-900 leading-none">{hottest.apparent_temp_max}°C</div>
                <Link href={`/a/${slugify(hottest.name)}`} className="text-sm font-bold text-orange-900 hover:underline underline-offset-2 mt-1.5 block">{hottest.name}</Link>
                <p className="text-xs text-orange-800">{hottest.region}</p>
              </div>

              {/* GIEC France */}
              <div className="col-span-2 bg-[#c4b8d4] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900 mb-1">Si rien ne change…</p>
                <p className="text-[10px] text-purple-800 mb-4">Modèle CMIP6 (GIEC AR6) · moyenne France · écart vs. 2000–2020</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-purple-900 mb-0.5">2040</p>
                    <p className="font-black text-3xl text-purple-900">{fmt(avgProj40)}°C</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-900 mb-0.5">2050</p>
                    <p className="font-black text-3xl text-purple-900">{fmt(avgProj50)}°C</p>
                  </div>
                </div>
              </div>

              {/* Top 6 impactées */}
              {top6.length > 0 && (
                <div className="col-span-2 bg-neutral-900 rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/60 mb-4">
                    Villes les plus impactées · projection 2050
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {top6.map((city, i) => (
                      <Link
                        key={city.id}
                        href={`/a/${slugify(city.name)}`}
                        className="flex items-center justify-between py-2.5 px-3 rounded-2xl hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-white/40 text-xs font-mono w-4 shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-white truncate">{city.name}</div>
                            <div className="text-[10px] text-white/60 truncate">{city.region}</div>
                          </div>
                        </div>
                        <span className="font-black text-sm text-white shrink-0 ml-2">{fmt(city.proj2050)}°C</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Toutes les villes */}
              <div className="col-span-2 bg-white rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-4">
                  Toutes les villes · du plus chaud au plus frais
                </p>
                <div className="space-y-0.5">
                  {sorted.map(city => {
                    const w = getWeather(city.weathercode)
                    return (
                      <Link
                        key={city.id}
                        href={`/a/${slugify(city.name)}`}
                        className="flex items-center justify-between py-2.5 px-3 rounded-2xl hover:bg-neutral-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-base">{w.emoji}</span>
                          <span className="font-semibold text-sm text-neutral-900">{city.name}</span>
                          <span className="text-xs text-neutral-500 hidden sm:block">{city.region}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-sm text-neutral-800">{city.apparent_temp_max}°C</span>
                          <span className="text-neutral-300 group-hover:text-neutral-600 text-sm">→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Plus frais */}
              <div className="col-span-2 bg-[#a8c4d4]/60 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900 mb-3">Plus frais aujourd'hui</p>
                <div className="text-3xl font-black text-blue-900 leading-none">{coolest.apparent_temp_max}°C</div>
                <Link href={`/a/${slugify(coolest.name)}`} className="text-sm font-bold text-blue-900 hover:underline underline-offset-2 mt-1.5 block">{coolest.name}</Link>
                <p className="text-xs text-blue-800">{coolest.region}</p>
              </div>

              {footer}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
