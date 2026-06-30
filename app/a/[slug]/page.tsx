import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { slugify } from "@/lib/slugify"
import { loadClimateMap } from "@/lib/climate"
import { fmt, fmtDelta } from "@/lib/format"
import type { ClimateEntry } from "@/lib/climate"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import CityMapWrapper from "@/components/CityMapWrapper"

export const revalidate = 86400

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; lat: number; lon: number; region: string
}>

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

async function fetchCityWeather(lat: number, lon: number) {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&daily=apparent_temperature_max,weathercode` +
      `&forecast_days=1`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    return {
      apparent_temp_max: Math.round(data.daily.apparent_temperature_max[0]) as number,
      weathercode: data.daily.weathercode[0] as number,
    }
  } catch {
    return null
  }
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) notFound()

  const climateMap = loadClimateMap()
  const climate = (climateMap[city.id] ?? null) as ClimateEntry
  const narrative = narratives[city.id] ?? null
  const weather = await fetchCityWeather(city.lat, city.lon)
  const m = new Date().getMonth()

  const normal = climate?.normal?.[m] ?? null
  const trend = climate?.trend?.[m] ?? null
  const proj2030 = climate?.proj2030?.[m] ?? null
  const proj2040 = climate?.proj2040?.[m] ?? null
  const proj2050 = climate?.proj2050?.[m] ?? null

  const anomaly =
    weather && normal !== null
      ? Math.round((weather.apparent_temp_max - normal) * 10) / 10
      : null

  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })

  const pageUrl = `https://cestchaud.fr/a/${slug}`
  const shareText = proj2050 !== null
    ? `À ${city.name}, le GIEC (CMIP6) projette ${fmtDelta(proj2050)}°C d'ici 2050. `
    : `Découvrez les données climatiques de ${city.name} sur cestchaud.fr`
  const shareTextEncoded = encodeURIComponent(shareText + pageUrl)
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareTextEncoded}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${shareTextEncoded}`,
    email: `mailto:?subject=${encodeURIComponent(`${city.name} · données climatiques`)}&body=${shareTextEncoded}`,
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${city.name} · Chaleur & projections climatiques`,
    url: pageUrl,
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

      <div className="flex flex-col bg-[#f5f4f0] lg:h-screen lg:overflow-hidden">

        <SiteHeader asLink />

        {/* Main — map left, bento right */}
        <div className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0">

          {/* Left: Leaflet map (40%) full height */}
          <div className="h-[50vw] max-h-[360px] lg:max-h-none lg:h-auto lg:w-[40%] shrink-0 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-black/[0.06]">
            <CityMapWrapper lat={city.lat} lon={city.lon} name={city.name} />

            {/* Overlay: city name + region */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 leading-none mb-0.5">
                {city.region}
              </p>
              <h1 className="text-base font-black text-neutral-900 leading-tight">{city.name}</h1>
            </div>

            {/* Overlay: coordinates */}
            <div className="absolute bottom-3 left-3 z-[1000]">
              <p className="font-mono text-[10px] text-neutral-500 bg-white/80 backdrop-blur-sm rounded px-2 py-1">
                {city.lat.toFixed(2)}°N · {Math.abs(city.lon).toFixed(2)}°{city.lon >= 0 ? "E" : "O"}
              </p>
            </div>
          </div>

          {/* Right: bento (60%) */}
          <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto p-3 lg:p-4 lg:w-[60%]">
            <div className="grid grid-cols-2 gap-3 pb-4">

              {/* Narrative */}
              {narrative && (
                <article className="col-span-2 bg-neutral-900 rounded-3xl p-6">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-3">
                    En quelques mots
                  </p>
                  <p className="text-sm text-white/80 leading-relaxed">{narrative}</p>
                </article>
              )}

              {/* Température max + Normale + Tendance — grouped to guarantee stacking */}
              <div className="col-span-2 space-y-3">
                {weather && (
                  <div className="bg-[#dbeafe] rounded-3xl p-6">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-800/60 mb-3">
                      Ressenti max aujourd'hui
                    </p>
                    <div className="flex items-baseline gap-1.5 leading-none">
                      <span className="text-6xl font-black text-blue-900">{weather.apparent_temp_max}°</span>
                      <span className="text-2xl font-black text-blue-400">C</span>
                    </div>
                    {anomaly !== null && (
                      <p className="text-sm text-blue-800/60 mt-2">
                        {fmtDelta(anomaly)}°C vs. normale {monthName}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
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
                          {fmtDelta(trend)}°C
                        </div>
                        <p className="text-xs text-neutral-400 mt-2">depuis 1990 · {monthName}</p>
                      </>
                    ) : (
                      <p className="text-2xl font-black text-neutral-300">—</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Projections GIEC */}
              <div className="col-span-2 bg-[#c4b8d4] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/50 mb-1">
                  Si rien ne change…
                </p>
                <p className="text-[10px] text-purple-900/60 mb-4">
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
                        {fmtDelta(val)}°C
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share */}
              <div className="col-span-2 bg-white rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-4">
                  Partager
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <a
                    href={shareLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-black text-white rounded-2xl py-3 px-3 text-sm font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
                    X
                  </a>
                  <a
                    href={shareLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#0A66C2] text-white rounded-2xl py-3 px-3 text-sm font-semibold hover:bg-[#0958a8] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    LinkedIn
                  </a>
                  <a
                    href={shareLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-2xl py-3 px-3 text-sm font-semibold hover:bg-[#1fbb56] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                    WhatsApp
                  </a>
                  <a
                    href={shareLinks.email}
                    className="flex items-center justify-center gap-2 bg-neutral-100 text-neutral-700 rounded-2xl py-3 px-3 text-sm font-semibold hover:bg-neutral-200 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    Email
                  </a>
                </div>
              </div>

              {/* Lien France */}
              <Link
                href="/en/france"
                className="col-span-2 flex items-center justify-between bg-neutral-100 hover:bg-neutral-200 transition-colors rounded-3xl px-6 py-5 group"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">
                    Vue d'ensemble
                  </p>
                  <p className="text-base font-black text-neutral-900">La France en chiffres</p>
                </div>
                <span className="text-neutral-400 group-hover:text-neutral-700 text-2xl transition-colors">→</span>
              </Link>

              <PageFooter className="col-span-2" />

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
