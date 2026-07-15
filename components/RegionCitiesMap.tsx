"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { slugify } from "@/lib/slugify"

interface City {
  id: string
  name: string
  lat: number
  lon: number
  normal: number | null
  trend: number | null
}

interface Props {
  cities: City[]
  showFires?: boolean
}

function trendColor(trend: number | null, normal: number | null): string {
  const ref = normal ?? 20
  if (ref < 15) return "#60a5fa"
  if (ref < 20) return "#93c5fd"
  if (ref < 25) return "#fde68a"
  if (ref < 30) return "#fb923c"
  if (ref < 35) return "#ef4444"
  return "#b91c1c"
}

export default function RegionCitiesMap({ cities, showFires = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || cities.length === 0) return

    let map: import("leaflet").Map | null = null

    const avgLat = cities.reduce((s, c) => s + c.lat, 0) / cities.length
    const avgLon = cities.reduce((s, c) => s + c.lon, 0) / cities.length

    const latRange = Math.max(...cities.map((c) => c.lat)) - Math.min(...cities.map((c) => c.lat))
    const lonRange = Math.max(...cities.map((c) => c.lon)) - Math.min(...cities.map((c) => c.lon))
    const spread = Math.max(latRange, lonRange)
    const zoom = spread < 1 ? 9 : spread < 2 ? 8 : spread < 4 ? 7 : 6

    import("leaflet").then((L) => {
      if (!containerRef.current) return

      const isMobile = window.matchMedia("(max-width: 768px)").matches

      map = L.map(containerRef.current!, {
        center: [avgLat, avgLon],
        zoom,
        zoomControl: false,
        scrollWheelZoom: !isMobile,
        attributionControl: false,
      })

      setTimeout(() => map?.invalidateSize(), 100)

      L.control.zoom({ position: "bottomright" }).addTo(map)

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      cities.forEach((city) => {
        const color = trendColor(city.trend, city.normal)

        L.circleMarker([city.lat, city.lon], {
          radius: isMobile ? 26 : 36,
          fillColor: color,
          color: "transparent",
          weight: 0,
          fillOpacity: 0.13,
          interactive: false,
        }).addTo(map!)

        const trendStr = city.trend !== null
          ? `<br><span style="color:${city.trend > 0 ? "#ea580c" : "#2563eb"}">${city.trend > 0 ? "+" : ""}${city.trend.toFixed(1)}°C tendance ERA5</span>`
          : ""

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
            `<strong>${city.name}</strong>${city.normal !== null ? `<br>Normale : ${city.normal.toFixed(1)}°C` : ""}${trendStr}`,
            { direction: "top", className: "leaflet-tooltip-clean" }
          )
          .on("click", () => router.push(`/a/${slugify(city.name)}`))
      })

      if (showFires) {
        fetch("/api/fires")
          .then(r => r.ok ? r.json() : null)
          .then(geojson => {
            if (!geojson || !map) return
            L.geoJSON(geojson, {
              style: (feature) => {
                if (feature?.properties?._type === "burned") {
                  return { color: "#ea580c", weight: 1.5, fillColor: "#f97316", fillOpacity: 0.35 }
                }
                return { color: "#dc2626", weight: 0, fillColor: "#dc2626", fillOpacity: 0 }
              },
              pointToLayer: (feature, latlng) => {
                if (feature?.properties?._type === "active") {
                  return L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: "#ef4444",
                    color: "#b91c1c",
                    weight: 1,
                    fillOpacity: 0.85,
                  })
                }
                return L.circleMarker(latlng, { radius: 0 })
              },
              onEachFeature: (feature, layer) => {
                const p = feature.properties ?? {}
                if (p._type === "burned") {
                  const ha = p.areaha ? `${Math.round(p.areaha)} ha brûlés` : ""
                  const date = p.firedate ? `· ${p.firedate}` : ""
                  layer.bindTooltip(`Feu détecté ${date}<br>${ha}`, { direction: "top" })
                } else if (p._type === "active") {
                  layer.bindTooltip(`Feu actif · ${p.firedate ?? ""}`, { direction: "top" })
                }
              },
            }).addTo(map!)
          })
          .catch(() => {})
      }
    })

    return () => {
      map?.remove()
    }
  }, [cities, router, showFires])

  return <div ref={containerRef} className="w-full h-full" />
}
