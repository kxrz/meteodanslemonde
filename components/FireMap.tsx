"use client"

import { useEffect, useRef } from "react"

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
  flyToRef?: React.MutableRefObject<((lat: number, lon: number, zoom?: number) => void) | null>
}

const MAX_CITY_DIST_DEG2 = 0.15 * 0.15 + 0.15 * 0.15 // ~15 km rayon

function nearestCity(lat: number, lon: number, cities: CityFR[]): CityFR | null {
  if (!cities.length) return null
  let best: CityFR | null = null
  let bestDist = MAX_CITY_DIST_DEG2
  for (const c of cities) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2
    if (d < bestDist) { bestDist = d; best = c }
  }
  return best
}

const CONF_LABEL: Record<string, string> = { high: "Confirmé", nominal: "Probable", low: "Signal faible" }
const CONF_COLOR: Record<string, string> = { high: "#dc2626", nominal: "#f97316", low: "#fbbf24" }
const CONF_DESC: Record<string, string> = {
  high: "détection fiable, feu actif",
  nominal: "détection probable, à surveiller",
  low: "signal incertain, peut-être un feu",
}

export default function FireMap({ geojson, cities = [], flyToRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)

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

      if (flyToRef) {
        flyToRef.current = (lat, lon, zoom = 11) => map.flyTo([lat, lon], zoom, { duration: 1.2 })
      }

      setTimeout(() => map.invalidateSize(), 100)
      L.control.zoom({ position: "bottomright" }).addTo(map)
      L.control.attribution({ prefix: false }).addTo(map).addAttribution("&copy; CARTO · NASA FIRMS")

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
      }).addTo(map)

      for (const f of geojson.features) {
        const [lon, lat] = f.geometry.coordinates
        const { frp, firedate, confidence } = f.properties
        const intensity = Math.min(frp > 0 ? frp / 20 : 0.1, 1)
        const isHigh = confidence === "high"
        const city = nearestCity(lat, lon, cities)
        const color = CONF_COLOR[confidence] ?? "#f97316"

        // Halo
        L.circleMarker([lat, lon], {
          radius: 10 + intensity * 14,
          fillColor: color,
          color: "transparent",
          weight: 0,
          fillOpacity: 0.08 + intensity * 0.08,
          interactive: false,
        }).addTo(map)

        // Tooltip survol — ultra minimaliste
        const tooltipHtml = city
          ? `<span class="fire-tip-city">${city.name}</span> <span class="fire-tip-date">${firedate}</span>`
          : `<span class="fire-tip-date">${firedate}</span>`

        // Popup clic — localisation par reverse geocoding au clic
        const label = CONF_LABEL[confidence] ?? confidence
        const desc = CONF_DESC[confidence] ?? ""
        const frpLine = frp > 0
          ? `<div class="fire-pop-row"><span>Intensité</span><strong>${frp < 10 ? frp.toFixed(1) : Math.round(frp)} MW</strong></div>`
          : ""

        function buildPopupHtml(locationLine: string) {
          return `
            <div class="fire-pop">
              <div class="fire-pop-title">Feu détecté par satellite</div>
              ${locationLine}
              <div class="fire-pop-row"><span>Détecté le</span><strong>${firedate}</strong></div>
              <div class="fire-pop-row fire-pop-badge-row">
                <span class="fire-pop-badge" style="background:${color}22;color:${color}">${label}</span>
                <span class="fire-pop-badge-desc">${desc}</span>
              </div>
              ${frpLine}
            </div>`
        }

        const initialLocationLine = city
          ? `<div class="fire-pop-sub">${city.name} · ${city.region}</div>`
          : `<div class="fire-pop-sub fire-pop-locating">Localisation…</div>`

        const marker = L.circleMarker([lat, lon], {
          radius: isHigh ? 5 : 3,
          fillColor: color,
          color: "#0000001a",
          weight: 1,
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindTooltip(tooltipHtml, { direction: "top", className: "fire-tooltip" })
          .bindPopup(buildPopupHtml(initialLocationLine), { maxWidth: 220, className: "fire-popup" })

        if (!city) {
          marker.on("popupopen", () => {
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=fr`,
              { headers: { "Accept-Language": "fr" } }
            )
              .then(r => r.json())
              .then(data => {
                const addr = data.address ?? {}
                const commune = addr.village ?? addr.town ?? addr.city ?? addr.municipality ?? ""
                const dept = addr.county ?? addr.state ?? ""
                const locationLine = commune
                  ? `<div class="fire-pop-sub">${commune}${dept ? ` · ${dept}` : ""}</div>`
                  : `<div class="fire-pop-sub">${dept || "Zone forestière"}</div>`
                const popup = marker.getPopup()
                if (popup?.isOpen()) {
                  popup.setContent(buildPopupHtml(locationLine))
                  // update tooltip too
                  marker.setTooltipContent(
                    `<span class="fire-tip-city">${commune || dept || "Feu"}</span> <span class="fire-tip-date">${firedate}</span>`
                  )
                }
              })
              .catch(() => {
                const popup = marker.getPopup()
                if (popup?.isOpen()) {
                  popup.setContent(buildPopupHtml(`<div class="fire-pop-sub">Zone forestière</div>`))
                }
              })
          })
        }
      }
    })

    return () => {
      if (flyToRef) flyToRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [geojson, cities, flyToRef])

  return <div ref={containerRef} className="w-full h-full" />
}
