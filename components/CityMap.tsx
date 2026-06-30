"use client"

import { useEffect, useRef } from "react"
import type { Map as LeafletMap } from "leaflet"
import "leaflet/dist/leaflet.css"

interface Props {
  lat: number
  lon: number
  name: string
}

export default function CityMap({ lat, lon, name }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current!, {
        center: [lat, lon],
        zoom: 13,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        keyboard: false,
      })

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map)

      L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: "#ef4444",
        color: "#fff",
        weight: 2.5,
        opacity: 1,
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip(name, { permanent: true, direction: "top", offset: [0, -10], className: "city-map-tooltip" })
        .openTooltip()

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lon, name]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="w-full h-full" />
}
