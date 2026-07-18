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
  filter?: "all" | "confirmed"
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
  high: "signal très intense, feu actif très probable",
  nominal: "peut être un feu, une usine ou un écobuage",
  low: "signal faible, source industrielle ou agricole possible",
}

const HEATMAP_ZOOM_THRESHOLD = 9

export default function FireMap({ geojson, cities = [], flyToRef, filter = "all" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layersRef = useRef<{ heatAll: any; heatConfirmed: any; markersAll: any; markersConfirmed: any; updateZoom: () => void } | null>(null)
  const filterRef = useRef(filter)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    let rafId: number
    rafId = requestAnimationFrame(() => {
    import("leaflet").then(async (L) => {
      if (!containerRef.current || mapRef.current) return
      // leaflet.heat est un plugin UMD qui cherche L comme global
      ;(window as unknown as Record<string, unknown>).L = L
      await import("leaflet.heat")

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

      resizeObserverRef.current = new ResizeObserver(() => {
        map.invalidateSize({ animate: false })
        layersRef.current?.updateZoom()
      })
      resizeObserverRef.current.observe(containerRef.current!)
      setTimeout(() => map.invalidateSize({ animate: false }), 200)
      L.control.zoom({ position: "bottomright" }).addTo(map)
      L.control.attribution({ prefix: false }).addTo(map).addAttribution("&copy; CARTO · NASA FIRMS")

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
      }).addTo(map)

      // ── Helpers ──────────────────────────────────────────────────────────
      function makeHeatLayer(features: FireFeature[]) {
        const pts = features.map(f => {
          const [lon, lat] = f.geometry.coordinates
          const { frp, confidence } = f.properties
          const weight = frp > 0 ? Math.min(frp / 30, 1) : (confidence === "high" ? 0.5 : 0.3)
          return [lat, lon, weight] as [number, number, number]
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (L as any).heatLayer(pts, {
          radius: 28, blur: 22, maxZoom: HEATMAP_ZOOM_THRESHOLD,
          gradient: { 0.2: "#fde68a", 0.5: "#f97316", 0.8: "#dc2626", 1.0: "#7f1d1d" },
          minOpacity: 0.45,
        })
      }

      function makeMarkersLayer(features: FireFeature[]) {
        const layer = L.layerGroup()
        for (const f of features) {
          const [lon, lat] = f.geometry.coordinates
          const { frp, firedate, confidence } = f.properties
          const intensity = Math.min(frp > 0 ? frp / 20 : 0.1, 1)
          const isHigh = confidence === "high"
          const city = nearestCity(lat, lon, cities)
          const color = CONF_COLOR[confidence] ?? "#f97316"
          const label = CONF_LABEL[confidence] ?? confidence
          const desc = CONF_DESC[confidence] ?? ""
          const frpLine = frp > 0
            ? `<div class="fire-pop-row"><span>Intensité</span><strong>${frp < 10 ? frp.toFixed(1) : Math.round(frp)} MW</strong></div>`
            : ""

          L.circleMarker([lat, lon], {
            radius: 10 + intensity * 14, fillColor: color,
            color: "transparent", weight: 0,
            fillOpacity: 0.08 + intensity * 0.08, interactive: false,
          }).addTo(layer)

          const tooltipHtml = city
            ? `<span class="fire-tip-city">${city.name}</span> <span class="fire-tip-date">${firedate}</span>`
            : `<span class="fire-tip-date">${firedate}</span>`

          function buildPopupHtml(locationLine: string) {
            return `<div class="fire-pop">
              <div class="fire-pop-title">Feu détecté par satellite</div>
              ${locationLine}
              <div class="fire-pop-row"><span>Détecté le</span><strong>${firedate}</strong></div>
              <div class="fire-pop-row fire-pop-badge-row">
                <span class="fire-pop-badge" style="background:${color}22;color:${color}">${label}</span>
                <span class="fire-pop-badge-desc">${desc}</span>
              </div>${frpLine}</div>`
          }

          const initialLocationLine = city
            ? `<div class="fire-pop-sub">${city.name} · ${city.region}</div>`
            : `<div class="fire-pop-sub fire-pop-locating">Localisation…</div>`

          const marker = L.circleMarker([lat, lon], {
            radius: isHigh ? 5 : 3, fillColor: color,
            color: "#0000001a", weight: 1, fillOpacity: 0.9,
          })
            .bindTooltip(tooltipHtml, { direction: "top", className: "fire-tooltip" })
            .bindPopup(buildPopupHtml(initialLocationLine), { maxWidth: 220, className: "fire-popup" })
            .addTo(layer)

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
                  marker.getPopup()?.isOpen() &&
                    marker.getPopup()!.setContent(buildPopupHtml(`<div class="fire-pop-sub">Zone forestière</div>`))
                })
            })
          }
        }
        return layer
      }

      // ── Construire les 4 couches (all / confirmed) x (heat / markers) ───
      const confirmedFeatures = geojson.features.filter(f => f.properties.confidence === "high")

      const heatAll = makeHeatLayer(geojson.features).addTo(map)
      const heatConfirmed = makeHeatLayer(confirmedFeatures)
      const markersAll = makeMarkersLayer(geojson.features)
      const markersConfirmed = makeMarkersLayer(confirmedFeatures)

      layersRef.current = { heatAll, heatConfirmed, markersAll, markersConfirmed, updateZoom: () => {} }

      // ── Toggle selon zoom + filtre ───────────────────────────────────────
      function updateZoom() {
        const layers = layersRef.current
        if (!layers) return
        const z = map.getZoom()
        const activeHeat = layers.heatAll
        const activeMarkers = layers.markersAll
        const inactiveHeat = layers.heatConfirmed
        const inactiveMarkers = layers.markersConfirmed

        // retire tout, remet ce qui doit être visible
        ;[activeHeat, inactiveHeat, activeMarkers, inactiveMarkers].forEach(l => {
          if (map.hasLayer(l)) map.removeLayer(l)
        })

        const { heatAll: ha, heatConfirmed: hc, markersAll: ma, markersConfirmed: mc } = layers
        // lire le filtre courant depuis le ref
        const currentFilter = filterRef.current
        const heat = currentFilter === "confirmed" ? hc : ha
        const markers = currentFilter === "confirmed" ? mc : ma

        heat.addTo(map)
        if (z >= HEATMAP_ZOOM_THRESHOLD) markers.addTo(map)
      }

      layersRef.current.updateZoom = updateZoom
      updateZoom()
      map.on("zoomend", updateZoom)
    })
    }) // requestAnimationFrame

    return () => {
      cancelAnimationFrame(rafId)
      if (flyToRef) flyToRef.current = null
      layersRef.current = null
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [geojson, cities, flyToRef])

  useEffect(() => {
    filterRef.current = filter
    layersRef.current?.updateZoom()
  }, [filter])

  return <div ref={containerRef} className="w-full h-full" />
}
