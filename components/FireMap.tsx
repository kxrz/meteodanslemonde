"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface FireFeature {
  type: "Feature"
  geometry: { type: "Point"; coordinates: [number, number] }
  properties: { firedate: string; confidence: string; frp: number }
}

interface CityFR {
  id: string; name: string; lat: number; lon: number; region: string
}

interface Props {
  geojson: { type: "FeatureCollection"; features: FireFeature[] }
  cities?: CityFR[]
}

function nearestCity(lat: number, lon: number, cities: CityFR[]): CityFR | null {
  if (!cities.length) return null
  let best: CityFR | null = null
  let bestDist = Infinity
  for (const c of cities) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2
    if (d < bestDist) { bestDist = d; best = c }
  }
  return best
}

function confLabel(c: string) {
  if (c === "high") return "Haute"
  if (c === "nominal") return "Nominale"
  if (c === "low") return "Faible"
  return c
}

function frpStr(frp: number) {
  if (frp <= 0) return null
  return frp < 10 ? `${frp.toFixed(1)} MW` : `${Math.round(frp)} MW`
}

export default function FireMap({ geojson, cities = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)
  const [locating, setLocating] = useState(false)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current!, {
        center: [46.5, 2.5],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
      })
      mapRef.current = map

      setTimeout(() => map.invalidateSize(), 100)

      L.control.zoom({ position: "bottomright" }).addTo(map)
      L.control.attribution({ prefix: false })
        .addTo(map)
        .addAttribution("&copy; OpenStreetMap &copy; CARTO · NASA FIRMS")

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      for (const f of geojson.features) {
        const [lon, lat] = f.geometry.coordinates
        const { frp, firedate, confidence } = f.properties
        const intensity = Math.min(frp > 0 ? frp / 80 : 0.15, 1)
        const isHigh = confidence === "high"

        // Halo semi-transparent
        L.circleMarker([lat, lon], {
          radius: 14 + intensity * 18,
          fillColor: "#ef4444",
          color: "transparent",
          weight: 0,
          fillOpacity: 0.06 + intensity * 0.07,
          interactive: false,
        }).addTo(map)

        const city = nearestCity(lat, lon, cities)
        const cityLine = city
          ? `<div style="color:#6b7280;font-size:11px;margin-top:2px">Proche de <strong>${city.name}</strong> · ${city.region}</div>`
          : ""
        const frpLine = frpStr(frp)
          ? `<div style="margin-top:4px"><span style="color:#9ca3af;font-size:10px">Puissance</span> <strong>${frpStr(frp)}</strong></div>`
          : ""

        // Tooltip léger au survol
        const tooltipContent = `<span style="font-size:11px">${firedate}${city ? ` · ${city.name}` : ""}</span>`

        // Popup détaillé au clic (avec croix Leaflet native)
        const popupContent = `
          <div style="font-size:13px;line-height:1.5;min-width:160px">
            <div style="font-weight:700;margin-bottom:4px">Feu actif · ${firedate}</div>
            ${cityLine}
            <div style="margin-top:6px;display:flex;gap:12px;flex-wrap:wrap">
              <div><span style="color:#9ca3af;font-size:10px;display:block">CONFIANCE</span><strong>${confLabel(confidence)}</strong></div>
              ${frpLine ? `<div><span style="color:#9ca3af;font-size:10px;display:block">FRP</span><strong>${frpStr(frp)}</strong></div>` : ""}
            </div>
            <div style="margin-top:6px;font-size:10px;color:#9ca3af">${lat.toFixed(3)}N · ${Math.abs(lon).toFixed(3)}${lon >= 0 ? "E" : "O"}</div>
          </div>
        `

        L.circleMarker([lat, lon], {
          radius: isHigh ? 5 : 3,
          fillColor: isHigh ? "#dc2626" : "#f97316",
          color: isHigh ? "#991b1b" : "#c2410c",
          weight: 1,
          fillOpacity: 0.85,
        })
          .addTo(map)
          .bindTooltip(tooltipContent, { direction: "top", className: "leaflet-tooltip-clean" })
          .bindPopup(popupContent, { maxWidth: 240, className: "fire-popup" })
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [geojson, cities])

  function geolocate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 11, { duration: 1.2 })
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    setSearchError("")
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1&countrycodes=fr`
      const res = await fetch(url, { headers: { "Accept-Language": "fr" } })
      const data = await res.json()
      if (data.length === 0) {
        setSearchError("Adresse introuvable")
        return
      }
      const { lat, lon } = data[0]
      mapRef.current?.flyTo([parseFloat(lat), parseFloat(lon)], 11, { duration: 1.2 })
    } catch {
      setSearchError("Erreur de recherche")
    } finally {
      setSearching(false)
    }
  }, [search])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Barre de recherche + géoloc */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2">
        <form onSubmit={handleSearch} className="flex flex-1 gap-1.5">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSearchError("") }}
            placeholder="Adresse, ville, département…"
            className="flex-1 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-neutral-700 shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400 min-w-0"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-white hover:text-orange-600 transition-all disabled:opacity-50 shrink-0"
          >
            {searching ? "…" : "Aller"}
          </button>
        </form>

        <button
          onClick={geolocate}
          disabled={locating}
          title="Près de chez moi"
          className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-white hover:text-orange-600 transition-all disabled:opacity-50 shrink-0 flex items-center gap-1"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
          {locating ? "…" : "Moi"}
        </button>
      </div>

      {/* Erreur de recherche */}
      {searchError && (
        <div className="absolute top-14 left-3 z-[1000] bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs text-red-600 shadow-sm">
          {searchError}
        </div>
      )}
    </div>
  )
}
