import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { slugify } from "@/lib/slugify"
import { loadClimateMap } from "@/lib/climate"
import { fmt, fmtDelta } from "@/lib/format"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"
import RegionCitiesMapWrapper from "@/components/RegionCitiesMapWrapper"

export const revalidate = 86400

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
    alternates: { canonical: `https://cestchaud.fr/r/${region}` },
    openGraph: {
      title,
      description,
      url: `https://cestchaud.fr/r/${region}`,
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

  const citiesWithClimate = cities.map((city) => {
    const climate = climateMap[city.id] ?? null
    const normal = climate?.normal?.[m] ?? null
    const trend = climate?.trend?.[m] ?? null
    const proj2050 = climate?.proj2050?.[m] ?? null
    return { ...city, normal, trend, proj2050 }
  })

  const citiesSorted = [...citiesWithClimate].sort((a, b) => (b.normal ?? -99) - (a.normal ?? -99))

  const validTrends = citiesWithClimate.filter((c) => c.trend !== null)
  const avgTrend = validTrends.length
    ? validTrends.reduce((s, c) => s + (c.trend ?? 0), 0) / validTrends.length
    : null

  const hottest = citiesSorted[0]

  const citiesForMap = citiesWithClimate.map((c) => ({
    id: c.id,
    name: c.name,
    lat: c.lat,
    lon: c.lon,
    normal: c.normal,
    trend: c.trend,
  }))

  return (
    <div className="flex flex-col bg-[#f5f4f0] lg:h-screen lg:overflow-hidden">
      <SiteHeader asLink subtitle={`Données climatiques de la région ${meta.label}`} />
      <Breadcrumb crumbs={[{ label: "Régions", href: "/r" }, { label: meta.label }]} />

      <div className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0">

        {/* Left: map (40%) */}
        <div className="h-[50vw] max-h-[360px] lg:max-h-none lg:h-auto lg:w-[40%] shrink-0 relative p-3 lg:p-4">
          <div className="w-full h-full rounded-3xl overflow-hidden">
            <RegionCitiesMapWrapper cities={citiesForMap} />
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
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-3">Région</p>
              <p className="text-sm text-white/80 leading-relaxed">{meta.description}</p>
            </div>

            {/* KPIs */}
            <div className="bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">Villes suivies</p>
              <p className="text-4xl font-black text-neutral-900">{cities.length}</p>
            </div>

            <div className="bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">Tendance ERA5 moy.</p>
              {avgTrend !== null ? (
                <p className="text-4xl font-black" style={{ color: avgTrend > 0 ? "#ef4444" : "#3b82f6" }}>
                  {fmtDelta(avgTrend)}°C
                </p>
              ) : (
                <p className="text-4xl font-black text-neutral-300">—</p>
              )}
            </div>

            {hottest && hottest.normal !== null && (
              <div className="col-span-2 bg-[#fff7ed] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-400 mb-2">Ville la plus chaude</p>
                <p className="text-2xl font-black text-neutral-900">{hottest.name}</p>
                <p className="text-sm text-neutral-500 mt-0.5">Normale : {fmt(hottest.normal)}°C · Tendance : {fmtDelta(hottest.trend)}°C</p>
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
                        <p className="text-xs text-neutral-400 mt-0.5">Normale : {fmt(city.normal)}°C</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      {city.trend !== null && (
                        <p className="text-lg font-black" style={{ color: city.trend > 0 ? "#ef4444" : "#3b82f6" }}>
                          {fmtDelta(city.trend)}°C
                        </p>
                      )}
                      {city.proj2050 !== null && (
                        <p className="text-[10px] text-neutral-400">2050 : {fmtDelta(city.proj2050)}°C</p>
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
