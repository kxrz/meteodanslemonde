"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"
import CitySearch from "@/components/CitySearch"
import type { Map as LeafletMap, CircleMarker } from "leaflet"

interface CityWithAnomaly {
  id: string
  name: string
  lat: number
  lon: number
  region: string
  apparent_temp_max: number
  normal: number | null
  anomaly: number | null
}

interface Props {
  cities: CityWithAnomaly[]
  fetchedAt: string
  month: number
}

type SortKey = "anomaly" | "temp" | "name"

const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]

function anomalyColor(a: number | null): string {
  if (a === null) return "#94a3b8"
  if (a <= -6) return "#1d4ed8"
  if (a <= -3) return "#60a5fa"
  if (a <= 0)  return "#a5f3fc"
  if (a <= 3)  return "#fde68a"
  if (a <= 6)  return "#fb923c"
  if (a <= 10) return "#ef4444"
  return "#7f1d1d"
}

function anomalyLabel(a: number | null): string {
  if (a === null) return "Pas de normale disponible"
  if (a > 0) return `+${a.toFixed(1)}°C vs normale`
  return `${a.toFixed(1)}°C vs normale`
}

const LEGEND = [
  { label: "≤ −6°C", color: "#1d4ed8" },
  { label: "−3 à −6", color: "#60a5fa" },
  { label: "−3 à 0", color: "#a5f3fc" },
  { label: "0 à +3", color: "#fde68a" },
  { label: "+3 à +6", color: "#fb923c" },
  { label: "+6 à +10", color: "#ef4444" },
  { label: "> +10°C", color: "#7f1d1d" },
]

export default function HeatMapClient({ cities, fetchedAt, month }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<globalThis.Map<string, CircleMarker>>(new globalThis.Map())
  const [selectedCity, setSelectedCity] = useState<CityWithAnomaly | null>(null)
  const [shareState, setShareState] = useState<"idle" | "copied">("idle")
  const [sortKey, setSortKey] = useState<SortKey>("anomaly")

  const dateStr = new Date(fetchedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  function buildTop3Text(cities: CityWithAnomaly[], month: number): string {
    const top3 = [...cities]
      .filter(c => c.anomaly !== null && c.anomaly > 0)
      .sort((a, b) => (b.anomaly ?? 0) - (a.anomaly ?? 0))
      .slice(0, 3)
    const lines = top3.map((c, i) => {
      const sign = (c.anomaly ?? 0) > 0 ? "+" : ""
      return `${i + 1}. ${c.name} : ${sign}${c.anomaly?.toFixed(1)}°C (ressenti ${c.apparent_temp_max}°C)`
    })
    return `Anomalies de chaleur en France ce ${dateStr} :\n${lines.join("\n")}\n\nVersus la normale de ${MONTHS_FR[month]}. Données ERA5 / GIEC sur cestchaud.fr`
  }

  async function shareTop3() {
    const text = buildTop3Text(cities, month)
    if (navigator.share) {
      try {
        await navigator.share({ text, url: "https://cestchaud.fr/carte" })
      } catch {}
      return
    }
    await navigator.clipboard.writeText(text + "\nhttps://cestchaud.fr/carte")
    setShareState("copied")
    setTimeout(() => setShareState("idle"), 2500)
  }

  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return

      const isMobile = window.matchMedia("(max-width: 768px)").matches

      const map = L.map(containerRef.current!, {
        center: [46.5, 2.5],
        zoom: isMobile ? 5 : 6,
        zoomControl: false,
        scrollWheelZoom: !isMobile,
      })

      setTimeout(() => map.invalidateSize(), 100)

      L.control.zoom({ position: "bottomright" }).addTo(map)

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map

      cities.forEach((city) => {
        const color = anomalyColor(city.anomaly)
        const label = anomalyLabel(city.anomaly)

        // Glow blob
        L.circleMarker([city.lat, city.lon], {
          radius: isMobile ? 28 : 38,
          fillColor: color,
          color: "transparent",
          weight: 0,
          fillOpacity: 0.13,
          interactive: false,
        }).addTo(map)

        // Dot
        const marker = L.circleMarker([city.lat, city.lon], {
          radius: isMobile ? 10 : 13,
          fillColor: color,
          color: "rgba(0,0,0,0.15)",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindTooltip(
            `<strong>${city.name}</strong><br>Ressenti max : <strong>${city.apparent_temp_max}°C</strong><br>${label}`,
            { direction: "top", className: "leaflet-tooltip-clean" }
          )
          .on("click", () => setSelectedCity(city))

        markersRef.current.set(city.id, marker)
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === "undefined") return
    markersRef.current.forEach((marker, id) => {
      const city = cities.find(c => c.id === id)
      if (!city) return
      const isSelected = id === selectedCity?.id
      marker.setStyle({
        fillColor: anomalyColor(city.anomaly),
        color: isSelected ? "#000" : "rgba(0,0,0,0.15)",
        weight: isSelected ? 2.5 : 1,
        radius: isSelected ? 16 : 13,
      } as Parameters<typeof marker.setStyle>[0])
    })
  }, [selectedCity, cities])

  const sorted = [...cities].sort((a, b) => {
    if (sortKey === "anomaly") return (b.anomaly ?? -99) - (a.anomaly ?? -99)
    if (sortKey === "temp") return b.apparent_temp_max - a.apparent_temp_max
    return a.name.localeCompare(b.name, "fr")
  })

  const SORT_LABELS: Record<SortKey, string> = {
    anomaly: "Anomalie",
    temp: "Température",
    name: "A–Z",
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-[#f5f4f0]">
      <SiteHeader asLink />
      <Breadcrumb crumbs={[{ label: "Carte de chaleur" }]} />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

        {/* Left panel — map */}
        <div className="h-[55vw] max-h-[400px] lg:max-h-none lg:h-auto lg:w-[55%] shrink-0 relative p-3 lg:p-4 lg:sticky lg:top-0 lg:h-[calc(100vh-80px)]">
          <div ref={containerRef} className="w-full h-full rounded-3xl overflow-hidden" />

          {/* Legend overlay */}
          <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-sm">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {LEGEND.map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-neutral-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 lg:overflow-y-auto p-3 lg:p-4 flex flex-col gap-3">

          {/* Header */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">
              Carte de chaleur · {dateStr}
            </p>
            <h1 className="text-2xl font-black text-neutral-900 leading-tight">
              Anomalies du {MONTHS_FR[month]}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Ressenti max du jour vs normale historique ERA5
            </p>
          </div>

          {/* Search */}
          <CitySearch
            cities={cities}
            placeholder="Chercher une ville…"
            variant="select"
            onSelect={(city) => {
              const found = cities.find((c) => c.id === city.id)
              if (found) {
                setSelectedCity(found)
                mapRef.current?.panTo([found.lat, found.lon])
                mapRef.current?.setZoom(8)
              }
            }}
          />

          {/* Selected city detail */}
          {selectedCity && (
            <div className="bg-white rounded-2xl p-4 border border-neutral-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{selectedCity.region}</p>
                  <p className="text-lg font-black text-neutral-900">{selectedCity.name}</p>
                </div>
                <button onClick={() => setSelectedCity(null)} className="text-neutral-300 hover:text-neutral-700 text-sm transition-colors">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-50 rounded-xl p-2.5">
                  <p className="text-[10px] text-neutral-400">Ressenti max</p>
                  <p className="text-2xl font-black mt-0.5" style={{ color: anomalyColor(selectedCity.anomaly) }}>
                    {selectedCity.apparent_temp_max}°C
                  </p>
                </div>
                <div className="bg-neutral-50 rounded-xl p-2.5">
                  <p className="text-[10px] text-neutral-400">Normale {MONTHS_FR[month]}</p>
                  <p className="text-2xl font-black text-neutral-700 mt-0.5">
                    {selectedCity.normal !== null ? `${selectedCity.normal}°C` : "N/A"}
                  </p>
                </div>
              </div>
              {selectedCity.anomaly !== null && (
                <p className={`mt-2.5 text-sm font-bold ${selectedCity.anomaly > 0 ? "text-orange-600" : "text-blue-600"}`}>
                  {selectedCity.anomaly > 0 ? "+" : ""}{selectedCity.anomaly.toFixed(1)}°C par rapport à la normale
                </p>
              )}
              <Link href={`/a/${selectedCity.id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors font-medium">
                Voir la fiche complète →
              </Link>
            </div>
          )}

          {/* Sort + city list */}
          <div className="bg-white rounded-3xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400">
                Classement · {cities.length} villes
              </p>
              <div className="flex gap-1">
                {(["anomaly", "temp", "name"] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setSortKey(k)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                      sortKey === k ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {SORT_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-0.5">
              {sorted.map((city, i) => (
                <button
                  key={city.id}
                  onClick={() => {
                    setSelectedCity(city)
                    mapRef.current?.panTo([city.lat, city.lon], { animate: true, duration: 0.4 })
                  }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    selectedCity?.id === city.id ? "bg-neutral-900 text-white" : "hover:bg-neutral-50 text-neutral-700"
                  }`}
                >
                  <span className="text-[10px] text-neutral-400 w-4 shrink-0">{i + 1}</span>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: anomalyColor(city.anomaly) }} />
                  <span className="flex-1 text-xs font-semibold truncate">{city.name}</span>
                  <span className="text-xs font-black shrink-0" style={{ color: anomalyColor(city.anomaly) }}>
                    {city.anomaly !== null ? `${city.anomaly > 0 ? "+" : ""}${city.anomaly.toFixed(1)}°` : "—"}
                  </span>
                  <span className={`text-xs shrink-0 ${selectedCity?.id === city.id ? "text-white/60" : "text-neutral-400"}`}>
                    {city.apparent_temp_max}°C
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Share */}
          <button
            onClick={shareTop3}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-700 text-white text-xs font-semibold px-4 py-3 rounded-2xl transition-colors"
          >
            {shareState === "copied" ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Texte copié !
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Partager le top 3 des anomalies
              </>
            )}
          </button>

          <PageFooter className="pb-2" />
        </div>
      </div>
    </div>
  )
}
