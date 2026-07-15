"use client"

import { useEffect, useRef, useState } from "react"

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
  if (c === "high") return "haute"
  if (c === "nominal") return "nominale"
  if (c === "low") return "faible"
  return c
}

export default function FireMap({ geojson, cities = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)
  const [locating, setLocating] = useState(false)

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

        // Halo
        L.circleMarker([lat, lon], {
          radius: 14 + intensity * 18,
          fillColor: "#ef4444",
          color: "transparent",
          weight: 0,
          fillOpacity: 0.06 + intensity * 0.07,
          interactive: false,
        }).addTo(map)

        // Point
        const city = nearestCity(lat, lon, cities)
        const cityLine = city ? `<br><span style="color:#6b7280;font-size:10px">Proche de ${city.name} · ${city.region}</span>` : ""
        const frpLine = frp > 0 ? `<br>FRP : ${frp < 10 ? frp.toFixed(1) : Math.round(frp)} MW` : ""

        L.circleMarker([lat, lon], {
          radius: isHigh ? 5 : 3,
          fillColor: isHigh ? "#dc2626" : "#f97316",
          color: isHigh ? "#991b1b" : "#c2410c",
          weight: 1,
          fillOpacity: 0.85,
        })
          .addTo(map)
          .bindTooltip(
            `<strong>Feu actif · ${firedate}</strong>${cityLine}<br>Confiance : ${confLabel(confidence)}${frpLine}`,
            { direction: "top" }
          )
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
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 10, { duration: 1.2 })
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <button
        onClick={geolocate}
        disabled={locating}
        className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-white hover:text-orange-600 transition-all disabled:opacity-50 flex items-center gap-1.5"
        title="Centrer sur ma position"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          <circle cx="12" cy="12" r="8" strokeOpacity="0.3"/>
        </svg>
        {locating ? "Localisation…" : "Près de chez moi"}
      </button>
    </div>
  )
}
