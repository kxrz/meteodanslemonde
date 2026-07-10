"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { slugify } from "@/lib/slugify"

interface City {
  id: string
  name: string
  lat: number
  lon: number
}

function nearestCity(lat: number, lon: number, cities: City[]): City {
  const R = 6371
  let best = cities[0]
  let bestKm = Infinity
  for (const c of cities) {
    const dLat = ((c.lat - lat) * Math.PI) / 180
    const dLon = ((c.lon - lon) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((c.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    if (km < bestKm) { best = c; bestKm = km }
  }
  return best
}

export default function GeolocateButton({ cities }: { cities: City[] }) {
  const router = useRouter()
  const [state, setState] = useState<"idle" | "loading" | "error">("idle")

  function handleClick() {
    if (!navigator.geolocation) { setState("error"); return }
    setState("loading")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const city = nearestCity(pos.coords.latitude, pos.coords.longitude, cities)
        router.push(`/a/${slugify(city.name)}`)
      },
      () => setState("error")
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      title="Ma ville"
      className="flex items-center gap-2 bg-white border border-neutral-200 hover:border-neutral-400 transition-colors rounded-xl px-3 py-2.5 text-sm text-neutral-500 hover:text-neutral-800 disabled:opacity-50 shrink-0"
    >
      {state === "loading" ? (
        <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      )}
      {state === "error" ? <span className="text-xs text-red-500">Localisation refusée</span> : <span className="text-xs font-semibold">Ma ville</span>}
    </button>
  )
}
