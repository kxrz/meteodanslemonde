"use client"

import { useState } from "react"

interface City {
  id: string
  name: string
  anomaly: number | null
}

interface Segment {
  label: string
  color: string
  min: number
  max: number
}

const SEGMENTS: Segment[] = [
  { label: "< -2°C", color: "#3b82f6", min: -Infinity, max: -2 },
  { label: "-2 à 0°C", color: "#93c5fd", min: -2, max: 0 },
  { label: "0 à +2°C", color: "#fca5a5", min: 0, max: 2 },
  { label: "> +2°C", color: "#ef4444", min: 2, max: Infinity },
]

function anomalyHex(a: number | null): string {
  if (a === null) return "#e5e5e5"
  if (a <= -3) return "#1d4ed8"
  if (a <= -1) return "#93c5fd"
  if (a <= 1) return "#fca5a5"
  if (a <= 3) return "#f97316"
  return "#ef4444"
}

export default function SpectreBar({ cities, monthName }: { cities: City[]; monthName: string }) {
  const [activeSegment, setActiveSegment] = useState<number | null>(null)
  const total = cities.filter(c => c.anomaly !== null).length

  const sorted = [...cities].sort((a, b) => (a.anomaly ?? 0) - (b.anomaly ?? 0))
  const spectreMin = sorted[0]
  const spectreMax = sorted[sorted.length - 1]

  const segmentData = SEGMENTS.map(s => {
    const matches = cities.filter(c => {
      const a = c.anomaly ?? 0
      return a >= s.min && a < s.max
    })
    return { ...s, count: matches.length, pct: total > 0 ? Math.round((matches.length / total) * 100) : 0, cities: matches }
  }).filter(s => s.count > 0)

  const active = activeSegment !== null ? segmentData[activeSegment] ?? null : null

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">
        Spectre de chaleur &middot; {cities.length} villes
      </p>
      <p className="text-xs text-neutral-400 mb-4">
        Anomalie vs normale ERA5 de {monthName}, de la plus froide à la plus chaude
      </p>

      {/* Extrêmes au-dessus de la barre */}
      <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
        <span>
          <span className="font-semibold text-neutral-700">{spectreMin.name}</span>
          {spectreMin.anomaly !== null && (
            <span className="text-blue-500 ml-1">{spectreMin.anomaly > 0 ? "+" : ""}{spectreMin.anomaly.toFixed(1)}°C</span>
          )}
        </span>
        <span>
          {spectreMax.anomaly !== null && (
            <span className="text-red-400 mr-1">{spectreMax.anomaly > 0 ? "+" : ""}{spectreMax.anomaly.toFixed(1)}°C</span>
          )}
          <span className="font-semibold text-neutral-700">{spectreMax.name}</span>
        </span>
      </div>

      {/* Barre */}
      <div className="flex rounded-xl overflow-hidden h-10 mb-3 cursor-pointer">
        {sorted.map((city) => (
          <div
            key={city.id}
            title={`${city.name} : ${city.anomaly !== null ? (city.anomaly > 0 ? "+" : "") + city.anomaly.toFixed(1) + "°C" : "N/A"}`}
            style={{ flex: 1, backgroundColor: anomalyHex(city.anomaly) }}
          />
        ))}
      </div>

      {/* Segments cliquables */}
      <div className="flex gap-3 mt-2 mb-1 flex-wrap">
        {segmentData.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setActiveSegment(activeSegment === i ? null : i)}
            className={`flex items-center gap-1.5 text-xs transition-all rounded-lg px-2 py-1 -mx-2 -my-1 ${
              activeSegment === i
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            {s.label} &middot; <strong className="text-neutral-700">{s.count} ville{s.count > 1 ? "s" : ""}</strong>
          </button>
        ))}
      </div>

      {/* Info bulle segment actif */}
      {active && (
        <div className="mt-3 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-neutral-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: active.color }} />
              {active.label}
            </span>
            <span className="text-2xl font-black text-neutral-900">{active.pct}%</span>
          </div>
          <p className="text-xs text-neutral-500 mb-2">
            {active.count} ville{active.count > 1 ? "s" : ""} sur {total} ont une anomalie {active.label.toLowerCase()} ce mois-ci.
          </p>
          <p className="text-xs text-neutral-400 leading-snug flex flex-wrap gap-1">
            {active.cities.slice(0, 10).map(c => (
              <span key={c.id} className="bg-white border border-neutral-200 rounded px-1.5 py-0.5">
                {c.name} {c.anomaly !== null ? `(${c.anomaly > 0 ? "+" : ""}${c.anomaly.toFixed(1)}°)` : ""}
              </span>
            ))}
            {active.cities.length > 10 && (
              <span className="text-neutral-500">+{active.cities.length - 10} autres</span>
            )}
          </p>
        </div>
      )}

    </div>
  )
}
