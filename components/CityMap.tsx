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
    if (!containerRef.current || mapRef.current) return

    const L = require("leaflet")

    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 13,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 }
    ).addTo(map)

    L.circleMarker([lat, lon], {
      radius: 8,
      fillColor: "#ef4444",
      color: "#fff",
      weight: 2,
      fillOpacity: 0.9,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lat, lon, name])

  return <div ref={containerRef} className="w-full h-full" />
}
