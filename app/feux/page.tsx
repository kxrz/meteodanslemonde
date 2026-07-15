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

function frpLabel(frp: number): string {
  if (frp <= 0) return "n/d"
  if (frp < 10) return `${frp.toFixed(1)} MW`
  return `${Math.round(frp)} MW`
}

export default async function FeuxPage() {
  const points = await fetchFirePoints()

  if (points.length === 0) {
    return (
      <>
        <SiteHeader asLink />
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

  // Agrégations
  const byDay: Record<string, number> = {}
  for (const p of points) byDay[p.date] = (byDay[p.date] ?? 0) + 1
  const days = Object.keys(byDay).sort()
  const maxDayCount = Math.max(...Object.values(byDay), 1)

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

  return (
    <>
      <SiteHeader asLink />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* Breadcrumb */}
        <nav className="text-xs text-neutral-400 flex items-center gap-1.5">
          <Link href="/" className="hover:text-neutral-700 transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-neutral-700">Incendies</span>
        </nav>

        {/* Titre */}
        <div>
          <h1 className="text-3xl font-black text-neutral-900 mb-1">Incendies en France</h1>
          <p className="text-neutral-500 text-sm">Détections satellite NASA FIRMS · VIIRS SUOMI NPP · 7 derniers jours</p>
        </div>

        {/* Layout principal : carte gauche / stats droite */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Carte */}
          <div className="lg:flex-1 flex flex-col gap-3">
            <div className="bg-neutral-100 rounded-3xl overflow-hidden" style={{ height: 520 }}>
              <FireMapWrapper geojson={geojson} />
            </div>
            <p className="text-[11px] text-neutral-400 px-1">
              Cercles rouges = détections VIIRS · taille proportionnelle à la puissance radiative (FRP) · cliquez pour les détails
            </p>
          </div>

          {/* Stats */}
          <div className="lg:w-[340px] shrink-0 flex flex-col gap-4">

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#431407] rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-orange-300 font-semibold mb-1">Détections</p>
                <p className="text-3xl font-black text-white leading-none">{points.length}</p>
                <p className="text-xs text-orange-200/70 mt-1">7 derniers jours</p>
              </div>
              <div className="bg-red-900 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-red-200 font-semibold mb-1">Confiance haute</p>
                <p className="text-3xl font-black text-white leading-none">{highConf}</p>
                <p className="text-xs text-red-200/70 mt-1">{Math.round((highConf / points.length) * 100)}% des signaux</p>
              </div>
              {hasFrp ? (
                <div className="bg-amber-900 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-amber-200 font-semibold mb-1">Puissance max</p>
                  <p className="text-2xl font-black text-white leading-none">{frpLabel(maxFrp)}</p>
                  <p className="text-xs text-amber-200/70 mt-1">feu le plus intense</p>
                </div>
              ) : (
                <div className="bg-neutral-700 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-1">Puissance (FRP)</p>
                  <p className="text-2xl font-black text-neutral-300 leading-none">n/d</p>
                  <p className="text-xs text-neutral-400 mt-1">non transmise</p>
                </div>
              )}
              <div className="bg-orange-900 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-orange-200 font-semibold mb-1">Pic journalier</p>
                <p className="text-2xl font-black text-white leading-none">{byDay[peakDay] ?? 0}</p>
                <p className="text-xs text-orange-200/70 mt-1">
                  le {peakDay ? new Date(peakDay + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "-"}
                </p>
              </div>
            </div>

            {/* Activité par jour */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-4">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-3">Activité sur 7 jours</p>
              <div className="flex items-end gap-1 h-16">
                {days.map(day => {
                  const count = byDay[day] ?? 0
                  const pct = Math.round((count / maxDayCount) * 100)
                  const isPeak = day === peakDay
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[9px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                      <div
                        className={`w-full rounded-t-sm ${isPeak ? "bg-red-500" : "bg-orange-300"}`}
                        style={{ height: `${Math.max(pct, 6)}%` }}
                      />
                      <span className="text-[8px] text-neutral-400 leading-none">
                        {new Date(day + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Répartition par région */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-4">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-3">Par région</p>
              <div className="space-y-2.5">
                {regionRanking.map(([key, data]) => {
                  const meta = REGION_BOXES[key]
                  const pct = Math.round((data.count / points.length) * 100)
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <Link href={`/r/${meta.slug}`} className="text-xs font-semibold text-neutral-700 hover:text-orange-600 transition-colors truncate pr-2">
                          {meta.label}
                        </Link>
                        <span className="text-xs font-bold text-neutral-600 shrink-0">{data.count}</span>
                      </div>
                      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500" style={{ width: `${pct}%` }} />
                      </div>
                      {data.frpTotal > 0 && (
                        <p className="text-[10px] text-neutral-400 mt-0.5">{Math.round(data.frpTotal)} MW cumulés</p>
                      )}
                    </div>
                  )
                })}
                {autresCount > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-400">Autres régions</span>
                      <span className="text-xs font-bold text-neutral-400">{autresCount}</span>
                    </div>
                    <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-neutral-300" style={{ width: `${Math.round((autresCount / points.length) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Source */}
            <div className="bg-neutral-50 rounded-2xl p-4 text-[11px] text-neutral-500 leading-relaxed">
              <strong className="text-neutral-700">Source :</strong> NASA FIRMS · satellite SUOMI NPP · capteur VIIRS.
              FRP (Fire Radiative Power) mesure la puissance radiative en MW. Les zones nuageuses peuvent masquer des feux réels.
              Données publiques, sans clé API, mises à jour plusieurs fois par jour.
            </div>

            <div className="flex gap-4">
              <Link href="/r" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Toutes les régions &rarr;</Link>
              <Link href="/alertes" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Alertes canicule &rarr;</Link>
            </div>

          </div>
        </div>

      </main>
      <PageFooter />
    </>
  )
}
