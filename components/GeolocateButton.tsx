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
      className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border-2 border-ink bg-white px-4 font-display text-[15px] font-bold text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
    >
      {state === "loading" ? (
        <div className="w-4 h-4 border-2 border-line border-t-ink rounded-full animate-spin" aria-hidden="true" />
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      )}
      {state === "error" ? <span role="status" className="text-chaud">Position indisponible</span> : <span>Me localiser</span>}
    </button>
  )
}
