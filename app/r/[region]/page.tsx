import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { slugify } from "@/lib/slugify"
import { loadClimateMap } from "@/lib/climate"
import { fmt, fmtDelta } from "@/lib/format"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"

export const revalidate = 86400

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; lat: number; lon: number; region: string
}>

const REGIONS: Record<string, { label: string; description: string }> = {
  "bretagne": {
    label: "Bretagne",
    description: "La Bretagne est historiquement l'une des régions les plus tempérées de France, mais les étés s'y réchauffent rapidement. Découvrez les données climatiques de Rennes, Brest, Lorient, Vannes, Quimper et Saint-Malo.",
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
  const description = `Données de chaleur, anomalies ERA5 et projections GIEC 2050 pour les villes de ${meta.label}. ${meta.description.slice(0, 100)}...`

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

  const avgAnomaly =
    citiesWithClimate.filter((c) => c.trend !== null).reduce((sum, c) => sum + (c.trend ?? 0), 0) /
    (citiesWithClimate.filter((c) => c.trend !== null).length || 1)

  const hottest = [...citiesWithClimate].sort((a, b) => (b.normal ?? -99) - (a.normal ?? -99))[0]

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <SiteHeader asLink subtitle={`Données climatiques de la région ${meta.label}`} />
      <Breadcrumb crumbs={[{ label: "Régions", href: "/r" }, { label: meta.label }]} />

      <main className="flex-1 px-5 py-6 max-w-4xl mx-auto w-full">
        {/* Hero */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-1">Région</p>
          <h1 className="text-4xl font-black text-neutral-900 leading-tight mb-4">{meta.label}</h1>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">{meta.description}</p>
        </div>

        {/* KPI synthèse région */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">Villes suivies</p>
            <p className="text-3xl font-black text-neutral-900">{cities.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">Tendance moy. ERA5</p>
            <p className="text-3xl font-black" style={{ color: avgAnomaly > 0 ? "#ef4444" : "#3b82f6" }}>
              {fmtDelta(avgAnomaly)}°C
            </p>
          </div>
          {hottest && hottest.normal !== null && (
            <div className="bg-white rounded-2xl p-4 col-span-2 sm:col-span-1">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">Ville la plus chaude</p>
              <p className="text-3xl font-black text-neutral-900">{hottest.name}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{fmt(hottest.normal)}°C en normale</p>
            </div>
          )}
        </div>

        {/* Liste des villes */}
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-3">
          Villes de la région
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {citiesWithClimate
            .sort((a, b) => (b.normal ?? -99) - (a.normal ?? -99))
            .map((city) => (
              <Link
                key={city.id}
                href={`/a/${slugify(city.name)}`}
                className="bg-white rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow group"
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

        {/* Bloc éditorial */}
        <div className="bg-white rounded-3xl p-6 mb-6">
          <h2 className="text-base font-black text-neutral-900 mb-3">
            Le réchauffement en {meta.label} : ce que disent les données
          </h2>
          <div className="text-sm text-neutral-600 leading-relaxed space-y-3">
            <p>
              Les données ERA5 couvrent 30 ans d'observations satellitaires et de remplissage de modèle.
              La tendance que vous voyez ici est le delta entre la normale actuelle (1991-2020) et celle de référence (1961-1990),
              calculée mois par mois pour chaque ville de la région {meta.label}.
            </p>
            <p>
              Les projections GIEC 2050 sont issues des scénarios CMIP6 SSP2-4.5 (emissions modérées) et SSP5-8.5 (scénario haut).
              Elles donnent une fourchette probable du ressenti max estival d'ici 25 ans.
            </p>
            <p>
              Pour comparer avec d'autres régions ou explorer les villes jumelles climatiques dans le monde,
              utilisez les outils disponibles sur cestchaud.fr.
            </p>
          </div>
        </div>

        {/* Navigation régions */}
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-3">Autres régions</p>
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
      </main>

      <PageFooter className="px-5 py-4" />
    </div>
  )
}
