"use client"

import { useRef, useState, useCallback } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import Card from "@/components/ui/Card"
import Stat from "@/components/ui/Stat"
import Eyebrow from "@/components/ui/Eyebrow"
import Num from "@/components/ui/Num"
import { fmt } from "@/lib/format"
import { cn } from "@/lib/cn"
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
    <div className="flex h-full w-full items-center justify-center bg-paper-deep">
      <span className="text-[15px] text-mute">Chargement de la carte…</span>
    </div>
  ),
})

const BAR_MAX_PX = 96

function shortDate(day: string) {
  return new Date(day + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" })
}

function aqiLabel(aqi: number): { label: string; color: string; bg: string } {
  if (aqi <= 20) return { label: "Bon", color: "#166534", bg: "#dcfce7" }
  if (aqi <= 40) return { label: "Acceptable", color: "#3f6212", bg: "#ecfccb" }
  if (aqi <= 60) return { label: "Modéré", color: "#92400e", bg: "#fef3c7" }
  if (aqi <= 80) return { label: "Mauvais", color: "#9a3412", bg: "#ffedd5" }
  if (aqi <= 100) return { label: "Très mauvais", color: "#991b1b", bg: "#fee2e2" }
  return { label: "Dangereux", color: "#5b21b6", bg: "#ede9fe" }
}

function windDirLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
  return dirs[Math.round(deg / 45) % 8]
}

const toggleCls = (on: boolean) => cn(
  "min-h-11 rounded-full border-2 px-4 font-display text-[14px] font-bold transition-colors",
  on ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink",
)

export default function FirePageClient({
  geojson, cities, totalCount, highConf, hasFrp, maxFrp,
  peakDay, peakCount, days, byDay, regionRanking, autresCount, zoneWeather, clusters,
}: Props) {
  const flyToRef = useRef<((lat: number, lon: number, zoom?: number) => void) | null>(null)
  const [filter, setFilter] = useState<"all" | "confirmed">("all")
  // La carte ne capte pas le doigt tant qu'on ne l'a pas activée : le défilement de la page reste libre.
  const [active, setActive] = useState(false)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [locating, setLocating] = useState(false)

  const maxDayCount = Math.max(...Object.values(byDay), 1)
  const highPct = totalCount > 0 ? Math.round((highConf / totalCount) * 100) : 0
  const notable = clusters.filter((c) => c.isMajor || c.isPermanent || c.isIndustrial)

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
      if (!data.length) { setSearchError("Adresse introuvable en France."); return }
      flyToRef.current?.(parseFloat(data[0].lat), parseFloat(data[0].lon), 11)
      setSearch("")
    } catch {
      setSearchError("La recherche n'a pas abouti. Réessayez.")
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
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* ── Carte ── */}
        <section aria-label="Carte des anomalies thermiques" className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les détections">
            <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={toggleCls(filter === "all")}>
              Toutes les détections · {totalCount}
            </button>
            <button type="button" onClick={() => setFilter("confirmed")} aria-pressed={filter === "confirmed"} className={toggleCls(filter === "confirmed")}>
              Haute confiance · {highConf}
            </button>
          </div>
          <p className="text-[13px] text-mute">« Haute confiance » : un signal très intense. Le capteur est sûr qu&apos;il fait très chaud, pas que c&apos;est un incendie.</p>

          <div className="relative h-[min(78vh,560px)] min-h-[380px] overflow-hidden rounded-[var(--radius-card)] bg-paper-deep lg:h-[600px]">
            <FireMap geojson={geojson} cities={cities} flyToRef={flyToRef} filter={filter} clusters={clusters} interactive={active} />
            <p className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-full bg-white/90 px-3 py-1 font-mono text-[12px] font-semibold text-ink">
              7 jours · {totalCount} détections
            </p>
            <button
              type="button"
              onClick={() => setActive((a) => !a)}
              aria-pressed={active}
              className={cn(
                "absolute bottom-3 left-3 z-[1000] inline-flex min-h-11 items-center rounded-full px-4 font-display text-[14px] font-bold shadow-md",
                active ? "bg-white text-ink" : "bg-ink text-paper",
              )}
            >
              {active ? "Figer la carte" : "Activer la carte"}
            </button>
          </div>
          <p className="text-[13px] text-mute">Zoomez avec les boutons + et −. Activez la carte pour la déplacer au doigt. Les points individuels apparaissent en zoomant.</p>

          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="fire-search" className="sr-only">Aller à une adresse</label>
            <input
              id="fire-search"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchError("") }}
              placeholder="Adresse, ville, département…"
              className="min-h-11 min-w-0 flex-1 rounded-full border-2 border-line bg-white px-4 text-[15px] placeholder:text-mute focus:border-ink focus:outline-none"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={searching || !search.trim()} className={cn(toggleCls(true), "disabled:opacity-50")}>
                {searching ? "Recherche…" : "Aller"}
              </button>
              <button type="button" onClick={geolocate} disabled={locating} className={cn(toggleCls(false), "disabled:opacity-50")}>
                {locating ? "Localisation…" : "Ma position"}
              </button>
            </div>
          </form>
          {searchError && <p role="alert" className="text-[13px] font-semibold text-chaud-deep">{searchError}</p>}
        </section>

        {/* ── Chiffres ── */}
        <section aria-label="Les chiffres de la semaine" className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Card tone="ink">
            <Stat invert label="Détections" value={<Num value={totalCount} />} sub="anomalies thermiques en 7 jours, toutes confiances" explain="firms" />
          </Card>
          <Card tone="chaud">
            <Stat invert label="Haute confiance" value={<Num value={highConf} />} sub={`${highPct} % des détections : signal très intense`} />
          </Card>
          <Card tone="white">
            <Stat label="Pic journalier" value={<Num value={peakCount} />} sub={peakDay ? `le ${shortDate(peakDay)}` : "–"} />
          </Card>
          <Card tone="white">
            {hasFrp ? (
              <Stat label="Signal le plus intense" value={<><Num value={maxFrp} decimals={maxFrp < 10 ? 1 : 0} /><span className="text-[0.45em]">&#8239;MW</span></>} sub="puissance rayonnée. Un feu de forêt actif dépasse souvent 100 MW ; une torchère aussi." />
            ) : (
              <Stat label="Intensité" value={<span className="text-[0.6em]">Faible</span>} sub="trop faible pour que le satellite mesure la puissance rayonnée" />
            )}
          </Card>
          {zoneWeather.aqi !== null && (() => {
            const { label, color, bg } = aqiLabel(zoneWeather.aqi)
            return (
              <Card tone="white" className="flex flex-col gap-2">
                <Eyebrow>Air au centre des détections</Eyebrow>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2.5 py-0.5 text-[13px] font-bold" style={{ color, background: bg }}>{label}</span>
                  <span className="font-display text-2xl font-extrabold">{zoneWeather.aqi}</span>
                  <span className="text-[13px] text-mute">indice européen</span>
                </p>
                {zoneWeather.pm25 !== null && <p className="text-[13px] text-ink-soft">Particules fines PM2,5 : <strong>{fmt(zoneWeather.pm25, 0)}&#8239;µg/m³</strong></p>}
              </Card>
            )
          })()}
          {zoneWeather.windSpeed !== null && zoneWeather.windDir !== null && (
            <Card tone="white" className="flex flex-col gap-2">
              <Eyebrow>Vent au centre des détections</Eyebrow>
              <p className="flex items-center gap-3">
                <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" style={{ transform: `rotate(${zoneWeather.windDir}deg)` }}>
                  <polygon points="16,2 20,26 16,22 12,26" fill="var(--color-chaud)" />
                </svg>
                <span className="font-display text-2xl font-extrabold">{fmt(zoneWeather.windSpeed, 0)}&#8239;km/h</span>
                <span className="text-[13px] text-mute">du {windDirLabel(zoneWeather.windDir)}</span>
              </p>
            </Card>
          )}
        </section>
      </div>

      {/* ── Par jour : valeurs toujours visibles ── */}
      <Card tone="white" as="section" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[1.35rem] font-bold leading-tight">Jour par jour</h2>
          <p className="text-[15px] text-ink-soft">Un pic peut venir d&apos;un épisode sec et venteux, ou juste d&apos;un ciel dégagé ce jour-là.</p>
        </div>
        <ol className="flex items-end gap-1.5 sm:gap-3" aria-label="Détections par jour">
          {days.map((day) => {
            const count = byDay[day] ?? 0
            const isPeak = day === peakDay
            return (
              <li key={day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className={cn("font-mono text-[13px] font-semibold tabular", isPeak ? "text-chaud-deep" : "text-ink")}>{count}</span>
                <span
                  aria-hidden="true"
                  className={cn("w-full rounded-t-md", isPeak ? "bg-chaud" : "bg-ink/25")}
                  style={{ height: Math.max(Math.round((count / maxDayCount) * BAR_MAX_PX), 3) }}
                />
                <span className="text-center text-[12px] leading-tight text-mute">{shortDate(day)}</span>
              </li>
            )
          })}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Par région ── */}
        <Card tone="white" as="section" className="flex flex-col gap-4">
          <h2 className="font-display text-[1.35rem] font-bold leading-tight">Par région</h2>
          <ul className="flex flex-col gap-3">
            {regionRanking.map(({ key, label, slug, count, frpTotal }) => (
              <li key={key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/r/${slug}`} className="min-w-0 truncate font-display text-[16px] font-bold hover:underline">{label}</Link>
                  <span className="shrink-0 font-mono text-[14px] tabular">
                    {frpTotal > 0 && <span className="text-mute">{fmt(frpTotal, 0)}&#8239;MW · </span>}<strong>{count}</strong>
                  </span>
                </div>
                <span className="h-2 overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
                  <span className="block h-full rounded-full bg-chaud" style={{ width: `${Math.round((count / totalCount) * 100)}%` }} />
                </span>
              </li>
            ))}
            {autresCount > 0 && (
              <li className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3 text-mute">
                  <span className="font-display text-[16px] font-bold">Autres régions</span>
                  <strong className="font-mono text-[14px] tabular">{autresCount}</strong>
                </div>
                <span className="h-2 overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
                  <span className="block h-full rounded-full bg-ink/30" style={{ width: `${Math.round((autresCount / totalCount) * 100)}%` }} />
                </span>
              </li>
            )}
          </ul>
          <p className="text-[13px] text-mute">MW : somme des puissances mesurées par le satellite dans la région.</p>
        </Card>

        {/* ── Foyers groupés ── */}
        <Card tone="white" as="section" className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-[1.35rem] font-bold leading-tight">Foyers groupés</h2>
              <p className="text-[15px] text-ink-soft">Plusieurs points à moins de 5&#8239;km. Actifs 5 jours sur 7 : source permanente, probablement industrielle.</p>
            </div>
            <span className="font-display text-4xl font-extrabold tabular">{clusters.filter((c) => c.isMajor).length}</span>
          </div>
          {notable.length === 0 ? (
            <p className="text-[15px] text-mute">Aucun regroupement notable cette semaine : les points sont isolés.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {notable.map((c, i) => {
                const tag = c.isIndustrial ? { label: "Zone industrielle", cls: "bg-paper-deep" }
                  : c.isPermanent ? { label: "Source permanente", cls: "bg-hl-signal" }
                  : { label: "Foyer actif", cls: "bg-hl-chaud" }
                return (
                  <li key={i} className={cn("flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl px-3 py-2 text-[13px]", tag.cls)}>
                    <span><strong>{tag.label}</strong> · {c.count} détections · {c.highConf} à haute confiance</span>
                    <span className="text-ink-soft">{c.dateFirst === c.dateLast ? shortDate(c.dateFirst) : `${shortDate(c.dateFirst)} → ${shortDate(c.dateLast)}`}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
