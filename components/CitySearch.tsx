"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  id?: string
}

/** Recherche de ville : combobox accessible (flèches, Entrée, Échap), repli sur la liste locale si l'API des communes ne répond pas. */
export default function CitySearch({
  cities,
  placeholder = "Votre commune…",
  onSelect,
  variant = "navigate",
  id = "city-search",
}: Props) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listId = `${id}-liste`

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
      setResults(localMatches)
      const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,centre,departement,region&boost=population&limit=6`
      const communes: GeoCommune[] = await fetch(url).then((r) => (r.ok ? r.json() : [])).catch(() => [])

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

  useEffect(() => { setActive(-1) }, [results])

  useEffect(() => {
    function handler(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [])

  const showDropdown = open && query.length >= 2

  function handleSelect(result: SearchResult) {
    setQuery("")
    setOpen(false)
    if (variant === "select" && onSelect) onSelect(result.city)
    else router.push(`/a/${slugify(result.city.name)}`)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(results.length - 1, a + 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)) }
    else if (e.key === "Enter") {
      const pick = results[active >= 0 ? active : 0]
      if (pick) { e.preventDefault(); handleSelect(pick) }
    } else if (e.key === "Escape") { setOpen(false) }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <circle cx="11" cy="11" r="6" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          id={id}
          type="search"
          role="combobox"
          aria-expanded={showDropdown && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="min-h-12 w-full rounded-full border-2 border-ink bg-white py-3 pl-12 pr-11 text-[16px] text-ink placeholder:text-mute focus:outline-none focus-visible:ring-4 focus-visible:ring-froid/30"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-line border-t-ink" aria-hidden="true" />
        )}
        {!loading && query && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => { setQuery(""); setOpen(false); setResults([]) }}
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-mute hover:text-ink"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Villes trouvées" className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border-2 border-ink bg-white py-1 shadow-[0_6px_0_0_var(--color-ink)]">
          {results.map((result, i) => (
            <li
              key={i}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(result)}
              className={`flex min-h-12 cursor-pointer items-center justify-between px-4 py-2.5 ${i === active ? "bg-signal" : "hover:bg-paper"}`}
            >
              <div className="min-w-0">
                <p className="truncate font-display text-[16px] font-bold text-ink">{result.label}</p>
                <p className="truncate text-[13px] text-mute">
                  {result.isExact ? result.sublabel : <>{result.sublabel} · ville proche : <strong className="text-ink-soft">{result.city.name}</strong> ({result.distanceKm} km)</>}
                </p>
              </div>
              <span className="ml-3 shrink-0 text-ink" aria-hidden="true">&rarr;</span>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && !loading && results.length === 0 && (
        <p role="status" className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border-2 border-ink bg-white p-4 text-center text-[15px] text-ink-soft">
          Aucune commune trouvée pour « {query} ».
        </p>
      )}
    </div>
  )
}
