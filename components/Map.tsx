"use client"

import { useEffect, useRef } from "react"
import type { Map as LeafletMap, Polyline, CircleMarker } from "leaflet"
import "leaflet/dist/leaflet.css"

type MarkerMap = globalThis.Map<string, CircleMarker>
import { CityFR, CityWorld } from "@/lib/types"
import { getWeather } from "@/lib/weather-codes"

interface Props {
  citiesFR: CityFR[]
  citiesWorld: CityWorld[]
  selectedId: string | null
  twinIds: string[]
  onCityClick: (id: string, type: "fr" | "world") => void
}

export default function Map({ citiesFR, citiesWorld, selectedId, twinIds, onCityClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const linesRef = useRef<Polyline[]>([])
  const markersRef = useRef<MarkerMap>(new globalThis.Map<string, CircleMarker>())

  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(containerRef.current!, {
        center: [30, 10],
        zoom: 3,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map

      citiesFR.forEach((city) => {
        const { emoji } = getWeather(city.weathercode)
        const marker = L.circleMarker([city.lat, city.lon], {
          radius: 7,
          fillColor: "#2563eb",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindTooltip(`<strong>${city.name}</strong><br>${emoji} ${city.apparent_temp_max}°C ressenti`, { direction: "top" })
          .on("click", () => onCityClick(city.id, "fr"))

        markersRef.current.set(city.id, marker)
      })

      citiesWorld.forEach((city) => {
        const { emoji } = getWeather(city.weathercode)
        const marker = L.circleMarker([city.lat, city.lon], {
          radius: 7,
          fillColor: "#059669",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindTooltip(`<strong>${city.name}</strong><br>${emoji} ${city.temp}°C<br><em>${city.climateLabel}</em>`, { direction: "top" })
          .on("click", () => onCityClick(city.id, "world"))

        markersRef.current.set(city.id, marker)
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return

    import("leaflet").then((L) => {
      linesRef.current.forEach((l) => l.remove())
      linesRef.current = []

      markersRef.current.forEach((marker, id) => {
        const isFR = citiesFR.some((c) => c.id === id)
        marker.setStyle({
          fillColor: isFR ? "#2563eb" : "#059669",
          radius: 7,
          fillOpacity: 0.9,
        })
      })

      if (!selectedId) return

      const selectedCityFR = citiesFR.find((c) => c.id === selectedId)
      const selectedCityWorld = citiesWorld.find((c) => c.id === selectedId)
      const selected = selectedCityFR ?? selectedCityWorld
      if (!selected) return

      const selectedMarker = markersRef.current.get(selectedId)
      if (selectedMarker) {
        selectedMarker.setStyle({ fillColor: "#f59e0b", radius: 10, fillOpacity: 1 })
      }

      twinIds.forEach((twinId) => {
        const twin = citiesFR.find((c) => c.id === twinId) ?? citiesWorld.find((c) => c.id === twinId)
        if (!twin) return

        const line = L.polyline(
          [[selected.lat, selected.lon], [twin.lat, twin.lon]],
          { color: "#f59e0b", weight: 2, opacity: 0.8, dashArray: "6 4" }
        ).addTo(mapRef.current!)
        linesRef.current.push(line)

        const twinMarker = markersRef.current.get(twinId)
        if (twinMarker) {
          twinMarker.setStyle({ fillColor: "#f59e0b", radius: 9, fillOpacity: 1 })
        }
      })

      mapRef.current?.panTo([selected.lat, selected.lon], { animate: true, duration: 0.5 })
    })
  }, [selectedId, twinIds, citiesFR, citiesWorld])

  return <div ref={containerRef} className="w-full h-full" />
}
