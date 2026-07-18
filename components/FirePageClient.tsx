"use client"

import { useRef, useState, useCallback } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import PageFooter from "@/components/PageFooter"
import type { FireZoneWeather, FireCluster } from "@/lib/fire-data"

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
  zoneWeather: FireZoneWeather
  clusters: FireCluster[]
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

function aqiLabel(aqi: number): { label: string; color: string; bg: string } {
  if (aqi <= 20) return { label: "Bon", color: "#16a34a", bg: "#dcfce7" }
  if (aqi <= 40) return { label: "Acceptable", color: "#65a30d", bg: "#ecfccb" }
  if (aqi <= 60) return { label: "Modéré", color: "#d97706", bg: "#fef3c7" }
  if (aqi <= 80) return { label: "Mauvais", color: "#ea580c", bg: "#ffedd5" }
  if (aqi <= 100) return { label: "Très mauvais", color: "#dc2626", bg: "#fee2e2" }
  return { label: "Dangereux", color: "#7c3aed", bg: "#ede9fe" }
}

function windDirLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
  return dirs[Math.round(deg / 45) % 8]
}

export default function FirePageClient({
  geojson, cities, totalCount, highConf, hasFrp, maxFrp,
  peakDay, peakCount, days, byDay, regionRanking, autresCount, zoneWeather, clusters,
}: Props) {
  const flyToRef = useRef<((lat: number, lon: number, zoom?: number) => void) | null>(null)
  const [filter, setFilter] = useState<"all" | "confirmed">("all")
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
          <FireMap geojson={geojson} cities={cities} flyToRef={flyToRef} filter={filter} clusters={clusters} />
        </div>
        <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-orange-500 leading-none mb-0.5">Satellite NASA · 7 jours</p>
          <p className="text-sm font-black text-neutral-900 leading-tight">Feux détectés en France</p>
          <p className="text-[10px] text-neutral-400 mt-1 leading-snug">Anomalies thermiques · sites industriels inclus</p>
        </div>
        <div className="absolute bottom-6 left-6 z-[1000]">
          <p className="font-mono text-[10px] text-neutral-500 bg-white/80 backdrop-blur-sm rounded px-2 py-1">
            7 jours · {totalCount} détections · nuages = angle mort
          </p>
        </div>
      </div>

      {/* Droite : contrôles + stats */}
      <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto p-3 lg:p-4">
        <div className="grid grid-cols-2 gap-3 pb-4">

          {/* Bloc transparence */}
          <div className="col-span-2 bg-neutral-900 text-white rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-3">Ce que cette carte peut et ne peut pas faire</p>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <span className="text-base shrink-0">📡</span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  <strong className="text-white">Source unique : satellite NASA FIRMS / VIIRS.</strong> Il n&apos;existe pas en France d&apos;API publique centralisant les déclarations officielles d&apos;incendies en temps réel. Les SDIS (pompiers) opèrent département par département, sans flux ouvert.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-base shrink-0">🧮</span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  <strong className="text-white">Interprétation mathématique, pas IA.</strong> Les foyers groupés sont calculés par un algorithme de clustering spatial (regroupement de points à moins de 5 km). Aucun modèle d&apos;intelligence artificielle n&apos;intervient dans l&apos;analyse.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-base shrink-0">⚠️</span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  <strong className="text-white">Limites à connaître.</strong> Sites industriels, écobuages et reflets solaires peuvent déclencher des détections. La couverture nuageuse crée des angles morts entre deux passages satellite (2 fois/jour). Cette carte est un outil pédagogique, pas un outil d&apos;alerte opérationnelle.
                </p>
              </div>
            </div>
          </div>

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

          {/* Filtre */}
          <div className="col-span-2 bg-white rounded-3xl p-4 flex flex-col gap-3">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Filtrez par niveau de certitude. <strong className="text-neutral-700">Toutes les détections</strong> inclut toutes les anomalies thermiques. <strong className="text-neutral-700">Feux confirmés</strong> ne garde que les foyers dont le signal est suffisamment intense pour lever le doute.
            </p>
            <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${filter === "all" ? "bg-orange-500 text-white" : "bg-white text-neutral-500 hover:bg-neutral-100"}`}
            >
              Toutes les détections
              <span className={`ml-2 text-xs font-normal ${filter === "all" ? "text-orange-200" : "text-neutral-400"}`}>{totalCount}</span>
            </button>
            <button
              onClick={() => setFilter("confirmed")}
              className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${filter === "confirmed" ? "bg-red-600 text-white" : "bg-white text-neutral-500 hover:bg-neutral-100"}`}
            >
              Feux confirmés
              <span className={`ml-2 text-xs font-normal ${filter === "confirmed" ? "text-red-200" : "text-neutral-400"}`}>{highConf}</span>
            </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="bg-[#431407] rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-orange-300 font-semibold mb-1">Détections</p>
            <p className="text-4xl font-black text-white leading-none">{totalCount}</p>
            <p className="text-xs text-orange-200/70 mt-1">7 derniers jours</p>
            <p className="text-[10px] text-orange-200/50 mt-2 leading-relaxed">Nombre total d&apos;anomalies thermiques repérées depuis l&apos;espace, toutes confiances confondues.</p>
          </div>

          <div className="bg-red-900 rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-red-200 font-semibold mb-1">Feux confirmés</p>
            <p className="text-4xl font-black text-white leading-none">{highConf}</p>
            <p className="text-xs text-red-200/70 mt-1">{totalCount > 0 ? Math.round((highConf / totalCount) * 100) : 0}% des détections</p>
            <p className="text-[10px] text-red-200/50 mt-2 leading-relaxed">Signal thermique très intense, peu de doute sur la nature du foyer.</p>
          </div>

          <div className="col-span-2 bg-white rounded-3xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Foyers significatifs · clustering satellite</p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Zones où plusieurs détections sont co-localisées sur ~5 km. Les <strong className="text-neutral-600">foyers majeurs</strong> (cercle rouge sur la carte) cumulent 8+ détections confirmées ou 20+ détections totales. Un site industriel persistant peut aussi apparaître.
                </p>
              </div>
              <span className="text-3xl font-black text-neutral-900 ml-4 shrink-0">{clusters.filter(c => c.isMajor).length}</span>
            </div>
            {clusters.filter(c => c.isMajor).length > 0 && (
              <div className="space-y-2">
                {clusters.filter(c => c.isMajor).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-red-50 rounded-xl px-3 py-2">
                    <span className="text-red-700 font-semibold">{c.count} détections · {c.highConf} confirmées</span>
                    <span className="text-neutral-400">{c.dateFirst === c.dateLast ? c.dateFirst : `${c.dateFirst} → ${c.dateLast}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasFrp ? (
            <div className="bg-amber-900 rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-amber-200 font-semibold mb-1">Feu le plus intense</p>
              <p className="text-3xl font-black text-white leading-none">{frpLabel(maxFrp)}</p>
              <p className="text-xs text-amber-200/70 mt-1">puissance rayonnée</p>
              <p className="text-[10px] text-amber-200/50 mt-2 leading-relaxed">La puissance en MW mesure l&apos;énergie thermique émise. Un grand incendie de forêt dépasse souvent 100 MW.</p>
            </div>
          ) : (
            <div className="bg-neutral-700 rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-1">Intensité</p>
              <p className="text-2xl font-black text-neutral-300 leading-none">Feux de surface</p>
              <p className="text-xs text-neutral-400 mt-1">en dessous du seuil de mesure</p>
              <p className="text-[10px] text-neutral-500 mt-2 leading-relaxed">Les feux détectés sont trop petits ou trop peu intenses pour que le satellite mesure leur puissance.</p>
            </div>
          )}

          <div className="bg-orange-900 rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-orange-200 font-semibold mb-1">Pic journalier</p>
            <p className="text-3xl font-black text-white leading-none">{peakCount}</p>
            <p className="text-xs text-orange-200/70 mt-1">
              le {peakDay ? new Date(peakDay + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "-"}
            </p>
            <p className="text-[10px] text-orange-200/50 mt-2 leading-relaxed">Jour où le satellite a enregistré le plus de foyers actifs simultanément.</p>
          </div>

          {/* Qualité de l'air */}
          {zoneWeather.aqi !== null ? (() => {
            const { label, color, bg } = aqiLabel(zoneWeather.aqi)
            return (
              <div className="bg-white rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-2">Air · zones feux</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color, background: bg }}>{label}</span>
                  <span className="text-xl font-black text-neutral-800">{zoneWeather.aqi}</span>
                  <span className="text-xs text-neutral-400">IQA européen</span>
                </div>
                {(zoneWeather.pm25 !== null || zoneWeather.pm10 !== null) && (
                  <div className="flex gap-4 text-xs text-neutral-500">
                    {zoneWeather.pm25 !== null && <span>PM2.5 <strong className="text-neutral-700">{zoneWeather.pm25.toFixed(0)} µg/m³</strong></span>}
                    {zoneWeather.pm10 !== null && <span>PM10 <strong className="text-neutral-700">{zoneWeather.pm10.toFixed(0)} µg/m³</strong></span>}
                  </div>
                )}
                <p className="text-[10px] text-neutral-400 mt-3 leading-relaxed">Les feux émettent des particules fines (PM2.5) dangereuses à respirer. Mesuré au centroïde des zones actives, modèle Copernicus CAMS.</p>
              </div>
            )
          })() : null}

          {/* Vent */}
          {zoneWeather.windSpeed !== null && zoneWeather.windDir !== null ? (
            <div className="bg-white rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-2">Vent · zones feux</p>
              <div className="flex items-center gap-3">
                <svg
                  width="32" height="32" viewBox="0 0 32 32"
                  style={{ transform: `rotate(${zoneWeather.windDir}deg)` }}
                >
                  <polygon points="16,2 20,26 16,22 12,26" fill="#f97316" />
                </svg>
                <div>
                  <p className="text-xl font-black text-neutral-800">{Math.round(zoneWeather.windSpeed)} <span className="text-sm font-normal text-neutral-500">km/h</span></p>
                  <p className="text-xs text-neutral-400">{windDirLabel(zoneWeather.windDir)}</p>
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 mt-3 leading-relaxed">La direction du vent détermine vers où se propagent les fumées et les braises. Un vent fort multiplie la vitesse de progression d&apos;un incendie.</p>
            </div>
          ) : null}

          {/* Activité par jour */}
          <div className="col-span-2 bg-white rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">
              Activité · {days.length} jour{days.length > 1 ? "s" : ""}
            </p>
            <p className="text-[10px] text-neutral-400 mb-4 leading-relaxed">Un pic peut refléter une vague de chaleur, un épisode de vent sec, ou simplement une meilleure couverture satellite ce jour-là. La barre rouge marque le jour le plus actif.</p>
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
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Par région</p>
            <p className="text-[10px] text-neutral-400 mb-4 leading-relaxed">Répartition géographique des foyers détectés. La barre indique la part de chaque région sur le total France. Le chiffre en MW est la somme des puissances mesurées, un indicateur de l&apos;ampleur globale des feux dans la zone.</p>
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

          {/* Bloc pédagogique */}
          <div className="col-span-2 bg-white rounded-3xl p-5 space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Pourquoi autant d&apos;écart entre détections et confirmés ?</p>

            <div className="flex gap-3">
              <span className="text-lg leading-none mt-0.5 shrink-0">🛰️</span>
              <div>
                <p className="text-sm font-semibold text-neutral-800 mb-0.5">Le satellite voit de la chaleur, pas un incendie</p>
                <p className="text-xs text-neutral-500 leading-relaxed">VIIRS repère toute anomalie thermique intense au sol à 375 m de résolution. Il ne distingue pas un feu de forêt d&apos;une torchère industrielle, d&apos;un four à chaux ou d&apos;un reflet solaire sur un toit métallique.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-lg leading-none mt-0.5 shrink-0">🏭</span>
              <div>
                <p className="text-sm font-semibold text-neutral-800 mb-0.5">Ce que les autres détections peuvent être</p>
                <p className="text-xs text-neutral-500 leading-relaxed">Sites industriels actifs, feux agricoles autorisés, écobuages en zone de montagne, compostage de grandes surfaces, ou simplement des pixels chauds par temps de canicule sur du béton. Tous passent le seuil de détection.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-lg leading-none mt-0.5 shrink-0">🔴</span>
              <div>
                <p className="text-sm font-semibold text-neutral-800 mb-0.5">Ce que "confirmé" veut dire</p>
                <p className="text-xs text-neutral-500 leading-relaxed">Un signal tellement intense et persistant que la probabilité d&apos;erreur est très faible. En été sec avec vent, c&apos;est quasiment la certitude d&apos;un foyer actif. NASA FIRMS attribue ce niveau après analyse multi-spectrale du pixel et de ses voisins.</p>
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 leading-relaxed border-t border-neutral-100 pt-3">
              Le satellite survole la France 2 fois par jour. Par temps nuageux, des feux peuvent passer inaperçus entre deux passages.
            </p>
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
