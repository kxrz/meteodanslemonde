import { notFound } from "next/navigation"
import Link from "next/link"
import citiesFRRaw from "@/data/cities-fr.json"
import citiesWorldRaw from "@/data/cities-world.json"
import metaRaw from "@/data/meta.json"
import { CityFR, CityWorld, ClimateMap } from "@/lib/types"
import { getClimateValues } from "@/lib/use-climate-data"
import { getWeather } from "@/lib/weather-codes"
import { slugify } from "@/lib/slugify"

export const revalidate = 86400

const citiesFR = citiesFRRaw as CityFR[]
const citiesWorld = citiesWorldRaw as CityWorld[]

// eslint-disable-next-line @typescript-eslint/no-require-imports
let climateMap: ClimateMap = {}
try { climateMap = require("@/data/climate.json") as ClimateMap } catch {}

// eslint-disable-next-line @typescript-eslint/no-require-imports
let narratives: Record<string, string> = {}
try { narratives = require("@/data/narratives.json") as Record<string, string> } catch {}

const TWIN_MAX_DIFF = 4
const TWIN_COUNT = 5

function getCityBySlug(slug: string): CityFR | null {
  return citiesFR.find((c) => slugify(c.name) === slug) ?? null
}

function computeTwins(city: CityFR): CityWorld[] {
  const ref = city.apparent_temp_max
  return citiesWorld
    .map((c) => ({ city: c, diff: Math.abs(c.apparent_temp_max - ref) }))
    .filter(({ diff }) => diff <= TWIN_MAX_DIFF)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, TWIN_COUNT)
    .map(({ city }) => city)
}

export async function generateStaticParams() {
  return citiesFR.map((c) => ({ slug: slugify(c.name) }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) return {}

  const month = new Date().getMonth() + 1
  const climate = getClimateValues(climateMap[city.id], month, city.apparent_temp_max)
  const weather = getWeather(city.weathercode)

  const anomalyStr = climate.anomaly !== null
    ? (climate.anomaly > 0 ? `+${climate.anomaly}°C par rapport à la normale` : `${climate.anomaly}°C par rapport à la normale`)
    : ""
  const proj2050Str = climate.proj2050 !== null && climate.proj2050 > 0
    ? ` En 2050, le GIEC projette +${climate.proj2050}°C supplémentaires.`
    : ""

  const description = `${city.name} (${city.region}) : ${city.apparent_temp_max}°C de ressenti aujourd'hui (${weather.label}). ${anomalyStr}.${proj2050Str} Données ERA5 et projections CMIP6.`

  return {
    title: `${city.name} · ${city.apparent_temp_max}°C ressenti aujourd'hui · cestchaud.fr`,
    description,
    openGraph: {
      title: `${city.name} · En vrai, c'est chaud`,
      description,
      url: `https://cestchaud.fr/a/${slug}`,
    },
    alternates: { canonical: `https://cestchaud.fr/a/${slug}` },
  }
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) notFound()

  const month = new Date().getMonth() + 1
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })
  const climate = getClimateValues(climateMap[city.id], month, city.apparent_temp_max)
  const weather = getWeather(city.weathercode)
  const twins = computeTwins(city)
  const narrative = narratives[city.id] ?? null

  const fetchedAt = (metaRaw as { fetchedAt: string }).fetchedAt
  const dataLabel = new Date(fetchedAt).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })

  const giecRows = ([
    { year: 2030, delta: climate.proj2030 },
    { year: 2040, delta: climate.proj2040 },
    { year: 2050, delta: climate.proj2050 },
  ] as { year: number; delta: number | null }[])
    .filter((r) => r.delta !== null)
    .map(({ year, delta }) => {
      const d = delta as number
      const stable = d < 0
      const displayDelta = Math.max(0, d)
      return { year, stable, displayDelta, abs: Math.round(city.apparent_temp_max + displayDelta) }
    })

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Météo et climat à ${city.name}`,
    description: `Ressenti, normales historiques et projections climatiques GIEC pour ${city.name} (${city.region}).`,
    url: `https://cestchaud.fr/a/${slug}`,
    about: {
      "@type": "Place",
      name: city.name,
      geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lon },
      containedInPlace: { "@type": "AdministrativeArea", name: city.region, containedInPlace: { "@type": "Country", name: "France" } },
    },
  }

  return (
    <div className="min-h-screen bg-[#f9f8f5]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <header className="px-5 lg:px-8 pt-5 pb-4 border-b border-black/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
              ← En vrai, c&apos;est chaud
            </Link>
            <Link href="/en/france" className="text-xs text-neutral-400 hover:text-neutral-700 underline underline-offset-2 transition-colors">
              La France en chiffres
            </Link>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            {dataLabel}
          </div>
        </div>
      </header>

      <main className="px-5 lg:px-8 py-8 max-w-5xl mx-auto">

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">
            {city.region}
          </p>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-neutral-900 leading-none">
            {city.name}
          </h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Ressenti jour-J */}
          <div className="col-span-2 lg:col-span-2 bg-[#dbeafe] rounded-3xl p-6">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/65 mb-4">
              Ressenti aujourd&apos;hui
            </p>
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-1 leading-none">
                  <span className="text-[80px] font-black text-neutral-900 leading-none tabular-nums">
                    {city.apparent_temp_max}°
                  </span>
                  <span className="text-3xl font-black text-neutral-400">C</span>
                </div>
                <p className="text-sm text-neutral-600 mt-3">
                  {weather.emoji} {weather.label} · ressenti max
                </p>
              </div>
              <div className="text-right text-sm text-neutral-600 space-y-1.5">
                <div>💧 {city.humidity}%</div>
                <div>💨 {city.wind} km/h</div>
              </div>
            </div>
          </div>

          {/* En temps normal */}
          <div className="bg-[#c8dfc4] rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/65 mb-4">
              En temps normal
            </p>
            {climate.normal !== null ? (
              <>
                <div className="text-[44px] font-black text-green-900 leading-none tabular-nums">
                  {climate.normal}°
                </div>
                <p className="text-xs text-green-900/65 mt-2">{monthName} 1991–2020</p>
              </>
            ) : (
              <p className="text-xs text-green-900/40 italic mt-2">données insuffisantes</p>
            )}
          </div>

          {/* L'écart */}
          <div className={`rounded-3xl p-5 ${
            climate.anomaly !== null && climate.anomaly > 2 ? "bg-[#f4a27a]"
            : climate.anomaly !== null && climate.anomaly < -2 ? "bg-[#a8c4d4]"
            : "bg-neutral-200"
          }`}>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/55 mb-4">
              L&apos;écart
            </p>
            {climate.anomaly !== null ? (
              <>
                <div className="text-[44px] font-black text-neutral-900 leading-none tabular-nums">
                  {climate.anomaly > 0 ? "+" : ""}{climate.anomaly}°
                </div>
                <p className="text-xs text-black/60 mt-2">
                  {climate.anomaly > 2 ? "au-dessus de la normale"
                    : climate.anomaly < -2 ? "en-dessous de la normale"
                    : "dans la normale"}
                </p>
              </>
            ) : (
              <p className="text-xs text-black/40 italic mt-2">données insuffisantes</p>
            )}
          </div>

          {/* Ce qui a changé */}
          <div className="col-span-2 lg:col-span-1 bg-white rounded-3xl p-5 border border-black/[0.06]">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-2">
              Ce qui a changé · 30 ans
            </p>
            {climate.trend !== null ? (
              <p className="text-2xl font-black text-neutral-900">
                {climate.trend > 0 ? "+" : ""}{climate.trend}°C
                <span className="text-sm font-normal text-neutral-500 ml-2">
                  depuis 1990 en {monthName}
                </span>
              </p>
            ) : (
              <p className="text-xs text-neutral-400 italic">données insuffisantes</p>
            )}
          </div>

          {/* GIEC */}
          <div className="col-span-2 lg:col-span-2 bg-[#e4dff0] rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/65 mb-1">
              Ce qui vient · GIEC
            </p>
            <p className="text-[10px] text-purple-900/55 mb-5">
              Si rien ne change · ressenti estimé un jour comme aujourd&apos;hui
            </p>
            {giecRows.length > 0 ? (
              <div className="divide-y divide-purple-900/10">
                {giecRows.map(({ year, stable, displayDelta, abs }) => (
                  <div key={year} className="flex items-center justify-between py-3">
                    <span className="text-sm font-semibold text-purple-900/60">{year}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-purple-900/45">
                        {stable ? "~+0°" : `+${displayDelta}°`}
                      </span>
                      <span className="font-black text-3xl text-purple-900 tabular-nums">{abs}°C</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-purple-900/50 italic">données insuffisantes</p>
            )}
          </div>

          {/* Narrative */}
          {narrative && (
            <div className="col-span-2 lg:col-span-3 bg-neutral-900 rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 mb-3">
                Ce que ça veut dire
              </p>
              <p className="text-base text-white/90 leading-relaxed">{narrative}</p>
            </div>
          )}

          {/* Jumelles mondiales */}
          {twins.length > 0 && (
            <div className="col-span-2 lg:col-span-3 bg-white rounded-3xl p-5 border border-black/[0.06]">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-3">
                Le même ressenti, ailleurs
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {twins.map((twin) => {
                  const tw = getWeather(twin.weathercode)
                  return (
                    <div key={twin.id} className="flex items-center gap-2 py-2 px-3 rounded-2xl bg-neutral-50">
                      <span className="text-lg leading-none">{tw.emoji}</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-neutral-800 truncate">{twin.name}</div>
                        <div className="text-xs text-neutral-500 truncate">{twin.country}</div>
                      </div>
                      <div className="font-black text-sm text-neutral-700 ml-auto shrink-0 tabular-nums">
                        {twin.apparent_temp_max}°
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
