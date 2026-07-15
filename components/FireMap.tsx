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

const MAX_CITY_DIST_DEG2 = 0.15 * 0.15 + 0.15 * 0.15

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

const HEATMAP_ZOOM_THRESHOLD = 9

export default function FireMap({ geojson, cities = [], flyToRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    Promise.all([
      import("leaflet"),
      import("leaflet.heat"),
    ]).then(([L]) => {
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

      // ── Heatmap (vue d'ensemble) ─────────────────────────────────────────
      const heatPoints = geojson.features.map(f => {
        const [lon, lat] = f.geometry.coordinates
        const { frp, confidence } = f.properties
        // intensité = FRP normalisé, minimum 0.3 pour les feux sans FRP
        const weight = frp > 0 ? Math.min(frp / 30, 1) : (confidence === "high" ? 0.5 : 0.3)
        return [lat, lon, weight] as [number, number, number]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heat = (L as any).heatLayer(heatPoints, {
        radius: 28,
        blur: 22,
        maxZoom: HEATMAP_ZOOM_THRESHOLD,
        gradient: { 0.2: "#fde68a", 0.5: "#f97316", 0.8: "#dc2626", 1.0: "#7f1d1d" },
        minOpacity: 0.45,
      }).addTo(map)

      // ── Markers individuels (vue de détail) ─────────────────────────────
      const markersLayer = L.layerGroup()

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
        }).addTo(markersLayer)

        // Tooltip survol
        const tooltipHtml = city
          ? `<span class="fire-tip-city">${city.name}</span> <span class="fire-tip-date">${firedate}</span>`
          : `<span class="fire-tip-date">${firedate}</span>`

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
          .bindTooltip(tooltipHtml, { direction: "top", className: "fire-tooltip" })
          .bindPopup(buildPopupHtml(initialLocationLine), { maxWidth: 220, className: "fire-popup" })
          .addTo(markersLayer)

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

      // ── Toggle selon zoom ────────────────────────────────────────────────
      function updateLayers() {
        const z = map.getZoom()
        if (z >= HEATMAP_ZOOM_THRESHOLD) {
          if (!map.hasLayer(markersLayer)) markersLayer.addTo(map)
          heat.setOptions({ minOpacity: 0 })
        } else {
          if (map.hasLayer(markersLayer)) map.removeLayer(markersLayer)
          heat.setOptions({ minOpacity: 0.45 })
        }
      }

      updateLayers()
      map.on("zoomend", updateLayers)
    })

    return () => {
      if (flyToRef) flyToRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [geojson, cities, flyToRef])

  return <div ref={containerRef} className="w-full h-full" />
}
