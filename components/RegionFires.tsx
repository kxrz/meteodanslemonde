"use client"

import { useEffect, useState } from "react"
import { project } from "@/lib/france-shape"
import type { Crop } from "@/lib/city-page"

/** Feux actifs détectés par satellite (NASA FIRMS, 7 jours), posés sur la carte SVG de région. */
export default function RegionFires({ crop, radius }: { crop: Crop; radius: number }) {
  const [pts, setPts] = useState<[number, number][]>([])

  useEffect(() => {
    let alive = true
    fetch("/api/fires")
      .then((r) => (r.ok ? r.json() : null))
      .then((geo) => {
        if (!alive || !geo?.features) return
        const out: [number, number][] = []
        for (const f of geo.features as { geometry?: { type: string; coordinates: [number, number] }; properties?: { _type?: string } }[]) {
          if (f.properties?._type !== "active" || f.geometry?.type !== "Point") continue
          const [lon, lat] = f.geometry.coordinates
          const [x, y] = project(lat, lon)
          if (x >= crop.x && x <= crop.x + crop.w && y >= crop.y && y <= crop.y + crop.h) out.push([x, y])
        }
        setPts(out)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [crop.x, crop.y, crop.w, crop.h])

  if (!pts.length) return null
  return (
    <g aria-label={`${pts.length} feux détectés par satellite (7 jours)`}>
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={radius} fill="var(--color-chaud)" stroke="var(--color-ink)" strokeWidth={radius * 0.3} />)}
    </g>
  )
}
