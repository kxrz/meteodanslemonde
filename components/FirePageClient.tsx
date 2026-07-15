"use client"

import { useRef, useState, useCallback } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import PageFooter from "@/components/PageFooter"

interface FireFeature {
  type: "Feature"
  geometry: { type: "Point"; coordinates: [number, number] }
  properties: { firedate: string; confidence: string; frp: number }
}

interface CityFR { id: string; name: string; lat: number; lon: number; region: string }

interface RegionStat { key: string; label: string; slug: string; count: number; frpTotal: number }

interface Props {
  geojson: { type: "FeatureCollection"; features: FireFeature[] }
  cities: CityFR[]
  totalCount: number
  highConf: number
  hasFrp: boolean
  maxFrp: number
  peakDay: string
  peakCount: number
  days: string[]
  byDay: Record<string, number>
  regionRanking: RegionStat[]
  autresCount: number
}

const FireMap = dynamic(() => import("@/components/FireMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-3xl">
      <span className="text-neutral-400 text-sm">Chargement de la carte…</span>
    </div>
  ),
})

const BAR_MAX_PX = 52

function frpLabel(frp: number) {
  if (frp <= 0) return null
  return frp < 10 ? `${frp.toFixed(1)} MW` : `${Math.round(frp)} MW`
}

export default function FirePageClient({
  geojson, cities, totalCount, highConf, hasFrp, maxFrp,
  peakDay, peakCount, days, byDay, regionRanking, autresCount,
}: Props) {
  const flyToRef = useRef<((lat: number, lon: number, zoom?: number) => void) | null>(null)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [locating, setLocating] = useState(false)

  const maxDayCount = Math.max(...Object.values(byDay), 1)

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    setSearchError("")
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1&countrycodes=fr`,
        { headers: { "Accept-Language": "fr" } }
      )
      const data = await res.json()
      if (!data.length) { setSearchError("Adresse introuvable en France"); return }
      flyToRef.current?.(parseFloat(data[0].lat), parseFloat(data[0].lon), 11)
      setSearch("")
    } catch {
      setSearchError("Erreur de recherche")
    } finally {
      setSearching(false)
    }
  }, [search])

  function geolocate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { flyToRef.current?.(pos.coords.latitude, pos.coords.longitude, 11); setLocating(false) },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  return (
    <div className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0">

      {/* Gauche : carte */}
      <div className="h-[55vw] max-h-[420px] lg:max-h-none lg:h-auto lg:w-[55%] shrink-0 relative p-3 lg:p-4">
        <div className="w-full h-full rounded-3xl overflow-hidden">
          <FireMap geojson={geojson} cities={cities} flyToRef={flyToRef} />
        </div>
        <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-orange-500 leading-none mb-0.5">NASA FIRMS · VIIRS</p>
          <p className="text-sm font-black text-neutral-900 leading-tight">Incendies en France</p>
        </div>
        <div className="absolute bottom-6 left-6 z-[1000]">
          <p className="font-mono text-[10px] text-neutral-500 bg-white/80 backdrop-blur-sm rounded px-2 py-1">
            7 jours · {totalCount} détections
          </p>
        </div>
      </div>

      {/* Droite : contrôles + stats */}
      <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto p-3 lg:p-4">
        <div className="grid grid-cols-2 gap-3 pb-4">

          {/* Recherche + géoloc */}
          <div className="col-span-2 bg-white rounded-3xl p-4 flex flex-col gap-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setSearchError("") }}
                placeholder="Adresse, ville, département…"
                className="flex-1 bg-neutral-100 rounded-xl px-3 py-2.5 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400 min-w-0"
              />
              <button
                type="submit"
                disabled={searching || !search.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-200 disabled:text-neutral-400 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shrink-0"
              >
                {searching ? "…" : "Aller"}
              </button>
            </form>
            <button
              onClick={geolocate}
              disabled={locating}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-orange-600 transition-colors disabled:opacity-50 px-1"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
              {locating ? "Localisation en cours…" : "Centrer sur ma position"}
            </button>
            {searchError && <p className="text-xs text-red-500 px-1">{searchError}</p>}
          </div>

          {/* KPIs */}
          <div className="bg-[#431407] rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-orange-300 font-semibold mb-1">Détections</p>
            <p className="text-4xl font-black text-white leading-none">{totalCount}</p>
            <p className="text-xs text-orange-200/70 mt-1">7 derniers jours</p>
          </div>

          <div className="bg-red-900 rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-red-200 font-semibold mb-1">Confiance haute</p>
            <p className="text-4xl font-black text-white leading-none">{highConf}</p>
            <p className="text-xs text-red-200/70 mt-1">{totalCount > 0 ? Math.round((highConf / totalCount) * 100) : 0}% des signaux</p>
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
            <p className="text-3xl font-black text-white leading-none">{peakCount}</p>
            <p className="text-xs text-orange-200/70 mt-1">
              le {peakDay ? new Date(peakDay + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "-"}
            </p>
          </div>

          {/* Activité par jour */}
          <div className="col-span-2 bg-white rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-4">
              Activité · {days.length} jour{days.length > 1 ? "s" : ""}
            </p>
            <div className="flex items-end gap-1.5" style={{ height: BAR_MAX_PX + 28 }}>
              {days.map(day => {
                const count = byDay[day] ?? 0
                const barPx = Math.max(Math.round((count / maxDayCount) * BAR_MAX_PX), 3)
                const isPeak = day === peakDay
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[9px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                    <div
                      className={`w-full rounded-sm ${isPeak ? "bg-red-500" : "bg-orange-300 hover:bg-orange-400"} transition-colors`}
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

          {/* Par région */}
          <div className="col-span-2 bg-white rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-4">Par région</p>
            <div className="space-y-3">
              {regionRanking.map(({ key, label, slug, count, frpTotal }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <Link href={`/r/${slug}`} className="text-sm font-semibold text-neutral-800 hover:text-orange-600 transition-colors">
                      {label}
                    </Link>
                    <div className="flex items-center gap-3 shrink-0">
                      {frpTotal > 0 && <span className="text-xs text-neutral-400">{Math.round(frpTotal)} MW</span>}
                      <span className="text-sm font-bold text-neutral-700">{count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                      style={{ width: `${Math.round((count / totalCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {autresCount > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-400">Autres régions</span>
                    <span className="text-sm font-bold text-neutral-400">{autresCount}</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-neutral-300" style={{ width: `${Math.round((autresCount / totalCount) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Source */}
          <div className="col-span-2 bg-neutral-100 rounded-3xl p-5 text-xs text-neutral-500 leading-relaxed">
            <p className="font-semibold text-neutral-700 mb-1">Source · NASA FIRMS</p>
            Satellite SUOMI NPP · capteur VIIRS · données publiques sans clé API.
            FRP (Fire Radiative Power) mesure la puissance radiative en MW. Les zones nuageuses peuvent masquer des détections.
          </div>

          <Link href="/r" className="flex items-center justify-between bg-neutral-100 hover:bg-neutral-200 transition-colors rounded-3xl px-5 py-4 group">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400 mb-0.5">Explorer</p>
              <p className="text-sm font-black text-neutral-900">Toutes les régions</p>
            </div>
            <span className="text-neutral-400 group-hover:text-neutral-700 text-xl transition-colors">&rarr;</span>
          </Link>

          <Link href="/alertes" className="flex items-center justify-between bg-neutral-100 hover:bg-neutral-200 transition-colors rounded-3xl px-5 py-4 group">
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
  )
}
