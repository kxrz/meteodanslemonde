import Link from "next/link"
import { Metadata } from "next"
import { fetchFirePoints } from "@/lib/fire-data"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import FireMapWrapper from "@/components/FireMapWrapper"

export const metadata: Metadata = {
  title: "Incendies en France · Détections satellite 7 jours",
  description: "Carte des feux actifs détectés par satellite NASA FIRMS / VIIRS en France métropolitaine et Corse, mise à jour quotidiennement.",
}

export const revalidate = 86400

// Bounding boxes approx par région fire-prone
const REGION_BOXES: Record<string, { label: string; slug: string; latMin: number; latMax: number; lonMin: number; lonMax: number }> = {
  paca:    { label: "Provence-Alpes-Côte d'Azur", slug: "provence-alpes-cote-d-azur", latMin: 43.1, latMax: 45.1, lonMin: 4.2, lonMax: 7.8 },
  occ:     { label: "Occitanie",                  slug: "occitanie",                  latMin: 42.3, latMax: 44.8, lonMin: -1.8, lonMax: 4.2 },
  na:      { label: "Nouvelle-Aquitaine",          slug: "nouvelle-aquitaine",          latMin: 43.4, latMax: 47.6, lonMin: -1.8, lonMax: 2.5 },
  ara:     { label: "Auvergne-Rhône-Alpes",        slug: "auvergne-rhone-alpes",        latMin: 44.1, latMax: 46.9, lonMin: 2.5, lonMax: 7.5 },
  corse:   { label: "Corse",                       slug: "corse",                       latMin: 41.3, latMax: 43.1, lonMin: 8.4, lonMax: 9.6 },
  idf:     { label: "Île-de-France",               slug: "ile-de-france",               latMin: 48.0, latMax: 49.2, lonMin: 1.4, lonMax: 3.6 },
  autres:  { label: "Autres régions",              slug: "r",                           latMin: -90,  latMax: 90,   lonMin: -180, lonMax: 180 },
}

function assignRegion(lat: number, lon: number): string {
  for (const [key, b] of Object.entries(REGION_BOXES)) {
    if (key === "autres") continue
    if (lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax) return key
  }
  return "autres"
}

export default async function FeuxPage() {
  const points = await fetchFirePoints()

  // Agrégation par jour (7 derniers jours)
  const byDay: Record<string, number> = {}
  const byDayFrp: Record<string, number> = {}
  for (const p of points) {
    byDay[p.date] = (byDay[p.date] ?? 0) + 1
    byDayFrp[p.date] = (byDayFrp[p.date] ?? 0) + p.frp
  }
  const days = Object.keys(byDay).sort()

  // Agrégation par région
  const byRegion: Record<string, { count: number; frpTotal: number }> = {}
  for (const p of points) {
    const r = assignRegion(p.lat, p.lon)
    if (!byRegion[r]) byRegion[r] = { count: 0, frpTotal: 0 }
    byRegion[r].count++
    byRegion[r].frpTotal += p.frp
  }

  const totalFrp = points.reduce((s, p) => s + p.frp, 0)
  const maxFrp = points.reduce((m, p) => Math.max(m, p.frp), 0)
  const highConf = points.filter(p => p.confidence === "high").length

  // Jour le plus actif
  const peakDay = days.reduce((a, b) => (byDay[a] ?? 0) >= (byDay[b] ?? 0) ? a : b, days[0] ?? "")
  const peakCount = byDay[peakDay] ?? 0

  // Barres par jour (pour le mini-graphique)
  const maxDay = Math.max(...Object.values(byDay), 1)

  // Régions triées par count
  const regionRanking = Object.entries(byRegion)
    .filter(([key]) => key !== "autres")
    .sort((a, b) => b[1].count - a[1].count)
  const autresCount = byRegion["autres"]?.count ?? 0

  const geojson = {
    type: "FeatureCollection" as const,
    features: points.map(p => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] as [number, number] },
      properties: { firedate: p.date, confidence: p.confidence, frp: p.frp },
    })),
  }

  if (points.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-4">🌲</p>
          <p className="text-xl font-bold text-neutral-800 mb-2">Aucun feu détecté</p>
          <p className="text-neutral-500 text-sm">NASA FIRMS ne signale aucune détection VIIRS en France métropolitaine sur les 7 derniers jours.</p>
          <Link href="/" className="mt-8 inline-block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Retour à l&apos;accueil</Link>
        </main>
        <PageFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Breadcrumb */}
        <nav className="text-xs text-neutral-400 flex items-center gap-1.5">
          <Link href="/" className="hover:text-neutral-700 transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-neutral-700">Incendies</span>
        </nav>

        {/* Hero */}
        <div>
          <h1 className="text-3xl font-black text-neutral-900 mb-1">Incendies en France</h1>
          <p className="text-neutral-500 text-sm">Détections satellite NASA FIRMS · VIIRS SUOMI NPP · 7 derniers jours</p>
        </div>

        {/* Chiffres clés */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#431407] rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-orange-300 font-semibold mb-1">Détections</p>
            <p className="text-3xl font-black text-white leading-none">{points.length}</p>
            <p className="text-xs text-orange-200/70 mt-1">sur 7 jours</p>
          </div>
          <div className="bg-red-900 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-red-200 font-semibold mb-1">Confiance haute</p>
            <p className="text-3xl font-black text-white leading-none">{highConf}</p>
            <p className="text-xs text-red-200/70 mt-1">{Math.round((highConf / points.length) * 100)}% des signaux</p>
          </div>
          <div className="bg-amber-900 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-amber-200 font-semibold mb-1">Puissance max</p>
            <p className="text-3xl font-black text-white leading-none">{Math.round(maxFrp)}</p>
            <p className="text-xs text-amber-200/70 mt-1">MW · feu le plus intense</p>
          </div>
          <div className="bg-orange-900 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-orange-200 font-semibold mb-1">Pic journalier</p>
            <p className="text-3xl font-black text-white leading-none">{peakCount}</p>
            <p className="text-xs text-orange-200/70 mt-1">le {peakDay ? new Date(peakDay + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "-"}</p>
          </div>
        </div>

        {/* Carte */}
        <div className="bg-neutral-100 rounded-3xl overflow-hidden" style={{ height: 480 }}>
          <FireMapWrapper geojson={geojson} />
        </div>
        <p className="text-[11px] text-neutral-400 -mt-3">
          Les cercles rouges indiquent les détections VIIRS · taille proportionnelle à la puissance radiative (FRP) · cliquez pour les détails
        </p>

        {/* Activité par jour */}
        <div className="bg-white rounded-3xl border border-neutral-100 p-5">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-4">Activité sur 7 jours</p>
          <div className="flex items-end gap-1.5 h-20">
            {days.map(day => {
              const count = byDay[day] ?? 0
              const pct = Math.round((count / maxDay) * 100)
              const isPeak = day === peakDay
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{count}</span>
                  <div
                    className={`w-full rounded-t-sm transition-all ${isPeak ? "bg-red-500" : "bg-orange-300"}`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className="text-[9px] text-neutral-400">{new Date(day + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Répartition par région */}
        <div className="bg-white rounded-3xl border border-neutral-100 p-5">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-4">Répartition par région</p>
          <div className="space-y-3">
            {regionRanking.map(([key, data]) => {
              const meta = REGION_BOXES[key]
              const pct = Math.round((data.count / points.length) * 100)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <Link href={`/r/${meta.slug}`} className="text-sm font-semibold text-neutral-800 hover:text-orange-600 transition-colors">
                      {meta.label}
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-400">{Math.round(data.frpTotal)} MW total</span>
                      <span className="text-sm font-bold text-neutral-700">{data.count} <span className="text-neutral-400 font-normal text-xs">détections</span></span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {autresCount > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-500">Autres régions</span>
                  <span className="text-sm font-bold text-neutral-500">{autresCount} <span className="text-neutral-400 font-normal text-xs">détections</span></span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-neutral-300"
                    style={{ width: `${Math.round((autresCount / points.length) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Source */}
        <div className="bg-neutral-50 rounded-2xl p-4 text-xs text-neutral-500 leading-relaxed">
          <strong className="text-neutral-700">Source :</strong> NASA FIRMS (Fire Information for Resource Management System) · satellite SUOMI NPP · capteur VIIRS · données publiques sans clé API.
          La détection VIIRS identifie les anomalies thermiques en surface. Les zones nuageuses peuvent masquer des feux réels. FRP (Fire Radiative Power) en mégawatts : mesure la puissance radiative du feu, proxy de son intensité et de la biomasse consommée.
        </div>

        <div className="flex gap-3">
          <Link href="/r" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            Toutes les régions &rarr;
          </Link>
          <Link href="/alertes" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            Alertes canicule &rarr;
          </Link>
        </div>

      </main>
      <PageFooter />
    </>
  )
}
