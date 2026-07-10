import Link from "next/link"
import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Chaleur par région · cestchaud.fr",
  description: "Données ERA5 et projections GIEC 2050 pour les 13 régions métropolitaines françaises. Tendances de chaleur, anomalies et villes les plus exposées.",
  alternates: { canonical: "https://cestchaud.fr/r" },
  openGraph: {
    title: "Chaleur par région · cestchaud.fr",
    description: "ERA5 et projections GIEC 2050 pour les 13 régions françaises.",
    url: "https://cestchaud.fr/r",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
}

const REGIONS = [
  { slug: "bretagne", label: "Bretagne", cities: "Rennes, Brest, Lorient, Vannes, Quimper, Saint-Malo" },
  { slug: "occitanie", label: "Occitanie", cities: "Toulouse, Montpellier, Perpignan, Nîmes, Albi, Montauban" },
  { slug: "provence-alpes-cote-d-azur", label: "Provence-Alpes-Côte d'Azur", cities: "Marseille, Nice, Toulon, Aix-en-Provence, Avignon" },
  { slug: "auvergne-rhone-alpes", label: "Auvergne-Rhône-Alpes", cities: "Lyon, Grenoble, Clermont-Ferrand, Valence, Saint-Étienne, Annecy" },
  { slug: "nouvelle-aquitaine", label: "Nouvelle-Aquitaine", cities: "Bordeaux, Limoges, Poitiers, Pau, Bayonne, La Rochelle" },
  { slug: "hauts-de-france", label: "Hauts-de-France", cities: "Lille, Amiens, Dunkerque, Valenciennes, Calais, Arras" },
  { slug: "ile-de-france", label: "Île-de-France", cities: "Paris" },
  { slug: "grand-est", label: "Grand Est", cities: "Strasbourg, Reims, Metz, Nancy, Mulhouse, Troyes" },
  { slug: "pays-de-la-loire", label: "Pays de la Loire", cities: "Nantes, Angers, Le Mans, La Roche-sur-Yon" },
  { slug: "bourgogne-franche-comte", label: "Bourgogne-Franche-Comté", cities: "Dijon, Besançon, Chalon-sur-Saône, Belfort" },
  { slug: "normandie", label: "Normandie", cities: "Caen, Rouen, Le Havre, Cherbourg" },
  { slug: "centre-val-de-loire", label: "Centre-Val de Loire", cities: "Tours, Orléans, Chartres, Bourges" },
  { slug: "corse", label: "Corse", cities: "Ajaccio, Bastia" },
]

export default function RegionsIndexPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <SiteHeader asLink subtitle="Chaleur et projections GIEC par région française" />
      <Breadcrumb crumbs={[{ label: "Régions" }]} />

      <main className="flex-1 px-5 py-6 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-1">France métropolitaine</p>
          <h1 className="text-4xl font-black text-neutral-900 leading-tight mb-4">Chaleur par région</h1>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
            Explorez les données de chaleur pour chaque région de France métropolitaine : anomalies ERA5 sur 30 ans,
            normales saisonnières et projections GIEC CMIP6 à l'horizon 2050.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REGIONS.map((r) => (
            <Link
              key={r.slug}
              href={`/r/${r.slug}`}
              className="bg-white rounded-2xl p-4 hover:shadow-md transition-shadow group"
            >
              <p className="font-black text-neutral-900 group-hover:text-orange-500 transition-colors mb-1">{r.label}</p>
              <p className="text-xs text-neutral-400 leading-snug">{r.cities}</p>
            </Link>
          ))}
        </div>
      </main>

      <PageFooter className="px-5 py-4" />
    </div>
  )
}
