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
import Breadcrumb from "@/components/Breadcrumb"
import ShareButton from "@/components/ShareButton"
import TempSparkline from "@/components/TempSparkline"
import { getWeatherData } from "@/lib/weather-data"
import PushOptIn from "@/components/PushOptIn"

export const revalidate = 86400

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; lat: number; lon: number; region: string
}>

const citiesWorld = require("@/data/cities-world.json") as Array<{
  id: string; name: string; lat: number; lon: number; country: string
}>

type CityFR = { id: string; name: string; lat: number; lon: number; region: string; isWorld?: false }
type CityWorld = { id: string; name: string; lat: number; lon: number; country: string; isWorld: true }
type AnyCity = CityFR | CityWorld

let narratives: Record<string, string> = {}
try { narratives = require("@/data/narratives.json") } catch {}

interface YearExtreme { max: number; max_date: string; min: number; min_date: string }
let yearExtremesMap: Record<string, YearExtreme> = {}
try { yearExtremesMap = require("@/data/year-extremes.json") } catch {}

type TwinResult = { id: string; name: string; label: string; temp: number; slug: string }

function findLiveTwins(
  cityTemp: number,
  isWorld: boolean,
  allFR: import("@/lib/types").CityFR[],
  allWorld: import("@/lib/types").CityWorld[],
): TwinResult[] {
  const pool = isWorld ? allFR : allWorld
  return pool
    .map((c) => {
      const label = isWorld ? (c as import("@/lib/types").CityFR).region : (c as import("@/lib/types").CityWorld).country
      return { id: c.id, name: c.name, label, temp: c.apparent_temp_max, slug: slugify(c.name), diff: Math.abs(c.apparent_temp_max - cityTemp) }
    })
    .filter((x) => x.diff <= 4)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 4)
}

function getCityBySlug(slug: string): AnyCity | null {
  const fr = citiesFR.find((c) => slugify(c.name) === slug)
  if (fr) return fr
  const world = citiesWorld.find((c) => slugify(c.name) === slug)
  if (world) return { ...world, isWorld: true as const }
  return null
}

export async function generateStaticParams() {
  return [
    ...citiesFR.map((c) => ({ slug: slugify(c.name) })),
    ...citiesWorld.map((c) => ({ slug: slugify(c.name) })),
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) return {}

  const climateMap = loadClimateMap()
  const climate = (climateMap[city.id] ?? null) as ClimateEntry
  const m = new Date().getMonth()
  const proj2050 = climate?.proj2050?.[m] ?? null
  const proj2050Str = proj2050 !== null ? ` GIEC 2050 : ${fmtDelta(proj2050)}°C.` : ""

  const location = city.isWorld ? city.country : city.region
  const description = `Ressenti max, tendance ERA5 sur 30 ans et projections GIEC CMIP6 2030–2050 pour ${city.name} (${location}).${proj2050Str}`

  return {
    title: `${city.name} · Chaleur & projections climatiques · cestchaud.fr`,
    description,
    alternates: { canonical: `https://www.cestchaud.fr/a/${slug}` },
    openGraph: {
      title: `${city.name} · Chaleur & projections GIEC`,
      description,
      url: `https://www.cestchaud.fr/a/${slug}`,
      siteName: "cestchaud.fr",
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${city.name} · Chaleur & projections GIEC`,
      description,
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

function buildProjectionParagraph(
  cityName: string,
  region: string,
  monthName: string,
  normal: number | null,
  trend: number | null,
  proj2030: number | null,
  proj2040: number | null,
  proj2050: number | null,
): string | null {
  if (proj2050 === null && trend === null) return null

  const parts: string[] = []

  if (trend !== null) {
    const trendWord = trend > 0 ? "hausse" : "baisse"
    const trendAbs = Math.abs(trend)
    parts.push(
      `Sur les 30 dernières années, le ressenti de ${monthName} à ${cityName} a connu une ${trendWord} de ${trendAbs.toFixed(1)}°C selon les données ERA5. Ce chiffre, mesuré et stable, n'est pas une anomalie ponctuelle : c'est la signature d'une mutation durable du climat local.`
    )
  }

  if (proj2030 !== null || proj2040 !== null || proj2050 !== null) {
    const projParts: string[] = []
    if (proj2030 !== null) projParts.push(`${fmtDelta(proj2030)}°C en 2030`)
    if (proj2040 !== null) projParts.push(`${fmtDelta(proj2040)}°C en 2040`)
    if (proj2050 !== null) projParts.push(`${fmtDelta(proj2050)}°C en 2050`)

    const baseDesc = normal !== null ? ` par rapport à la normale actuelle de ${fmt(normal)}°C` : ""

    const impact = proj2050 !== null
      ? proj2050 >= 3
        ? `Un écart de cette ampleur transforme concrètement les conditions de vie estivales, le stress hydrique, et les besoins en climatisation.`
        : proj2050 >= 1.5
        ? `Un tel décalage est déjà perceptible sur l'agriculture locale, la santé des personnes vulnérables et la gestion de l'eau.`
        : `Même modeste en apparence, ce réchauffement décale les saisons et fragilise les écosystèmes locaux sur la durée.`
      : ""

    parts.push(
      `Le scénario intermédiaire CMIP6 (SSP2-4.5) projette pour ${cityName} : ${projParts.join(", ")}${baseDesc}. ${impact}`
    )
  }

  return parts.join(" ")
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) notFound()

  const [climateMap, { citiesFR: allFR, citiesWorld: allWorld }, weather] = await Promise.all([
    Promise.resolve(loadClimateMap()),
    getWeatherData(),
    fetchCityWeather(city.lat, city.lon),
  ])
  const climate = (climateMap[city.id] ?? null) as ClimateEntry
  const narrative = narratives[city.id] ?? null
  const yearExtremes = yearExtremesMap[city.id] ?? null
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
  const pageUrl = `https://www.cestchaud.fr/a/${slug}`

  const cityLocation = city.isWorld ? city.country : city.region
  const cityTodayTemp = weather?.apparent_temp_max ?? null
  const twins = cityTodayTemp !== null ? findLiveTwins(cityTodayTemp, !!city.isWorld, allFR, allWorld) : []
  const projectionParagraph = city.isWorld ? null : buildProjectionParagraph(
    city.name, city.region, monthName,
    normal, trend, proj2030, proj2040, proj2050
  )

  let shareText: string
  if (weather && anomaly !== null) {
    const sign = anomaly > 0 ? "+" : ""
    shareText = `A ${city.name} aujourd'hui, le ressenti max atteint ${weather.apparent_temp_max}°C, soit ${sign}${anomaly}°C par rapport a la normale de ${monthName}.`
    if (proj2050 !== null) {
      shareText += ` Et d'ici 2050, le GIEC projette encore ${fmtDelta(proj2050)}°C de plus.`
    }
  } else if (proj2050 !== null) {
    shareText = `A ${city.name}, le GIEC (CMIP6) projette ${fmtDelta(proj2050)}°C d'ici 2050.`
  } else {
    shareText = `Donnees climatiques de ${city.name} sur`
  }

  const shareTextEncoded = encodeURIComponent(shareText + " " + pageUrl)
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareTextEncoded}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${shareTextEncoded}`,
    email: `mailto:?subject=${encodeURIComponent(`${city.name} · donnees climatiques`)}&body=${shareTextEncoded}`,
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${city.name} · Chaleur & projections climatiques`,
    url: pageUrl,
    description: `Données climatiques et projections GIEC pour ${city.name}, ${cityLocation}.`,
    about: {
      "@type": "Place",
      name: city.name,
      geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lon },
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: cityLocation,
        containedInPlace: { "@type": "Country", name: city.isWorld ? city.country : "France" },
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
        <Breadcrumb crumbs={
          city.isWorld
            ? [{ label: "Monde" }, { label: city.name }]
            : [{ label: "Régions", href: "/r" }, { label: city.region, href: `/r/${slugify(city.region)}` }, { label: city.name }]
        } />

        <div className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0">

          {/* Left: map (40%) */}
          <div className="h-[50vw] max-h-[360px] lg:max-h-none lg:h-auto lg:w-[40%] shrink-0 relative p-3 lg:p-4">
            <div className="w-full h-full rounded-3xl overflow-hidden">
              <CityMapWrapper lat={city.lat} lon={city.lon} name={city.name} />
            </div>
            <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 leading-none mb-0.5">
                {cityLocation}
              </p>
              <h1 className="text-base font-black text-neutral-900 leading-tight">{city.name}</h1>
            </div>
            <div className="absolute bottom-6 left-6 z-[1000]">
              <p className="font-mono text-[10px] text-neutral-500 bg-white/80 backdrop-blur-sm rounded px-2 py-1">
                {city.lat.toFixed(2)}N · {Math.abs(city.lon).toFixed(2)}{city.lon >= 0 ? "E" : "O"}
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

              {/* Temp + Share — two side-by-side blocks */}
              {weather && (
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  {/* Temp info */}
                  <div className="bg-[#dbeafe] rounded-3xl p-6">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-800/60 mb-3">
                      Ressenti max aujourd&apos;hui
                    </p>
                    <div className="flex items-baseline gap-1.5 leading-none">
                      <span className="text-6xl font-black text-blue-900">{weather.apparent_temp_max}&deg;</span>
                      <span className="text-2xl font-black text-blue-400">C</span>
                    </div>
                    {anomaly !== null && (
                      <p className="text-sm text-blue-800/60 mt-2">
                        {fmtDelta(anomaly)}&deg;C vs. normale {monthName}
                      </p>
                    )}
                  </div>
                  {/* Share */}
                  <div className="bg-white rounded-3xl p-6">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                      Partager
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-black text-white rounded-xl py-2 px-2 text-xs font-semibold hover:bg-neutral-800 transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
                        X
                      </a>
                      <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-[#0A66C2] text-white rounded-xl py-2 px-2 text-xs font-semibold hover:bg-[#0958a8] transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        LinkedIn
                      </a>
                      <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-[#25D366] text-white rounded-xl py-2 px-2 text-xs font-semibold hover:bg-[#1fbb56] transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                        WhatsApp
                      </a>
                      <a href={shareLinks.email}
                        className="flex items-center justify-center gap-1.5 bg-neutral-100 text-neutral-700 rounded-xl py-2 px-2 text-xs font-semibold hover:bg-neutral-200 transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        Email
                      </a>
                      <ShareButton
                        text={shareText}
                        url={pageUrl}
                        label="Copier le texte"
                        variant="copy-grid"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Normale + Tendance */}
              <div className="grid grid-cols-2 gap-3 col-span-2">
                <div className="bg-[#b8d4b0] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/50 mb-3">
                    Normalement en {monthName}
                  </p>
                  {normal !== null ? (
                    <>
                      <div className="text-4xl font-black text-green-900 leading-none">{fmt(normal)}&deg;C</div>
                      <p className="text-xs text-green-900/50 mt-2">moy. 1991–2020</p>
                    </>
                  ) : (
                    <p className="text-2xl font-black text-green-900/30">N/A</p>
                  )}
                </div>
                <div className="bg-white rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                    Tendance 30 ans
                  </p>
                  {trend !== null ? (
                    <>
                      <div className="text-4xl font-black text-neutral-900 leading-none">
                        {fmtDelta(trend)}&deg;C
                      </div>
                      <p className="text-xs text-neutral-400 mt-2">depuis 1990 · {monthName}</p>
                    </>
                  ) : (
                    <p className="text-2xl font-black text-neutral-300">N/A</p>
                  )}
                </div>
              </div>

              {/* Sparkline 30 jours */}
              <div className="col-span-2 bg-white rounded-3xl p-5">
                <TempSparkline lat={city.lat} lon={city.lon} normal={normal} />
              </div>

              {/* Second paragraph — projection narrative */}
              {projectionParagraph && (
                <article className="col-span-2 bg-[#1a1a2e] rounded-3xl p-6">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-3">
                    Ce que disent les modeles
                  </p>
                  <p className="text-sm text-white/75 leading-relaxed">{projectionParagraph}</p>
                </article>
              )}

              {/* Extrêmes de l'année */}
              {yearExtremes && (
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div className="bg-[#fee2e2] rounded-3xl p-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-red-900/50 mb-3">
                      Record chaud {new Date().getFullYear()}
                    </p>
                    <div className="text-4xl font-black text-red-900 leading-none">{yearExtremes.max}&deg;C</div>
                    <p className="text-xs text-red-900/50 mt-2">
                      {new Date(yearExtremes.max_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <div className="bg-[#dbeafe] rounded-3xl p-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/50 mb-3">
                      Record froid {new Date().getFullYear()}
                    </p>
                    <div className="text-4xl font-black text-blue-900 leading-none">{yearExtremes.min}&deg;C</div>
                    <p className="text-xs text-blue-900/50 mt-2">
                      {new Date(yearExtremes.min_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                </div>
              )}

              {/* Projections GIEC + Push opt-in côte à côte (villes FR) / plein largeur (villes monde) */}
              {city.isWorld ? (
                <div className="col-span-2 bg-[#c4b8d4] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/50 mb-1">
                    Si rien ne change...
                  </p>
                  <p className="text-[10px] text-purple-900/60 mb-4">
                    Modele CMIP6 (GIEC AR6) · ecart vs. 2000–2020
                  </p>
                  <div className="space-y-2.5">
                    {([
                      { year: 2030, val: proj2030 },
                      { year: 2040, val: proj2040 },
                      { year: 2050, val: proj2050 },
                    ] as { year: number; val: number | null }[]).map(({ year, val }) => (
                      <div key={year} className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-purple-900/60">{year}</span>
                        <span className="font-black text-2xl text-purple-900">{fmtDelta(val)}&deg;C</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div className="bg-[#c4b8d4] rounded-3xl p-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/50 mb-1">
                      Si rien ne change...
                    </p>
                    <p className="text-[10px] text-purple-900/60 mb-4">
                      CMIP6 (GIEC AR6) · écart vs. 2000–2020
                    </p>
                    <div className="space-y-2.5">
                      {([
                        { year: 2030, val: proj2030 },
                        { year: 2040, val: proj2040 },
                        { year: 2050, val: proj2050 },
                      ] as { year: number; val: number | null }[]).map(({ year, val }) => (
                        <div key={year} className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-purple-900/60">{year}</span>
                          <span className="font-black text-2xl text-purple-900">{fmtDelta(val)}&deg;C</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-neutral-900 rounded-3xl p-5 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-2">Notifications</p>
                      <p className="text-sm font-black text-white leading-snug mb-2">
                        Le ressenti de {city.name} chaque matin
                      </p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Ressenti max, anomalie vs normale, jumeau climatique du jour.
                      </p>
                    </div>
                    <div className="mt-4">
                      <PushOptIn cityId={city.id} cityName={city.name} />
                    </div>
                  </div>
                </div>
              )}

              {/* Jumeaux climatiques */}
              {twins.length > 0 && (
                <div className="col-span-2 bg-white rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-4">
                    {city.isWorld ? "Villes françaises similaires aujourd'hui" : "Jumeaux climatiques aujourd'hui"}
                  </p>
                  <div className="flex flex-col gap-2">
                    {twins.map((twin) => (
                      <Link
                        key={twin.id}
                        href={`/a/${twin.slug}`}
                        className="flex items-center justify-between rounded-2xl bg-[#f5f4f0] hover:bg-neutral-100 transition-colors px-4 py-3 group"
                      >
                        <div>
                          <div className="font-bold text-sm text-neutral-900 group-hover:underline">{twin.name}</div>
                          <div className="text-[11px] text-neutral-400">{twin.label}</div>
                        </div>
                        <div className="font-black text-lg text-neutral-700">{twin.temp}&deg;C</div>
                      </Link>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-3">Ressenti max du jour · ±4°C</p>
                </div>
              )}

              {/* Lien France */}
              <Link
                href="/en/france"
                className="col-span-2 flex items-center justify-between bg-neutral-100 hover:bg-neutral-200 transition-colors rounded-3xl px-6 py-5 group"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">
                    Vue d&apos;ensemble
                  </p>
                  <p className="text-base font-black text-neutral-900">La France en chiffres</p>
                </div>
                <span className="text-neutral-400 group-hover:text-neutral-700 text-2xl transition-colors">&rarr;</span>
              </Link>

              <PageFooter className="col-span-2" />

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
