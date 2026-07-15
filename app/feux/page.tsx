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
          <p className="text-neutral-500 text-sm mb-2">NASA FIRMS ne signale aucune détection VIIRS en France sur les 7 derniers jours.</p>
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors">Retour à l&apos;accueil</Link>
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

  // Hauteur barre en px sur 56px max
  const BAR_MAX_PX = 56

  return (
    <div className="flex flex-col bg-[#f5f4f0] lg:h-screen lg:overflow-hidden">

      <SiteHeader asLink />

      {/* Breadcrumb */}
      <nav className="text-xs text-neutral-400 flex items-center gap-1.5 px-5 py-2">
        <Link href="/" className="hover:text-neutral-700 transition-colors">Accueil</Link>
        <span>/</span>
        <span className="text-neutral-700">Incendies</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0">

        {/* Gauche : carte */}
        <div className="h-[55vw] max-h-[400px] lg:max-h-none lg:h-auto lg:w-[55%] shrink-0 relative p-3 lg:p-4">
          <div className="w-full h-full rounded-3xl overflow-hidden">
            <FireMapWrapper geojson={geojson} cities={citiesFR} />
          </div>
          <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-orange-500 leading-none mb-0.5">NASA FIRMS · VIIRS</p>
            <h1 className="text-base font-black text-neutral-900 leading-tight">Incendies en France</h1>
          </div>
          <div className="absolute bottom-6 left-6 z-[1000]">
            <p className="font-mono text-[10px] text-neutral-500 bg-white/80 backdrop-blur-sm rounded px-2 py-1">
              7 derniers jours · {points.length} détections
            </p>
          </div>
        </div>

        {/* Droite : stats scrollables */}
        <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto p-3 lg:p-4">
          <div className="grid grid-cols-2 gap-3 pb-4">

            {/* KPIs */}
            <div className="bg-[#431407] rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-orange-300 font-semibold mb-1">Détections</p>
              <p className="text-4xl font-black text-white leading-none">{points.length}</p>
              <p className="text-xs text-orange-200/70 mt-1">7 derniers jours</p>
            </div>

            <div className="bg-red-900 rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-red-200 font-semibold mb-1">Confiance haute</p>
              <p className="text-4xl font-black text-white leading-none">{highConf}</p>
              <p className="text-xs text-red-200/70 mt-1">{points.length > 0 ? Math.round((highConf / points.length) * 100) : 0}% des signaux</p>
            </div>

            {hasFrp ? (
              <div className="bg-amber-900 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-widest text-amber-200 font-semibold mb-1">Puissance max</p>
                <p className="text-3xl font-black text-white leading-none">{frpLabel(maxFrp)}</p>
                <p className="text-xs text-amber-200/70 mt-1">feu le plus intense</p>
              </div>
            ) : (
              <div className="bg-neutral-700 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-1">Puissance (FRP)</p>
                <p className="text-3xl font-black text-neutral-300 leading-none">n/d</p>
                <p className="text-xs text-neutral-400 mt-1">non transmise</p>
              </div>
            )}

            <div className="bg-orange-900 rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-orange-200 font-semibold mb-1">Pic journalier</p>
              <p className="text-3xl font-black text-white leading-none">{byDay[peakDay] ?? 0}</p>
              <p className="text-xs text-orange-200/70 mt-1">
                le {peakDay ? new Date(peakDay + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "-"}
              </p>
            </div>

            {/* Activité par jour */}
            <div className="col-span-2 bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-4">Activité sur {days.length} jour{days.length > 1 ? "s" : ""}</p>
              <div className="flex items-end gap-1.5" style={{ height: `${BAR_MAX_PX + 24}px` }}>
                {days.map(day => {
                  const count = byDay[day] ?? 0
                  const barPx = Math.max(Math.round((count / maxDayCount) * BAR_MAX_PX), 3)
                  const isPeak = day === peakDay
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="text-[9px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                      <div
                        className={`w-full rounded-sm transition-all ${isPeak ? "bg-red-500" : "bg-orange-300 hover:bg-orange-400"}`}
                        style={{ height: barPx }}
                        title={`${count} détections`}
                      />
                      <span className="text-[8px] text-neutral-400 text-center leading-tight">
                        {new Date(day + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Répartition par région */}
            <div className="col-span-2 bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-4">Par région</p>
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
                        <div className="flex items-center gap-3 shrink-0">
                          {data.frpTotal > 0 && (
                            <span className="text-xs text-neutral-400">{Math.round(data.frpTotal)} MW</span>
                          )}
                          <span className="text-sm font-bold text-neutral-700">{data.count}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {autresCount > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-400">Autres régions</span>
                      <span className="text-sm font-bold text-neutral-400">{autresCount}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-neutral-300" style={{ width: `${Math.round((autresCount / points.length) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Source */}
            <div className="col-span-2 bg-neutral-100 rounded-3xl p-5 text-xs text-neutral-500 leading-relaxed">
              <p className="font-semibold text-neutral-700 mb-1">Source · NASA FIRMS</p>
              Satellite SUOMI NPP · capteur VIIRS · données publiques, sans clé API, mises à jour plusieurs fois par jour.
              FRP (Fire Radiative Power) mesure la puissance radiative en MW — non disponible pour tous les feux.
              Les zones nuageuses peuvent masquer des détections.
            </div>

            <Link
              href="/r"
              className="flex items-center justify-between bg-neutral-100 hover:bg-neutral-200 transition-colors rounded-3xl px-5 py-4 group"
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400 mb-0.5">Explorer</p>
                <p className="text-sm font-black text-neutral-900">Toutes les régions</p>
              </div>
              <span className="text-neutral-400 group-hover:text-neutral-700 text-xl transition-colors">&rarr;</span>
            </Link>

            <Link
              href="/alertes"
              className="flex items-center justify-between bg-neutral-100 hover:bg-neutral-200 transition-colors rounded-3xl px-5 py-4 group"
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400 mb-0.5">Alertes</p>
                <p className="text-sm font-black text-neutral-900">Canicule &amp; chaleur</p>
              </div>
              <span className="text-neutral-400 group-hover:text-neutral-700 text-xl transition-colors">&rarr;</span>
            </Link>

            <PageFooter className="col-span-2" />
          </div>
        </div>

      </div>
    </div>
  )
}
