"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { slugify } from "@/lib/slugify"

interface City {
  id: string
  name: string
  lat: number
  lon: number
  region: string
  apparent_temp_max: number
  anomaly: number | null
}

interface Props {
  cities: City[]
}

function tempColor(temp: number): string {
  if (temp < 15) return "#60a5fa"
  if (temp < 20) return "#93c5fd"
  if (temp < 25) return "#fde68a"
  if (temp < 30) return "#fb923c"
  if (temp < 35) return "#ef4444"
  if (temp < 40) return "#b91c1c"
  return "#7f1d1d"
}

export default function FranceCitiesMap({ cities }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    let map: import("leaflet").Map | null = null

    import("leaflet").then((L) => {
      if (!containerRef.current) return

      const isMobile = window.matchMedia("(max-width: 768px)").matches

      map = L.map(containerRef.current!, {
        center: [46.5, 2.5],
        zoom: isMobile ? 5 : 6,
        zoomControl: false,
        scrollWheelZoom: !isMobile,
        attributionControl: false,
      })

      setTimeout(() => map?.invalidateSize(), 100)

      L.control.zoom({ position: "bottomright" }).addTo(map)

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      cities.forEach((city) => {
        const color = tempColor(city.apparent_temp_max)
        const anomalyStr = city.anomaly !== null
          ? `<br><span style="color:${city.anomaly > 0 ? "#ea580c" : "#2563eb"}">${city.anomaly > 0 ? "+" : ""}${city.anomaly.toFixed(1)}°C vs normale</span>`
          : ""

        // Glow blob
        L.circleMarker([city.lat, city.lon], {
          radius: isMobile ? 26 : 36,
          fillColor: color,
          color: "transparent",
          weight: 0,
          fillOpacity: 0.13,
          interactive: false,
        }).addTo(map!)

        // Dot
        L.circleMarker([city.lat, city.lon], {
          radius: isMobile ? 9 : 11,
          fillColor: color,
          color: "rgba(0,0,0,0.2)",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .addTo(map!)
          .bindTooltip(
            `<strong>${city.name}</strong><br>Ressenti max : <strong>${city.apparent_temp_max}°C</strong>${anomalyStr}`,
            { direction: "top", className: "leaflet-tooltip-clean" }
          )
          .on("click", () => router.push(`/a/${slugify(city.name)}`))
      })
    })

    return () => {
      map?.remove()
    }
  }, [cities, router])

  return <div ref={containerRef} className="w-full h-full" />
}
