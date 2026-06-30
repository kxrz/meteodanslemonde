import Link from "next/link"
import citiesFRRaw from "@/data/cities-fr.json"
import metaRaw from "@/data/meta.json"
import { CityFR, ClimateEntry, ClimateMap } from "@/lib/types"
import { getWeather } from "@/lib/weather-codes"
import { slugify } from "@/lib/slugify"

export const revalidate = 86400

const citiesFR = citiesFRRaw as CityFR[]

// eslint-disable-next-line @typescript-eslint/no-require-imports
let climateMap: ClimateMap = {}
try { climateMap = require("@/data/climate.json") as ClimateMap } catch {}

function avg(vals: number[]): number {
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function monthVal(entry: ClimateEntry, field: keyof ClimateEntry, month: number): number | null {
  const arr = entry[field] as (number | null)[]
  return arr[month - 1] ?? null
}

export const metadata = {
  title: "La chaleur en France · tendances et projections 2030–2050 · cestchaud.fr",
  description:
    "Comment les températures évoluent en France : anomalies du jour, tendances sur 30 ans et projections GIEC (CMIP6) pour 2030, 2040 et 2050 ville par ville.",
  openGraph: {
    title: "La chaleur en France · En vrai, c’est chaud",
    description:
      "Anomalies, tendances 30 ans et projections CMIP6 pour les grandes villes françaises. Données ERA5 et GIEC AR6.",
    url: "https://cestchaud.fr/en/france",
  },
  alternates: { canonical: "https://cestchaud.fr/en/france" },
}

export default function FrancePage() {
  const month = new Date().getMonth() + 1
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })
  const fetchedAt = (metaRaw as { fetchedAt: string }).fetchedAt
  const dataLabel = new Date(fetchedAt).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })

  // ── Aggregations ───────────────────────────────────────────
  const temps = citiesFR.map((c) => c.apparent_temp_max)
  const avgTempToday = Math.round(avg(temps))
  const hottestToday = [...citiesFR].sort((a, b) => b.apparent_temp_max - a.apparent_temp_max)[0]

  const citiesWithClimate = citiesFR.filter((c) => climateMap[c.id])

  const trends = citiesWithClimate
    .map((c) => monthVal(climateMap[c.id], "trend", month))
    .filter((v): v is number => v !== null)
  const avgTrend = trends.length ? Math.round(avg(trends) * 10) / 10 : null

  const p2040s = citiesWithClimate
    .map((c) => monthVal(climateMap[c.id], "proj2040", month))
    .filter((v): v is number => v !== null && v > 0)
  const avgP2040 = p2040s.length ? Math.round(avg(p2040s) * 10) / 10 : null

  const p2050s = citiesWithClimate
    .map((c) => monthVal(climateMap[c.id], "proj2050", month))
    .filter((v): v is number => v !== null && v > 0)
  const avgP2050 = p2050s.length ? Math.round(avg(p2050s) * 10) / 10 : null

  // Top 5 most impacted by 2050
  const mostImpacted = citiesWithClimate
    .map((c) => ({ city: c, delta: monthVal(climateMap[c.id], "proj2050", month) ?? 0 }))
    .filter(({ delta }) => delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 6)

  // Biggest anomaly today
  const anomalies = citiesWithClimate.map((c) => {
    const n = monthVal(climateMap[c.id], "normal", month)
    return { city: c, anomaly: n !== null ? Math.round(c.apparent_temp_max - n) : null }
  }).filter((x): x is { city: CityFR; anomaly: number } => x.anomaly !== null)
  anomalies.sort((a, b) => b.anomaly - a.anomaly)
  const hottestAnomaly = anomalies[0] ?? null

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "La chaleur en France — tendances et projections climatiques",
    description: "Vue d'ensemble des évolutions de température en France : anomalies, tendances ERA5 et projections GIEC CMIP6 pour 2030, 2040 et 2050.",
    url: "https://cestchaud.fr/en/france",
    about: { "@type": "Country", name: "France" },
    mentions: citiesFR.map((c) => ({
      "@type": "City",
      name: c.name,
      url: `https://cestchaud.fr/a/${slugify(c.name)}`,
    })),
  }

  return (
    <div className="min-h-screen bg-[#f9f8f5]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <header className="px-5 lg:px-8 pt-5 pb-4 border-b border-black/5">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
            ← En vrai, c&apos;est chaud
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            {dataLabel}
          </div>
        </div>
      </header>

      <main className="px-5 lg:px-8 py-8 max-w-5xl mx-auto">

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">
            Vue d&apos;ensemble
          </p>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-neutral-900 leading-none">
            La chaleur<br />en France
          </h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Ressenti moyen aujourd'hui */}
          <div className="col-span-2 bg-[#dbeafe] rounded-3xl p-6">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/65 mb-4">
              Ressenti moyen en France · aujourd&apos;hui
            </p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[80px] font-black text-neutral-900 leading-none tabular-nums">
                  {avgTempToday}°
                </div>
                <p className="text-sm text-neutral-600 mt-3">
                  moyenne sur{" "}
                  <strong className="text-neutral-800">{citiesFR.length} villes</strong>
                </p>
              </div>
              {hottestToday && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/50 mb-1">Le plus chaud</p>
                  <Link
                    href={`/a/${slugify(hottestToday.name)}`}
                    className="text-2xl font-black text-blue-900 hover:underline underline-offset-2"
                  >
                    {hottestToday.name}
                  </Link>
                  <p className="text-sm text-blue-900/70 tabular-nums">{hottestToday.apparent_temp_max}°C</p>
                </div>
              )}
            </div>
          </div>

          {/* Anomalie du jour */}
          <div className={`rounded-3xl p-5 ${
            hottestAnomaly && hottestAnomaly.anomaly > 2 ? "bg-[#f4a27a]" : "bg-neutral-200"
          }`}>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/55 mb-4">
              Plus grosse anomalie · {monthName}
            </p>
            {hottestAnomaly ? (
              <>
                <Link
                  href={`/a/${slugify(hottestAnomaly.city.name)}`}
                  className="text-sm font-semibold text-neutral-700 hover:underline underline-offset-2 block mb-2"
                >
                  {hottestAnomaly.city.name}
                </Link>
                <div className="text-[44px] font-black text-neutral-900 leading-none tabular-nums">
                  +{hottestAnomaly.anomaly}°
                </div>
                <p className="text-xs text-black/60 mt-2">au-dessus de la normale</p>
              </>
            ) : (
              <p className="text-xs text-black/40 italic mt-2">données insuffisantes</p>
            )}
          </div>

          {/* Tendance 30 ans */}
          <div className="bg-white rounded-3xl p-5 border border-black/[0.06]">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-4">
              Tendance moyenne · 30 ans
            </p>
            {avgTrend !== null ? (
              <>
                <div className="text-[44px] font-black text-neutral-900 leading-none tabular-nums">
                  +{avgTrend}°
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  depuis 1990 en {monthName}
                </p>
              </>
            ) : (
              <p className="text-xs text-neutral-400 italic mt-2">données insuffisantes</p>
            )}
          </div>

          {/* Projections GIEC moyennes */}
          <div className="col-span-2 lg:col-span-3 bg-[#e4dff0] rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/65 mb-1">
              Ce qui vient · GIEC · moyenne France
            </p>
            <p className="text-[10px] text-purple-900/55 mb-5">
              Projections CMIP6 MRI_AGCM3_2_S · scénario tendanciel · ressenti en {monthName}
            </p>
            <div className="divide-y divide-purple-900/10">
              {([
                { year: 2040, val: avgP2040 },
                { year: 2050, val: avgP2050 },
              ] as { year: number; val: number | null }[]).map(({ year, val }) => (
                <div key={year} className="flex items-center justify-between py-3">
                  <span className="text-sm font-semibold text-purple-900/60">{year}</span>
                  {val !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-purple-900/45">+{val}° en moyenne</span>
                      <span className="font-black text-3xl text-purple-900 tabular-nums">
                        +{val}°C
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-purple-900/40 italic">données insuffisantes</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Les villes les plus impactées en 2050 */}
          {mostImpacted.length > 0 && (
            <div className="col-span-2 lg:col-span-3 bg-white rounded-3xl p-5 border border-black/[0.06]">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-4">
                Villes les plus impactées en 2050 · {monthName}
              </p>
              <div className="space-y-0.5">
                {mostImpacted.map(({ city, delta }, rank) => {
                  const weather = getWeather(city.weathercode)
                  return (
                    <Link
                      key={city.id}
                      href={`/a/${slugify(city.name)}`}
                      className="flex items-center gap-4 py-2.5 px-3 rounded-2xl hover:bg-neutral-50 transition-colors"
                    >
                      <span className="text-xs font-black text-neutral-300 tabular-nums w-4">{rank + 1}</span>
                      <span className="text-lg leading-none">{weather.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-neutral-800">{city.name}</div>
                        <div className="text-xs text-neutral-500">{city.region}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-sm text-purple-700 tabular-nums">+{delta}°C</div>
                        <div className="text-xs text-neutral-400 tabular-nums">→ {Math.round(city.apparent_temp_max + delta)}°C</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Toutes les villes */}
          <div className="col-span-2 lg:col-span-3 bg-[#c8dfc4] rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/65 mb-4">
              Toutes les villes françaises
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[...citiesFR]
                .sort((a, b) => b.apparent_temp_max - a.apparent_temp_max)
                .map((city) => {
                  const weather = getWeather(city.weathercode)
                  return (
                    <Link
                      key={city.id}
                      href={`/a/${slugify(city.name)}`}
                      className="flex items-center gap-2 py-2 px-3 rounded-2xl bg-white/50 hover:bg-white transition-colors"
                    >
                      <span className="text-base leading-none">{weather.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-neutral-800 truncate">{city.name}</div>
                        <div className="text-xs text-neutral-500 truncate">{city.region}</div>
                      </div>
                      <div className="font-black text-sm text-neutral-700 shrink-0 tabular-nums">
                        {city.apparent_temp_max}°
                      </div>
                    </Link>
                  )
                })}
            </div>
          </div>

          {/* Footer */}
          <div className="col-span-2 lg:col-span-3 flex items-center justify-between text-xs text-neutral-400 px-1 pt-2">
            <span>Open-Meteo · ERA5 · CMIP6 · {dataLabel}</span>
            <span>
              © <a href="https://leswww.com" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-neutral-600 transition-colors">LesWWW</a>
              {" · "}
              <a href="https://leswww.com/mentions-legales/" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-neutral-600 transition-colors">Mentions légales</a>
            </span>
          </div>

        </div>
      </main>
    </div>
  )
}
