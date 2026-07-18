import Link from "next/link"
import { Metadata } from "next"
import { fetchFirePoints, fetchFireZoneWeather, clusterFirePoints } from "@/lib/fire-data"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import FirePageClient from "@/components/FirePageClient"

const META_TITLE = "Anomalies thermiques en France · Lecture satellite 7 jours"
const META_DESC = "Carte des anomalies thermiques détectées par satellite NASA FIRMS / VIIRS en France métropolitaine et Corse. Usage pédagogique de données ouvertes, mis à jour toutes les heures."

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESC,
  alternates: { canonical: "https://www.cestchaud.fr/feux" },
  openGraph: {
    title: META_TITLE,
    description: META_DESC,
    url: "https://www.cestchaud.fr/feux",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: META_TITLE, description: META_DESC },
}

export const revalidate = 3600

const REGION_BOXES: Record<string, { label: string; slug: string; latMin: number; latMax: number; lonMin: number; lonMax: number }> = {
  paca:  { label: "Provence-Alpes-Côte d'Azur", slug: "provence-alpes-cote-d-azur", latMin: 43.1, latMax: 45.1, lonMin: 4.2, lonMax: 7.8 },
  occ:   { label: "Occitanie",                  slug: "occitanie",                  latMin: 42.3, latMax: 44.8, lonMin: -1.8, lonMax: 4.2 },
  na:    { label: "Nouvelle-Aquitaine",          slug: "nouvelle-aquitaine",          latMin: 43.4, latMax: 47.6, lonMin: -1.8, lonMax: 2.5 },
  ara:   { label: "Auvergne-Rhône-Alpes",        slug: "auvergne-rhone-alpes",        latMin: 44.1, latMax: 46.9, lonMin: 2.5, lonMax: 7.5 },
  corse: { label: "Corse",                       slug: "corse",                       latMin: 41.3, latMax: 43.1, lonMin: 8.4, lonMax: 9.6 },
  idf:   { label: "Île-de-France",               slug: "ile-de-france",               latMin: 48.0, latMax: 49.2, lonMin: 1.4, lonMax: 3.6 },
  cvdl:  { label: "Centre-Val de Loire",         slug: "centre-val-de-loire",         latMin: 46.5, latMax: 48.5, lonMin: 0.5, lonMax: 3.5 },
}

function assignRegion(lat: number, lon: number): string {
  for (const [key, b] of Object.entries(REGION_BOXES)) {
    if (lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax) return key
  }
  return "autres"
}

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; lat: number; lon: number; region: string
}>

export default async function FeuxPage() {
  const points = await fetchFirePoints()


  if (points.length === 0) {
    return (
      <>
        <SiteHeader asLink />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-neutral-500 text-sm mb-4">Aucune détection VIIRS en France sur les 7 derniers jours.</p>
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors">Retour à l&apos;accueil</Link>
        </main>
        <PageFooter />
      </>
    )
  }

  // Centroïde des feux pour les données météo
  const centroidLat = points.reduce((s, p) => s + p.lat, 0) / points.length
  const centroidLon = points.reduce((s, p) => s + p.lon, 0) / points.length
  const zoneWeather = await fetchFireZoneWeather(centroidLat, centroidLon)

  // Agrégations
  const byDay: Record<string, number> = {}
  for (const p of points) byDay[p.date] = (byDay[p.date] ?? 0) + 1
  const days = Object.keys(byDay).sort()

  const byRegion: Record<string, { count: number; frpTotal: number }> = {}
  for (const p of points) {
    const r = assignRegion(p.lat, p.lon)
    if (!byRegion[r]) byRegion[r] = { count: 0, frpTotal: 0 }
    byRegion[r].count++
    byRegion[r].frpTotal += p.frp
  }

  const highConf = points.filter(p => p.confidence === "high").length
  const hasFrp = points.some(p => p.frp > 0)
  const maxFrp = hasFrp ? points.reduce((m, p) => Math.max(m, p.frp), 0) : 0
  const peakDay = days.reduce((a, b) => (byDay[a] ?? 0) >= (byDay[b] ?? 0) ? a : b, days[0] ?? "")
  const peakCount = byDay[peakDay] ?? 0

  const regionRanking = Object.entries(byRegion)
    .filter(([key]) => key !== "autres")
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, data]) => ({ key, ...REGION_BOXES[key], count: data.count, frpTotal: data.frpTotal }))
    .filter(r => r.label)

  const autresCount = byRegion["autres"]?.count ?? 0
  const clusters = clusterFirePoints(points)

  const geojson = {
    type: "FeatureCollection" as const,
    features: points.map(p => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] as [number, number] },
      properties: { firedate: p.date, confidence: p.confidence, frp: p.frp },
    })),
  }

  return (
    <div className="flex flex-col bg-[#f5f4f0] lg:h-screen lg:overflow-hidden">
      <SiteHeader asLink />
      <nav className="text-xs text-neutral-400 flex items-center gap-1.5 px-5 py-2">
        <Link href="/" className="hover:text-neutral-700 transition-colors">Accueil</Link>
        <span>/</span>
        <span className="text-neutral-700">Anomalies thermiques</span>
      </nav>
      <div className="px-5 py-3 border-b border-neutral-200 bg-[#f5f4f0] space-y-3">
        <p className="text-xs text-neutral-500 leading-relaxed max-w-3xl">
          Cette page affiche des <strong className="text-neutral-700">anomalies thermiques détectées depuis l&apos;espace</strong>, pas des incendies déclarés. Un capteur satellite voit une zone plus chaude que son environnement : cela peut être un feu de forêt, un site industriel, un écobuage ou un reflet solaire. Il n&apos;existe pas en France d&apos;API publique centralisant les déclarations d&apos;incendies en cours. Cette carte est un usage pédagogique de données ouvertes, pas un outil métier.
        </p>
        <div className="max-w-3xl bg-white border border-neutral-200 rounded-2xl px-4 py-3 flex gap-3 items-start">
          <span className="text-base shrink-0">💬</span>
          <p className="text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-700">Mis à jour grâce aux retours d&apos;experts.</strong> Des géomaticiens et spécialistes des risques ont commenté cette page et signalé des imprécisions. Leurs bonnes pratiques ont permis d&apos;améliorer la lecture des données : masque des zones industrielles connues, détection des sources thermiques permanentes, reformulation des niveaux de certitude. Leurs avis sont les bienvenus.
          </p>
        </div>
      </div>
      <FirePageClient
        geojson={geojson}
        cities={citiesFR}
        totalCount={points.length}
        highConf={highConf}
        hasFrp={hasFrp}
        maxFrp={maxFrp}
        peakDay={peakDay}
        peakCount={peakCount}
        days={days}
        byDay={byDay}
        regionRanking={regionRanking}
        autresCount={autresCount}
        zoneWeather={zoneWeather}
        clusters={clusters}
      />
    </div>
  )
}
