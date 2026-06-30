import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { slugify } from "@/lib/slugify"

export const revalidate = 86400

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; lat: number; lon: number; region: string
}>

let climateMap: Record<string, unknown> = {}
try { climateMap = require("@/data/climate.json") } catch {}

let narratives: Record<string, string> = {}
try { narratives = require("@/data/narratives.json") } catch {}

function getCityBySlug(slug: string) {
  return citiesFR.find((c) => slugify(c.name) === slug) ?? null
}

export async function generateStaticParams() {
  return citiesFR.map((c) => ({ slug: slugify(c.name) }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) return {}
  return {
    title: `${city.name} · Chaleur & projections climatiques · cestchaud.fr`,
    description: `Températures actuelles, historique 30 ans et projections GIEC 2030–2050 pour ${city.name} (${city.region}). Données ERA5 et CMIP6.`,
    alternates: { canonical: `https://cestchaud.fr/a/${slug}` },
    openGraph: {
      title: `${city.name} · Climat & projections`,
      description: `Ressenti, tendance et projections CMIP6 pour ${city.name}.`,
      url: `https://cestchaud.fr/a/${slug}`,
      siteName: "cestchaud.fr",
      locale: "fr_FR",
      type: "website",
    },
  }
}

type ClimateEntry = {
  normal: number[]
  trend: number[]
  proj2030: (number | null)[]
  proj2040: (number | null)[]
  proj2050: (number | null)[]
} | null

function getMonthIndex() {
  return new Date().getMonth()
}

function fmt(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return "—"
  return n.toFixed(decimals)
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) notFound()

  const climate = (climateMap[city.id] ?? null) as ClimateEntry
  const narrative = narratives[city.id] ?? null
  const m = getMonthIndex()

  const normal = climate?.normal?.[m] ?? null
  const trend = climate?.trend?.[m] ?? null
  const proj2030 = climate?.proj2030?.[m] ?? null
  const proj2040 = climate?.proj2040?.[m] ?? null
  const proj2050 = climate?.proj2050?.[m] ?? null

  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${city.name} · Chaleur & projections climatiques`,
    url: `https://cestchaud.fr/a/${slug}`,
    description: `Données climatiques et projections GIEC pour ${city.name}, ${city.region}.`,
    about: {
      "@type": "Place",
      name: city.name,
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.lat,
        longitude: city.lon,
      },
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: city.region,
        containedInPlace: { "@type": "Country", name: "France" },
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="h-screen flex flex-col bg-[#f5f4f0] overflow-hidden">

        {/* Header — always fixed */}
        <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-black/5 bg-[#f5f4f0] z-10">
          <Link
            href="/"
            className="font-black text-base tracking-tight text-neutral-900 hover:opacity-70 transition-opacity"
          >
            ← en vrai, c'est chaud
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/en/france"
              className="hidden sm:block text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              La France en chiffres →
            </Link>
            <span className="text-xs text-neutral-400 hidden md:block">{today}</span>
          </div>
        </header>

        {/* Main — map left, bento right */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

          {/* Left: SVG placeholder (40%) */}
          <div className="h-[35vw] max-h-64 lg:h-auto lg:w-[40%] shrink-0 relative overflow-hidden bg-neutral-100 border-b lg:border-b-0 lg:border-r border-black/[0.06]">
            <div className="w-full h-full relative">
              {/* SVG grid */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-sm" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="black" strokeWidth="0.5" opacity="0.12" />
                  </pattern>
                  <pattern id="grid-lg" width="128" height="96" patternUnits="userSpaceOnUse">
                    <path d="M 128 0 L 0 0 0 96" fill="none" stroke="black" strokeWidth="1" opacity="0.08" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-sm)" />
                <rect width="100%" height="100%" fill="url(#grid-lg)" />
              </svg>

              {/* City name faint background */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
                <span
                  className="font-black text-neutral-900 whitespace-nowrap"
                  style={{ fontSize: "clamp(48px, 10vw, 120px)", opacity: 0.07, letterSpacing: "-0.03em" }}
                >
                  {city.name}
                </span>
              </div>

              {/* Top-left: region + h1 */}
              <div className="absolute top-5 left-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-1">
                  {city.region}
                </p>
                <h1 className="text-2xl font-black text-neutral-900 leading-tight">{city.name}</h1>
              </div>

              {/* Bottom-left: coordinates */}
              <div className="absolute bottom-5 left-5">
                <p className="font-mono text-[10px] text-neutral-400">
                  {city.lat.toFixed(2)}°N · {Math.abs(city.lon).toFixed(2)}°{city.lon >= 0 ? "E" : "O"}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Carte bientôt disponible
                </p>
              </div>
            </div>
          </div>

          {/* Right: bento (60%) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4 lg:w-[60%]">
            <div className="grid grid-cols-2 gap-3 pb-4">

              {/* Narrative — TOP (rédactionnel en premier) */}
              {narrative && (
                <article className="col-span-2 bg-neutral-900 rounded-3xl p-6">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-3">
                    En quelques mots
                  </p>
                  <p className="text-sm text-white/80 leading-relaxed">{narrative}</p>
                </article>
              )}

              {/* Normale */}
              <div className="bg-[#b8d4b0] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/50 mb-3">
                  Normalement en {monthName}
                </p>
                {normal !== null ? (
                  <>
                    <div className="text-4xl font-black text-green-900 leading-none">{fmt(normal)}°C</div>
                    <p className="text-xs text-green-900/50 mt-2">moy. 1991–2020</p>
                  </>
                ) : (
                  <p className="text-2xl font-black text-green-900/30">—</p>
                )}
              </div>

              {/* Tendance 30 ans */}
              <div className="bg-white rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                  Tendance 30 ans
                </p>
                {trend !== null ? (
                  <>
                    <div className="text-4xl font-black text-neutral-900 leading-none">
                      {trend > 0 ? "+" : ""}{fmt(trend)}°C
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">depuis 1990 · {monthName}</p>
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
                  Modèle CMIP6 (GIEC AR6) · écart vs. 2000–2020
                </p>
                <div className="space-y-2.5">
                  {([
                    { year: 2030, val: proj2030 },
                    { year: 2040, val: proj2040 },
                    { year: 2050, val: proj2050 },
                  ] as { year: number; val: number | null }[]).map(({ year, val }) => (
                    <div key={year} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-purple-900/60">{year}</span>
                      <span className="font-black text-2xl text-purple-900">
                        {val !== null ? `${val >= 0 ? "+" : ""}${fmt(val)}°C` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lien retour France */}
              <Link
                href="/en/france"
                className="col-span-2 flex items-center justify-between bg-white hover:bg-neutral-50 transition-colors rounded-3xl px-6 py-5 group"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">
                    Vue d'ensemble
                  </p>
                  <p className="text-base font-black text-neutral-900">La France en chiffres · données &amp; projections</p>
                </div>
                <span className="text-neutral-300 group-hover:text-neutral-600 text-2xl transition-colors">→</span>
              </Link>

              {/* Footer */}
              <div className="col-span-2 text-center text-xs text-neutral-400 pb-1">
                cestchaud.fr · Open-Meteo · ERA5 · CMIP6 ·{" "}
                <a
                  href="https://leswww.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-neutral-600"
                >
                  © LesWWW
                </a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
