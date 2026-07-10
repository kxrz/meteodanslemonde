"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { slugify } from "@/lib/slugify"

interface City {
  id: string
  name: string
  lat: number
  lon: number
  region: string
}

interface Props {
  cities: City[]
  placeholder?: string
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-_']/g, " ")
    .trim()
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Rough coords of common French cities not in our list → to power fallback suggestions
const UNLISTED_COORDS: Record<string, [number, number]> = {
  "valenciennes": [50.36, 3.52],
  "douai": [50.37, 3.08],
  "lens": [50.43, 2.83],
  "bethune": [50.53, 2.63],
  "maubeuge": [50.28, 3.97],
  "saint-quentin": [49.84, 3.28],
  "laon": [49.56, 3.62],
  "soissons": [49.38, 3.32],
  "compiegne": [49.41, 2.83],
  "saint-nazaire": [47.27, -2.21],
  "laval": [48.07, -0.77],
  "cholet": [47.06, -0.88],
  "saumur": [47.26, -0.07],
  "saint-brieuc": [48.51, -2.77],
  "lannion": [48.73, -3.46],
  "brive": [45.16, 1.53],
  "tulle": [45.27, 1.77],
  "aurillac": [44.93, 2.44],
  "rodez": [44.35, 2.57],
  "cahors": [44.45, 1.44],
  "agen": [44.2, 0.62],
  "perigueux": [45.18, 0.72],
  "angouleme": [45.65, 0.16],
  "rochefort": [45.94, -0.96],
  "niort": [46.32, -0.46],
  "gap": [44.56, 6.08],
  "digne": [44.09, 6.24],
  "draguignan": [43.54, 6.46],
  "menton": [43.78, 7.5],
  "antibes": [43.58, 7.12],
  "cannes": [43.55, 7.01],
  "frejus": [43.43, 6.74],
  "carcassonne": [43.21, 2.35],
  "narbonne": [43.18, 3.0],
  "beziers": [43.34, 3.22],
  "sete": [43.4, 3.69],
  "castres": [43.6, 2.24],
  "tarbes": [43.23, 0.08],
  "auch": [43.65, 0.59],
  "foix": [42.97, 1.61],
  "privas": [44.74, 4.6],
  "mende": [44.52, 3.5],
  "montlucon": [46.34, 2.6],
  "vichy": [46.12, 3.42],
  "thiers": [45.86, 3.54],
  "moulins": [46.56, 3.33],
  "bourg-en-bresse": [46.2, 5.23],
  "roanne": [46.04, 4.07],
  "vienne": [45.52, 4.87],
  "annonay": [45.24, 4.67],
  "romans-sur-isere": [45.05, 5.05],
  "gap": [44.56, 6.08],
  "albertville": [45.67, 6.39],
  "cluses": [46.06, 6.58],
  "thonon": [46.37, 6.48],
  "evian": [46.4, 6.59],
  "pontarlier": [46.9, 6.35],
  "dole": [47.09, 5.49],
  "vesoul": [47.62, 6.15],
  "lons-le-saunier": [46.67, 5.56],
  "montbeliard": [47.51, 6.8],
  "auxerre": [47.8, 3.57],
  "sens": [48.2, 3.29],
  "nevers": [46.99, 3.16],
  "macon": [46.31, 4.83],
  "autun": [46.95, 4.3],
  "blois": [47.59, 1.34],
  "vendome": [47.79, 1.07],
  "chateauroux": [46.81, 1.69],
  "cherbourg": [49.63, -1.62],
  "lisieux": [49.14, 0.23],
  "evreux": [49.03, 1.15],
  "alençon": [48.43, 0.09],
  "saint-lo": [49.11, -1.09],
  "coutances": [49.05, -1.44],
  "dieppe": [49.92, 1.08],
  "elbeuf": [49.28, 1.01],
  "fecamp": [49.76, 0.38],
  "chartres": [48.45, 1.49],
}

export default function CitySearch({ cities, placeholder = "Chercher une ville ou une région…" }: Props) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const result = useMemo(() => {
    const q = normalize(query)
    if (q.length < 2) return null

    // 1. Exact or prefix match on city name or region
    const exactMatches = cities.filter(
      (c) => normalize(c.name).startsWith(q) || normalize(c.region).startsWith(q)
    )
    const containsMatches = cities.filter(
      (c) =>
        !exactMatches.includes(c) &&
        (normalize(c.name).includes(q) || normalize(c.region).includes(q))
    )
    const matched = [...exactMatches, ...containsMatches]

    if (matched.length > 0) {
      return { type: "match" as const, cities: matched.slice(0, 6) }
    }

    // 2. Check if query matches an unlisted city we know coords for
    const knownCoords = Object.entries(UNLISTED_COORDS).find(([key]) =>
      normalize(key).startsWith(q) || q.startsWith(normalize(key).substring(0, 4))
    )
    if (knownCoords) {
      const [cityName, [lat, lon]] = knownCoords
      // Find 3 nearest referenced cities
      const nearest = cities
        .map((c) => ({ city: c, km: haversineKm(lat, lon, c.lat, c.lon) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 3)
      return {
        type: "fallback" as const,
        queriedName: cityName.charAt(0).toUpperCase() + cityName.slice(1),
        nearest,
      }
    }

    // 3. No match at all
    return { type: "nomatch" as const }
  }, [query, cities])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const showDropdown = open && query.length >= 2 && result !== null

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <circle cx="11" cy="11" r="6" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && result && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-100 rounded-2xl shadow-lg z-50 overflow-hidden">

          {result.type === "match" && (
            <div className="py-1">
              {result.cities.map((city) => (
                <Link
                  key={city.id}
                  href={`/a/${slugify(city.name)}`}
                  onClick={() => { setQuery(""); setOpen(false) }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{city.name}</p>
                    <p className="text-xs text-neutral-400">{city.region}</p>
                  </div>
                  <span className="text-neutral-300 group-hover:text-neutral-500 text-sm transition-colors">→</span>
                </Link>
              ))}
            </div>
          )}

          {result.type === "fallback" && (
            <>
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                <p className="text-xs text-amber-800 font-medium">
                  {result.queriedName} n'est pas encore dans notre liste — villes référencées les plus proches :
                </p>
              </div>
              <div className="py-1">
                {result.nearest.map(({ city, km }) => (
                  <Link
                    key={city.id}
                    href={`/a/${slugify(city.name)}`}
                    onClick={() => { setQuery(""); setOpen(false) }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{city.name}</p>
                      <p className="text-xs text-neutral-400">{city.region}</p>
                    </div>
                    <span className="text-xs text-neutral-400 group-hover:text-neutral-600 shrink-0 ml-2">
                      {Math.round(km)} km
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {result.type === "nomatch" && (
            <div className="p-4 text-center">
              <p className="text-sm text-neutral-500 mb-2">Ville non couverte</p>
              <Link
                href="/en/france"
                onClick={() => { setQuery(""); setOpen(false) }}
                className="text-xs text-blue-600 hover:underline"
              >
                Voir toutes les villes disponibles →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
