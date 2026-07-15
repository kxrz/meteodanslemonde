import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { slugify } from "@/lib/slugify"
import { loadClimateMap } from "@/lib/climate"
import { fmt, fmtDelta } from "@/lib/format"
import { fetchFireRisk, fetchFireSummary, type FireRiskLevel } from "@/lib/fire-data"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"
import RegionCitiesMapWrapper from "@/components/RegionCitiesMapWrapper"

const FIRE_PRONE = new Set([
  "provence-alpes-cote-d-azur",
  "occitanie",
  "nouvelle-aquitaine",
  "corse",
  "auvergne-rhone-alpes",
])

const FIRE_RISK_STYLE: Record<FireRiskLevel, { bg: string; badge: string; label: string; text: string }> = {
  low:      { bg: "bg-green-50",  badge: "bg-green-100 text-green-800",  label: "Faible",  text: "text-green-700" },
  moderate: { bg: "bg-amber-50",  badge: "bg-amber-100 text-amber-800",  label: "Modéré",  text: "text-amber-700" },
  high:     { bg: "bg-orange-50", badge: "bg-orange-100 text-orange-800", label: "Élevé",   text: "text-orange-700" },
  extreme:  { bg: "bg-red-50",    badge: "bg-red-100 text-red-800",      label: "Extrême", text: "text-red-700" },
}

export const revalidate = 86400

async function fetchDroughtData(lat: number, lon: number): Promise<{ current: number; normal: number; anomaly: number; daysElapsed: number } | null> {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const daysInMonth = new Date(y, now.getMonth() + 1, 0).getDate()
  const daysElapsed = now.getDate()
  if (daysElapsed < 3) return null

  const base = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=precipitation_sum`
  try {
    const [resCurrent, resNormal] = await Promise.all([
      fetch(`${base}&start_date=${y}-${m}-01&end_date=${y}-${m}-${d}`, { next: { revalidate: 86400 } }),
      fetch(`${base}&start_date=2013-${m}-01&end_date=2022-${m}-${String(daysInMonth).padStart(2, "0")}`, { next: { revalidate: 86400 } }),
    ])
    if (!resCurrent.ok || !resNormal.ok) return null
    const [dataCurrent, dataNormal] = await Promise.all([resCurrent.json(), resNormal.json()])

    const sum = (arr: (number | null)[]) => arr.filter((v): v is number => v !== null).reduce((s, v) => s + v, 0)
    const current = Math.round(sum(dataCurrent.daily.precipitation_sum))
    const fullMonthNormal = sum(dataNormal.daily.precipitation_sum) / 10
    const proratedNormal = Math.round(fullMonthNormal * (daysElapsed / daysInMonth))
    const anomaly = proratedNormal > 0 ? Math.round(((current - proratedNormal) / proratedNormal) * 100) : 0

    return { current, normal: proratedNormal, anomaly, daysElapsed }
  } catch {
    return null
  }
}

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; lat: number; lon: number; region: string
}>

const REGIONS: Record<string, { label: string; description: string }> = {
  "bretagne": {
    label: "Bretagne",
    description: "La Bretagne est historiquement l'une des régions les plus tempérées de France, mais les étés s'y réchauffent rapidement. Rennes, Brest, Lorient, Vannes, Quimper et Saint-Malo voient leurs normales estivales progresser selon les données ERA5.",
  },
  "occitanie": {
    label: "Occitanie",
    description: "L'Occitanie est l'une des régions françaises les plus exposées aux vagues de chaleur. Toulouse, Montpellier, Perpignan et Nîmes enregistrent déjà des étés parmi les plus chauds d'Europe.",
  },
  "provence-alpes-cote-d-azur": {
    label: "Provence-Alpes-Côte d'Azur",
    description: "Marseille, Nice, Toulon, Aix-en-Provence et Avignon affichent des anomalies de chaleur parmi les plus fortes de métropole. Le pourtour méditerranéen se réchauffe deux fois plus vite que la moyenne mondiale.",
  },
  "auvergne-rhone-alpes": {
    label: "Auvergne-Rhône-Alpes",
    description: "Entre plaines du Rhône et massifs alpins, la région Auvergne-Rhône-Alpes connaît des contrastes thermiques importants. Lyon, Grenoble et Valence subissent des pics de chaleur de plus en plus fréquents.",
  },
  "nouvelle-aquitaine": {
    label: "Nouvelle-Aquitaine",
    description: "Bordeaux, Bayonne, La Rochelle et Pau voient leurs étés se transformer. La Nouvelle-Aquitaine est l'une des régions françaises où l'évolution climatique est la plus marquée ces trente dernières années.",
  },
  "hauts-de-france": {
    label: "Hauts-de-France",
    description: "Lille, Amiens, Dunkerque, Calais et Valenciennes sont parmi les villes du nord qui se réchauffent le plus rapidement. Les canicules, jadis rares, y deviennent des événements réguliers.",
  },
  "ile-de-france": {
    label: "Île-de-France",
    description: "Paris concentre à la fois l'effet d'îlot de chaleur urbain et le réchauffement climatique régional. La capitale française a franchi les 42°C lors de la canicule de 2019.",
  },
  "grand-est": {
    label: "Grand Est",
    description: "Strasbourg, Reims, Metz, Nancy, Mulhouse et Troyes connaissent un climat continental qui amplifie les extrêmes. Les étés y sont de plus en plus chauds et secs selon les données ERA5.",
  },
  "pays-de-la-loire": {
    label: "Pays de la Loire",
    description: "Nantes, Angers, Le Mans et La Roche-sur-Yon sont au carrefour des influences atlantiques et continentales. Le réchauffement s'y accélère, avec des normales estivales en hausse significative.",
  },
  "bourgogne-franche-comte": {
    label: "Bourgogne-Franche-Comté",
    description: "Dijon, Besançon, Chalon-sur-Saône et Belfort présentent des profils climatiques distincts entre plaines bourguignonnes et massif jurassien. La tendance au réchauffement y est néanmoins uniforme.",
  },
  "normandie": {
    label: "Normandie",
    description: "Caen, Rouen, Le Havre et Cherbourg bénéficient encore du frein océanique, mais les canicules atteignent désormais la côte normande. L'évolution des normales ERA5 y est significative.",
  },
  "centre-val-de-loire": {
    label: "Centre-Val de Loire",
    description: "Tours, Orléans, Chartres et Bourges sont au coeur d'une région qui sert souvent de couloir de chaleur entre le Sud et le Nord. Les projections GIEC 2050 y sont particulièrement préoccupantes.",
  },
  "corse": {
    label: "Corse",
    description: "Ajaccio et Bastia incarnent un réchauffement méditerranéen accéléré. L'île de Beauté, déjà chaude, voit ses normales estivales grimper vers des niveaux inédits selon les scénarios CMIP6.",
  },
}

function getRegionBySlug(slug: string) {
  return REGIONS[slug] ?? null
}

function getCitiesInRegion(regionLabel: string) {
  return citiesFR.filter((c) => c.region === regionLabel)
}

export async function generateStaticParams() {
  return Object.keys(REGIONS).map((region) => ({ region }))
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params
  const meta = getRegionBySlug(region)
  if (!meta) return {}

  const title = `${meta.label} · Chaleur & projections climatiques · cestchaud.fr`
  const description = `Données ERA5 et projections GIEC 2050 pour les villes de ${meta.label}. ${meta.description.slice(0, 120)}`

  return {
    title,
    description,
    alternates: { canonical: `https://www.cestchaud.fr/r/${region}` },
    openGraph: {
      title,
      description,
      url: `https://www.cestchaud.fr/r/${region}`,
      siteName: "cestchaud.fr",
      locale: "fr_FR",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params
  const meta = getRegionBySlug(region)
  if (!meta) notFound()

  const cities = getCitiesInRegion(meta.label)
  if (cities.length === 0) notFound()

  const climateMap = loadClimateMap()
  const m = new Date().getMonth()
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })

  const citiesWithClimate = cities.map((city) => {
    const climate = climateMap[city.id] ?? null
    const normal = climate?.normal?.[m] ?? null
    // trend for current month (for per-city display, labeled with month)
    const trendMonth = climate?.trend?.[m] ?? null
    // annual average trend (all 12 months) - used for region KPI
    const trendAnnual = climate?.trend
      ? climate.trend.filter((v): v is number => v !== null).reduce((s, v) => s + v, 0) /
        climate.trend.filter((v): v is number => v !== null).length
      : null
    const proj2050 = climate?.proj2050?.[m] ?? null
    return { ...city, normal, trendMonth, trendAnnual, proj2050 }
  })

  const citiesSorted = [...citiesWithClimate].sort((a, b) => (b.normal ?? -99) - (a.normal ?? -99))

  // Region KPI: annual average (not month-specific) to avoid misleading seasonal spikes
  const validAnnualTrends = citiesWithClimate.filter((c) => c.trendAnnual !== null)
  const avgTrendAnnual = validAnnualTrends.length
    ? validAnnualTrends.reduce((s, c) => s + (c.trendAnnual ?? 0), 0) / validAnnualTrends.length
    : null

  const hottest = citiesSorted[0]

  const citiesForMap = citiesWithClimate.map((c) => ({
    id: c.id,
    name: c.name,
    lat: c.lat,
    lon: c.lon,
    normal: c.normal,
    trend: c.trendMonth,
  }))

  const drought = hottest ? await fetchDroughtData(hottest.lat, hottest.lon) : null

  const isSummer = new Date().getMonth() >= 4 && new Date().getMonth() <= 9
  const isFireProne = FIRE_PRONE.has(region)
  const [fireRisk, fireSummary] = isFireProne && isSummer
    ? await Promise.all([
        fetchFireRisk(hottest?.lat ?? 44, hottest?.lon ?? 5),
        fetchFireSummary(),
      ])
    : [null, null]

  return (
    <div className="flex flex-col bg-[#f5f4f0] lg:h-screen lg:overflow-hidden">
      <SiteHeader asLink subtitle={`Données climatiques de la région ${meta.label}`} />
      <Breadcrumb crumbs={[{ label: "Régions", href: "/r" }, { label: meta.label }]} />

      <div className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0">

        {/* Left: map (40%) */}
        <div className="h-[50vw] max-h-[360px] lg:max-h-none lg:h-auto lg:w-[40%] shrink-0 relative p-3 lg:p-4">
          <div className="w-full h-full rounded-3xl overflow-hidden">
            <RegionCitiesMapWrapper cities={citiesForMap} showFires={isFireProne && isSummer} />
          </div>
          <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 leading-none mb-0.5">
              France
            </p>
            <h1 className="text-base font-black text-neutral-900 leading-tight">{meta.label}</h1>
          </div>
        </div>

        {/* Right: content (60%) */}
        <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto p-3 lg:p-4 lg:w-[60%]">
          <div className="grid grid-cols-2 gap-3 pb-4">

            {/* Description */}
            <div className="col-span-2 bg-neutral-900 rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/60 mb-3">Région</p>
              <p className="text-sm text-white/80 leading-relaxed">{meta.description}</p>
            </div>

            {/* KPIs */}
            <div className="bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">Villes suivies</p>
              <p className="text-4xl font-black text-neutral-900">{cities.length}</p>
            </div>

            <div className="bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">Tendance ERA5 annuelle</p>
              {avgTrendAnnual !== null ? (
                <>
                  <p className="text-4xl font-black" style={{ color: avgTrendAnnual > 0 ? "#ef4444" : "#3b82f6" }}>
                    {fmtDelta(avgTrendAnnual)}°C
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">moy. toutes saisons · depuis 1990</p>
                </>
              ) : (
                <p className="text-4xl font-black text-neutral-500">—</p>
              )}
            </div>

            {drought && (
              <div className={`col-span-2 rounded-3xl p-5 ${drought.anomaly <= -30 ? "bg-amber-50" : drought.anomaly >= 30 ? "bg-blue-50" : "bg-neutral-50"}`}>
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                  Précipitations · {new Date().toLocaleDateString("fr-FR", { month: "long" })} (J1–J{drought.daysElapsed})
                </p>
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-black text-neutral-900">{drought.current} mm</p>
                  <p className={`text-lg font-bold ${drought.anomaly < -15 ? "text-amber-500" : drought.anomaly > 15 ? "text-blue-500" : "text-neutral-400"}`}>
                    {drought.anomaly > 0 ? "+" : ""}{drought.anomaly}%
                  </p>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  vs. normale proratisée : {drought.normal} mm · référence 2013–2022
                </p>
                {drought.anomaly <= -30 && (
                  <p className="text-xs text-amber-600 mt-2 font-semibold">Déficit hydrique significatif ce mois.</p>
                )}
                {drought.anomaly >= 30 && (
                  <p className="text-xs text-blue-600 mt-2 font-semibold">Excédent de précipitations ce mois.</p>
                )}
              </div>
            )}

            {fireRisk && (
              <div className={`col-span-2 rounded-3xl p-5 ${FIRE_RISK_STYLE[fireRisk.level].bg}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400">
                    Risque incendie · aujourd&apos;hui
                  </p>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${FIRE_RISK_STYLE[fireRisk.level].badge}`}>
                    {FIRE_RISK_STYLE[fireRisk.level].label}
                  </span>
                </div>
                <div className="flex items-baseline gap-4 mb-3">
                  <div>
                    <p className="text-xs text-neutral-400">Temp. max</p>
                    <p className={`text-xl font-black ${FIRE_RISK_STYLE[fireRisk.level].text}`}>{Math.round(fireRisk.tempMax)}°C</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Humidité min</p>
                    <p className={`text-xl font-black ${FIRE_RISK_STYLE[fireRisk.level].text}`}>{Math.round(fireRisk.humMin)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Vent max</p>
                    <p className={`text-xl font-black ${FIRE_RISK_STYLE[fireRisk.level].text}`}>{Math.round(fireRisk.windMax)} km/h</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Pluie 3j</p>
                    <p className={`text-xl font-black ${FIRE_RISK_STYLE[fireRisk.level].text}`}>{Math.round(fireRisk.precip3d)} mm</p>
                  </div>
                </div>
                {fireSummary && fireSummary.activeCount > 0 && (
                  <div className="flex flex-wrap gap-3 mb-3 text-xs text-neutral-600">
                    <Link href="/feux" className="bg-red-100 text-red-700 rounded-lg px-2 py-0.5 font-semibold hover:bg-red-200 transition-colors">
                      {fireSummary.activeCount} détections satellite en France (7j) · voir la carte
                    </Link>
                  </div>
                )}
                <p className="text-xs text-neutral-500 leading-relaxed">
                  La saison des feux s&apos;est allongée de 3 semaines depuis 1970 en France méditerranéenne. Sous RCP4.5, elle devrait s&apos;étendre de 4 à 8 semaines supplémentaires d&apos;ici 2050 (GIEC AR6, Ch.&nbsp;12). Les points rouges sur la carte indiquent les feux détectés par satellite (NASA FIRMS, 7 derniers jours).
                </p>
              </div>
            )}

            {hottest && hottest.normal !== null && (
              <div className="col-span-2 bg-[#fff7ed] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-400 mb-2">Ville la plus chaude</p>
                <p className="text-2xl font-black text-neutral-900">{hottest.name}</p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Normale {monthName} : {fmt(hottest.normal)}°C
                  {hottest.trendAnnual !== null && ` · ERA5 annuel : ${fmtDelta(hottest.trendAnnual)}°C`}
                </p>
              </div>
            )}

            {/* Liste des villes */}
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">Villes de la région</p>
              <div className="grid grid-cols-1 gap-2">
                {citiesSorted.map((city) => (
                  <Link
                    key={city.id}
                    href={`/a/${slugify(city.name)}`}
                    className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between hover:shadow-md transition-shadow group"
                  >
                    <div>
                      <p className="font-black text-neutral-900 group-hover:text-orange-500 transition-colors">{city.name}</p>
                      {city.normal !== null && (
                        <p className="text-xs text-neutral-400 mt-0.5">Normale {monthName} : {fmt(city.normal)}°C</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      {city.trendMonth !== null && (
                        <>
                          <p className="text-lg font-black" style={{ color: city.trendMonth > 0 ? "#ef4444" : "#3b82f6" }}>
                            {fmtDelta(city.trendMonth)}°C
                          </p>
                          <p className="text-[10px] text-neutral-400">tendance {monthName}</p>
                        </>
                      )}
                      {city.proj2050 !== null && (
                        <p className="text-[10px] text-neutral-400 mt-0.5">2050 : {fmtDelta(city.proj2050)}°C</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Autres régions */}
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">Autres régions</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(REGIONS)
                  .filter(([slug]) => slug !== region)
                  .map(([slug, r]) => (
                    <Link
                      key={slug}
                      href={`/r/${slug}`}
                      className="text-xs bg-white border border-neutral-200 hover:border-neutral-400 hover:text-neutral-800 text-neutral-500 rounded-xl px-3 py-1.5 transition-colors"
                    >
                      {r.label}
                    </Link>
                  ))}
              </div>
            </div>

          </div>
          <PageFooter className="px-0 py-3" />
        </div>

      </div>
    </div>
  )
}
