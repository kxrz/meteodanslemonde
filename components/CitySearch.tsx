"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { slugify } from "@/lib/slugify"

interface City {
  id: string
  name: string
  lat: number
  lon: number
  region: string
}

interface GeoCommune {
  nom: string
  centre: { coordinates: [number, number] } // [lon, lat]
  departement?: { code: string; nom: string }
  region?: { nom: string }
}

interface SearchResult {
  label: string        // display name
  sublabel: string     // dept / region
  city: City           // nearest referenced city
  distanceKm: number   // 0 if exact match
  isExact: boolean
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

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[-_']/g, " ").trim()
}

function nearestCity(lat: number, lon: number, cities: City[]): { city: City; km: number } {
  let best = cities[0]
  let bestKm = haversineKm(lat, lon, best.lat, best.lon)
  for (const c of cities) {
    const km = haversineKm(lat, lon, c.lat, c.lon)
    if (km < bestKm) { best = c; bestKm = km }
  }
  return { city: best, km: bestKm }
}

interface Props {
  cities: City[]
  placeholder?: string
  onSelect?: (city: City) => void  // optional: called instead of navigating
  variant?: "navigate" | "select"  // navigate = link to /a/[slug], select = callback
}

export default function CitySearch({
  cities,
  placeholder = "Chercher une ville ou une région…",
  onSelect,
  variant = "navigate",
}: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }

    setLoading(true)
    try {
      // 1. First try direct match against our city list (instant, no API)
      const nq = normalize(q)
      const direct = cities.filter(
        (c) => normalize(c.name).startsWith(nq) || normalize(c.region).startsWith(nq)
      )
      const contains = cities.filter(
        (c) => !direct.includes(c) && (normalize(c.name).includes(nq) || normalize(c.region).includes(nq))
      )
      const localMatches: SearchResult[] = [...direct, ...contains].slice(0, 4).map((c) => ({
        label: c.name,
        sublabel: c.region,
        city: c,
        distanceKm: 0,
        isExact: true,
      }))

      // 2. Call geo.api.gouv.fr for any French commune
      const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,centre,departement,region&boost=population&limit=6`
      const res = await fetch(url)
      const communes: GeoCommune[] = res.ok ? await res.json() : []

      const geoResults: SearchResult[] = []
      for (const commune of communes) {
        const [lon, lat] = commune.centre.coordinates
        // Check if this commune is in our list already
        const inList = cities.find((c) => normalize(c.name) === normalize(commune.nom))
        if (inList) {
          if (!localMatches.some((r) => r.city.id === inList.id)) {
            geoResults.push({ label: commune.nom, sublabel: commune.departement?.nom ?? commune.region?.nom ?? "", city: inList, distanceKm: 0, isExact: true })
          }
        } else {
          // Find nearest referenced city
          const { city: nearest, km } = nearestCity(lat, lon, cities)
          const deptLabel = commune.departement ? `${commune.departement.code} · ${commune.departement.nom}` : commune.region?.nom ?? ""
          geoResults.push({ label: commune.nom, sublabel: deptLabel, city: nearest, distanceKm: Math.round(km), isExact: false })
        }
      }

      // Merge: local exact first, then geo (deduplicated)
      const seen = new Set(localMatches.map((r) => r.city.id + r.label))
      const merged = [...localMatches]
      for (const r of geoResults) {
        const key = r.city.id + r.label
        if (!seen.has(key)) { seen.add(key); merged.push(r) }
      }

      setResults(merged.slice(0, 6))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [cities])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); setLoading(false); return }
    debounceRef.current = setTimeout(() => search(query), 280)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const showDropdown = open && query.length >= 2

  function handleSelect(result: SearchResult) {
    setQuery("")
    setOpen(false)
    if (variant === "select" && onSelect) {
      onSelect(result.city)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-neutral-200 border-t-neutral-400 rounded-full animate-spin" />
        )}
        {!loading && query && (
          <button onClick={() => { setQuery(""); setOpen(false); setResults([]) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-100 rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {results.map((result, i) => {
              const content = (
                <div className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors group cursor-pointer">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{result.label}</p>
                    <p className="text-xs text-neutral-400 truncate">
                      {result.isExact ? result.sublabel : (
                        <>
                          <span className="text-amber-600">{result.sublabel}</span>
                          {" · "}<span className="text-neutral-500">ville proche : {result.city.name} ({result.distanceKm} km)</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-neutral-300 group-hover:text-neutral-500 text-sm ml-3 shrink-0 transition-colors">&rarr;</span>
                </div>
              )

              return variant === "select" ? (
                <div key={i} onClick={() => handleSelect(result)}>{content}</div>
              ) : (
                <Link key={i} href={`/a/${slugify(result.city.name)}`} onClick={() => handleSelect(result)}>
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {showDropdown && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-100 rounded-2xl shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-neutral-400">Aucune commune trouvée</p>
        </div>
      )}
    </div>
  )
}
