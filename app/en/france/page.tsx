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
  title: "La chaleur en France - cestchaud.fr",
  description: "Vue d'ensemble de la chaleur en France : ressenti max, anomalies, tendances ERA5 sur 30 ans et projections GIEC CMIP6 pour les 36 principales villes françaises.",
  alternates: { canonical: "https://www.cestchaud.fr/en/france" },
  openGraph: {
    title: "La chaleur en France - cestchaud.fr",
    description: "Ressenti max, anomalies et projections GIEC CMIP6 2030-2050 pour 36 villes francaises.",
    url: "https://www.cestchaud.fr/en/france",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "https://www.cestchaud.fr/og/france.png", width: 1200, height: 630, alt: "La chaleur en France - cestchaud.fr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "La chaleur en France - cestchaud.fr",
    description: "Ressenti max, anomalies et projections GIEC CMIP6 2030-2050 pour 36 villes francaises.",
    images: ["https://www.cestchaud.fr/og/france.png"],
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "La chaleur en France",
  url: "https://www.cestchaud.fr/en/france",
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

  function buildFranceNarrative() {
    const parts: string[] = []

    // Paragraph 1 - today's snapshot
    {
      const tempDesc = avgTemp >= 35 ? "une vague de chaleur intense" : avgTemp >= 30 ? "une chaleur estivale prononcée" : avgTemp >= 25 ? "des températures estivales" : "des températures modérées"
      const spread = above30 > 0
        ? ` On compte ${above30} ville${above30 > 1 ? "s" : ""} au-dessus de 30°C, de ${hottest.name} (${hottest.region}) à ${coolest.name} (${coolest.region}) où le thermomètre s’arrête à ${coolest.apparent_temp_max}°C.`
        : ` De ${hottest.name} (${hottest.region}) à ${coolest.name} (${coolest.region}) où le ressenti plafonne à ${coolest.apparent_temp_max}°C, l’amplitude reste sensible.`
      parts.push(
        `En ce mois de ${monthName}, la France traverse ${tempDesc} avec un ressenti moyen de ${avgTemp}°C sur l’ensemble du territoire.${spread}`
      )
    }

    // Paragraph 2 - anomaly vs ERA5 normal
    if (biggestAnomaly) {
      const sign = biggestAnomaly.anomaly! > 0 ? "au-dessus" : "en dessous"
      const absAnomaly = Math.abs(biggestAnomaly.anomaly!)
      const trendStr = avgTrend !== null
        ? ` À l’échelle nationale, les données ERA5 montrent une hausse moyenne de ${fmtDelta(avgTrend)}°C depuis 1990 pour ce mois, une trajectoire qui s’accélère.`
        : ""
      parts.push(
        `C’est à ${biggestAnomaly.name} que l’écart par rapport aux normales saisonnières est le plus marqué : ${absAnomaly}°C ${sign} de la référence ERA5. Des anomalies de cette amplitude ne sont plus des exceptions. Elles témoignent d’un glissement durable des repères climatiques.${trendStr}`
      )
    } else if (avgTrend !== null) {
      parts.push(
        `Les données ERA5 révèlent une tendance de ${fmtDelta(avgTrend)}°C sur 30 ans pour ce mois à l’échelle nationale. Ce chiffre, stable et mesuré sur des décennies, illustre une mutation profonde du climat français.`
      )
    }

    // Paragraph 3 - GIEC projections
    if (mostImpacted && leastImpacted) {
      parts.push(
        `Les projections GIEC CMIP6 dessinent des trajectoires très contrastées selon les territoires. ${mostImpacted.name} (${mostImpacted.region}) est la ville la plus exposée au scénario 2050, avec une hausse projetée de ${fmtDelta(mostImpacted.proj2050!)}°C. ${leastImpacted.name} (${leastImpacted.region}) figure parmi les moins impactées, à ${fmtDelta(leastImpacted.proj2050!)}°C. Ces écarts rappellent que le réchauffement ne sera pas uniforme : le Sud et les plaines continentales seront frappés plus tôt et plus fort que les façades atlantiques ou alpines.`
      )
    }

    // Paragraph 4 - top 6 projection summary
    if (avgProj2040 !== null || avgProj2050 !== null) {
      const proj40Str = avgProj2040 !== null ? `${fmtDelta(Math.round(avgProj2040 * 10) / 10)}°C en 2040` : null
      const proj50Str = avgProj2050 !== null ? `${fmtDelta(Math.round(avgProj2050 * 10) / 10)}°C en 2050` : null
      const projStr = [proj40Str, proj50Str].filter(Boolean).join(", ")
      const top6Names = top6.map(c => c.name).slice(0, 3).join(", ")
      parts.push(
        `Pour les six villes les plus chaudes aujourd’hui, dont ${top6Names}, le scénario médian CMIP6 anticipe une augmentation de ${projStr} par rapport aux normales actuelles. Ces villes concentrent déjà les ressentis les plus élevés du pays. Leur trajectoire climatique exige une adaptation urgente des espaces urbains, de la végétalisation aux plans de gestion des canicules.`
      )
    }

    return parts
  }

  const narrativeParagraphs = buildFranceNarrative()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-[#f5f4f0]">

        <SiteHeader asLink />

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

          {/* Left panel - 40% */}
          <div className="lg:w-[40%] shrink-0 p-5 lg:p-8 flex flex-col justify-between border-b lg:border-b-0 border-black/[0.06]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                France - {dataLabel}
              </p>
              <h1 className="text-3xl font-black text-neutral-900 leading-tight">
                La chaleur en France
              </h1>
              <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
                Ressenti maximal journalier pour {citiesFR.length} villes françaises. Anomalies, tendances ERA5 et projections GIEC CMIP6.
              </p>
              <div className="mt-6 space-y-3">
                <div className="bg-[#dbeafe] rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-800/60 mb-1">Ressenti moyen</p>
                  <div className="text-3xl font-black text-blue-900">{avgTemp}°C</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#fed7aa]/70 rounded-2xl p-3">
                    <p className="text-[9px] uppercase tracking-[0.1em] font-semibold text-orange-900/50 mb-1">≥ 30°C</p>
                    <div className="text-xl font-black text-orange-900">{above30}</div>
                    <p className="text-[10px] text-orange-900/50">villes</p>
                  </div>
                  {biggestAnomaly ? (
                    <div className="bg-[#fef9c3]/80 rounded-2xl p-3">
                      <p className="text-[9px] uppercase tracking-[0.1em] font-semibold text-yellow-900/50 mb-1">Anomalie max</p>
                      <div className="text-xl font-black text-yellow-900">{fmtDelta(biggestAnomaly.anomaly)}°C</div>
                      <Link href={`/a/${slugify(biggestAnomaly.name)}`} className="text-[10px] font-bold text-yellow-900/70 hover:underline block truncate">{biggestAnomaly.name}</Link>
                    </div>
                  ) : (
                    <div className="bg-[#fef9c3]/80 rounded-2xl p-3">
                      <p className="text-[9px] uppercase tracking-[0.1em] font-semibold text-yellow-900/50 mb-1">Anomalie max</p>
                      <div className="text-xl font-black text-yellow-900/30">-</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <PageFooter />
          </div>

          {/* Right panel - 60% scrollable */}
          <div className="flex-1 lg:overflow-y-auto p-3 lg:p-4">
            <div className="grid grid-cols-2 gap-3 pb-4">

              {/* GIEC 2050 plus exposée */}
              <div className="bg-purple-50 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/60 mb-3">
                  GIEC 2050 - plus exposée
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
                  <p className="text-2xl font-black text-purple-900/20">-</p>
                )}
              </div>

              {/* GIEC 2050 moins exposée */}
              <div className="bg-indigo-50 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-indigo-900/60 mb-3">
                  GIEC 2050 - moins exposée
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
                  <p className="text-2xl font-black text-indigo-900/20">-</p>
                )}
              </div>

              {/* Tendance 30 ans */}
              {avgTrend !== null && (
                <div className="col-span-2 bg-white rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                    Tendance 30 ans - moyenne France
                  </p>
                  <p className="font-black text-2xl text-neutral-900">
                    {fmtDelta(avgTrend)}°C
                    <span className="text-sm font-normal text-neutral-400 ml-2">
                      depuis 1990 - {monthName}
                    </span>
                  </p>
                </div>
              )}

              {/* Editorial narrative */}
              {narrativeParagraphs.length > 0 && (
                <div className="col-span-2 bg-neutral-950 rounded-3xl p-6">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/50 mb-5">
                    Analyse - {monthName} {new Date().getFullYear()}
                  </p>
                  <div className="space-y-4">
                    {narrativeParagraphs.map((para, i) => (
                      <p key={i} className={`leading-relaxed ${i === 0 ? "text-base font-semibold text-white" : "text-sm text-white/80"}`}>
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* GIEC moy. top 6 */}
              <div className="col-span-2 bg-[#c4b8d4] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/60 mb-4">
                  GIEC - moyenne des 6 villes les plus chaudes
                </p>
                <div className="flex gap-8 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-purple-900/50 mb-1">2040</p>
                    <p className="font-black text-3xl text-purple-900">{fmtDelta(avgProj2040)}°C</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-900/50 mb-1">2050</p>
                    <p className="font-black text-3xl text-purple-900">{fmtDelta(avgProj2050)}°C</p>
                  </div>
                </div>
                <div className="border-t border-purple-900/10 pt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {top6.map((c) => (
                    <Link
                      key={c.id}
                      href={`/a/${slugify(c.name)}`}
                      className="text-xs font-semibold text-purple-900/70 hover:text-purple-900 hover:underline transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Toutes les villes */}
              <div className="col-span-2 bg-white rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-4">
                  Toutes les villes - du plus chaud au plus frais
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
                              2050 : {fmtDelta(proj2050)}
                            </span>
                          )}
                          <span className="text-neutral-300 group-hover:text-neutral-500 transition-colors text-sm">→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
