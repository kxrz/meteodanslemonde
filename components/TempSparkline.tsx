"use client"

import { useEffect, useState } from "react"

interface Props {
  lat: number
  lon: number
  normal: number | null
}

export default function TempSparkline({ lat, lon, normal }: Props) {
  const [values, setValues] = useState<(number | null)[]>([])

  useEffect(() => {
    const end = new Date()
    end.setDate(end.getDate() - 1)
    const start = new Date(end)
    start.setDate(start.getDate() - 29)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)

    fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
      `&start_date=${fmt(start)}&end_date=${fmt(end)}&daily=apparent_temperature_max&timezone=Europe%2FParis`
    )
      .then((r) => r.json())
      .then((data) => setValues(data.daily?.apparent_temperature_max ?? []))
      .catch(() => {})
  }, [lat, lon])

  if (values.length === 0) return (
    <div className="h-16 flex items-center">
      <div className="w-full h-8 bg-neutral-100 rounded-xl animate-pulse" />
    </div>
  )

  const valid = values.filter((v): v is number => v !== null)
  const min = Math.min(...valid)
  const max = Math.max(...valid)
  const range = max - min || 1

  const W = 400
  const H = 64
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = v !== null ? H - ((v - min) / range) * (H - 8) - 4 : null
    return { x, y, v }
  })

  const pathD = pts
    .filter((p): p is { x: number; y: number; v: number } => p.y !== null)
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ")

  const normalY = normal !== null ? H - ((normal - min) / range) * (H - 8) - 4 : null

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
        Ressenti max · 30 derniers jours
      </p>
      <div className="relative w-full" style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
          {normalY !== null && (
            <line x1="0" y1={normalY} x2={W} y2={normalY}
              stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />
          )}
          <path d={pathD} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="absolute top-0 right-0 flex gap-3 text-[10px] text-neutral-400">
          <span>max {max}°C</span>
          <span>min {min}°C</span>
        </div>
        {normalY !== null && (
          <div className="absolute left-0 text-[9px] text-neutral-400" style={{ top: normalY - 10 }}>
            normale
          </div>
        )}
      </div>
    </div>
  )
}
