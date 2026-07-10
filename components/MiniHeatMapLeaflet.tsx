"use client"

import { useEffect, useRef } from "react"
import type { Map as LeafletMap } from "leaflet"

interface City {
  id: string
  name: string
  lat: number
  lon: number
  apparent_temp_max: number
  anomaly: number | null
}

interface Props {
  cities: City[]
}

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

export default function MiniHeatMapLeaflet({ cities }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        center: [46.5, 2.5],
        zoom: 5,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        keyboard: false,
        touchZoom: false,
        attributionControl: false,
      })

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map)

      cities.forEach((city) => {
        const color = anomalyColor(city.anomaly)
        L.circleMarker([city.lat, city.lon], {
          radius: 7,
          fillColor: color,
          color: "#fff",
          weight: 1.5,
          fillOpacity: 0.92,
        })
          .bindTooltip(`${city.name} · ${city.apparent_temp_max}°C${city.anomaly !== null ? ` (${city.anomaly > 0 ? "+" : ""}${city.anomaly.toFixed(1)}°C)` : ""}`, {
            direction: "top",
            offset: [0, -6],
          })
          .addTo(map)
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [cities])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: 260 }}
    />
  )
}
