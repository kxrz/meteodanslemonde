"use client"

import { useEffect, useRef } from "react"

interface FireFeature {
  type: "Feature"
  geometry: { type: "Point"; coordinates: [number, number] }
  properties: { firedate: string; confidence: string; frp: number }
}

interface Props {
  geojson: { type: "FeatureCollection"; features: FireFeature[] }
}

export default function FireMap({ geojson }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    let map: import("leaflet").Map | null = null

    import("leaflet").then((L) => {
      if (!containerRef.current) return

      map = L.map(containerRef.current!, {
        center: [46.5, 2.5],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
      })

      setTimeout(() => map?.invalidateSize(), 100)

      L.control.zoom({ position: "bottomright" }).addTo(map)
      L.control.attribution({ prefix: false }).addTo(map).addAttribution("&copy; OpenStreetMap &copy; CARTO · NASA FIRMS")

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      // Heatmap : grands cercles semi-transparents pondérés par FRP
      for (const f of geojson.features) {
        const [lon, lat] = f.geometry.coordinates
        const { frp, firedate, confidence } = f.properties
        const intensity = Math.min(frp / 80, 1)

        // Halo large pour l'effet densité
        L.circleMarker([lat, lon], {
          radius: 14 + intensity * 18,
          fillColor: "#ef4444",
          color: "transparent",
          weight: 0,
          fillOpacity: 0.07 + intensity * 0.06,
          interactive: false,
        }).addTo(map!)

        // Point central cliquable
        L.circleMarker([lat, lon], {
          radius: confidence === "high" ? 5 : 3,
          fillColor: confidence === "high" ? "#dc2626" : "#f97316",
          color: confidence === "high" ? "#991b1b" : "#c2410c",
          weight: 1,
          fillOpacity: 0.85,
        })
          .addTo(map!)
          .bindTooltip(
            `<strong>Feu actif</strong><br>` +
            `${firedate}<br>` +
            `Confiance : ${confidence === "high" ? "haute" : confidence === "nominal" ? "nominale" : "faible"}<br>` +
            `FRP : ${frp > 0 ? `${frp.toFixed(1)} MW` : "n/d"}`,
            { direction: "top" }
          )
      }
    })

    return () => {
      map?.remove()
    }
  }, [geojson])

  return <div ref={containerRef} className="w-full h-full" />
}
