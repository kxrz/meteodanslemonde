"use client"

import dynamic from "next/dynamic"
import { useState, useMemo, useEffect } from "react"
import { CityFR, CityWorld, AnyCity } from "@/lib/types"
import { getWeather } from "@/lib/weather-codes"
import { useClimateData } from "@/lib/use-climate-data"

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-100">
      <span className="text-neutral-400 text-sm">Chargement…</span>
    </div>
  ),
})

const TWIN_MAX_DIFF = 4
const TWIN_COUNT = 5

function computeTwins(city: AnyCity, all: AnyCity[]): AnyCity[] {
  const ref = city.apparent_temp_max
  const pool = city.type === "fr"
    ? all.filter((c) => c.type === "world")
    : all.filter((c) => c.type === "fr")
  return pool
    .map((c) => ({ city: c, diff: Math.abs(c.apparent_temp_max - ref) }))
    .filter(({ diff }) => diff <= TWIN_MAX_DIFF)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, TWIN_COUNT)
    .map(({ city }) => city)
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-black/8 rounded-xl animate-pulse ${className ?? ""}`} />
}

interface Props {
  citiesFR: CityFR[]
  citiesWorld: CityWorld[]
  fetchedAt: string
}

export default function ClientPage({ citiesFR, citiesWorld, fetchedAt }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Fix hydration (#418): start with deterministic value, randomize client-side only
  const [heroCity, setHeroCity] = useState(citiesFR[0])
  useEffect(() => {
    setHeroCity(citiesFR[Math.floor(Math.random() * citiesFR.length)])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allCities: AnyCity[] = useMemo(() => [
    ...citiesFR.map((c) => ({ ...c, type: "fr" as const })),
    ...citiesWorld.map((c) => ({ ...c, type: "world" as const })),
  ], [citiesFR, citiesWorld])

  const selectedCity = useMemo(
    () => allCities.find((c) => c.id === selectedId) ?? null,
    [selectedId, allCities]
  )

  const twins = useMemo(
    () => (selectedCity ? computeTwins(selectedCity, allCities) : []),
    [selectedCity, allCities]
  )

  const climate = useClimateData(
    selectedCity?.lat ?? 0,
    selectedCity?.lon ?? 0,
    selectedCity?.apparent_temp_max ?? 0,
    selectedCity !== null
  )

  function handleCityClick(id: string) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const dataLabel = new Date(fetchedAt).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })

  const isFR = selectedCity?.type === "fr"
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })

  return (
    <div className="h-screen flex flex-col bg-[#f9f8f5] overflow-hidden">

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <header className="shrink-0 px-5 lg:px-8 pt-5 pb-4 border-b border-black/5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">
              <span className="text-neutral-900">en vrai,</span>{" "}
              <span className="text-neutral-400">c'est chaud.</span>
            </h1>
            <p className="text-[13px] text-neutral-500 mt-2 max-w-lg leading-snug">
              Quand Bordeaux atteint 34°C, où dans le monde est-ce la normale ?
              Jumeaux climatiques &amp; projections GIEC.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-1.5 shrink-0 text-xs text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            {dataLabel}
          </div>
        </div>
      </header>

      {/* ── Map + Panel ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

        {/* Map */}
        <div className="h-[42vh] lg:h-auto lg:w-[60%] shrink-0">
          <Map
            citiesFR={citiesFR}
            citiesWorld={citiesWorld}
            selectedId={selectedId}
            twinIds={twins.map((t) => t.id)}
            onCityClick={handleCityClick}
          />
        </div>

        {/* Bento panel */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-3 pb-6">

            {!selectedCity ? (

              // ── État par défaut ──────────────────────────────────
              <>
                {/* Température hero */}
                <div className="col-span-2 bg-white rounded-3xl p-6 border border-black/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-300 mb-5">
                    Là maintenant · France
                  </p>
                  <div className="flex items-baseline gap-1 leading-none">
                    <span className="text-[80px] font-black text-neutral-900 leading-none tabular-nums">
                      {heroCity.apparent_temp_max}°
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-3">
                    {getWeather(heroCity.weathercode).emoji}{" "}
                    <span className="font-semibold">{heroCity.name}</span>
                    <span className="text-neutral-400"> · ressenti max</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-4 pt-4 border-t border-black/5 leading-relaxed">
                    Sélectionnez une ville sur la carte pour explorer ses données climatiques.
                  </p>
                </div>

                {/* Compteur FR — fond sombre */}
                <div className="bg-neutral-900 rounded-3xl p-5 flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/25 mb-auto pb-8">
                    🇫🇷 France
                  </span>
                  <div className="text-[60px] font-black text-white leading-none tabular-nums">
                    {citiesFR.length}
                  </div>
                  <div className="text-xs text-white/30 mt-1">villes</div>
                </div>

                {/* Compteur Monde — fond sombre */}
                <div className="bg-neutral-900 rounded-3xl p-5 flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/25 mb-auto pb-8">
                    🌍 Monde
                  </span>
                  <div className="text-[60px] font-black text-white leading-none tabular-nums">
                    {citiesWorld.length}
                  </div>
                  <div className="text-xs text-white/30 mt-1">villes</div>
                </div>

                {/* Méthode */}
                <div className="col-span-2 bg-white rounded-3xl p-5 border border-black/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-300 mb-3">
                    Méthode
                  </p>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Comparaison du{" "}
                    <strong className="text-neutral-900">ressenti maximal journalier</strong>.
                    Jumeaux climatiques à ±4°C. Normale ERA5 1991–2020.
                    Projections{" "}
                    <strong className="text-neutral-900">CMIP6</strong> (GIEC AR6).
                  </p>
                </div>

                {/* Sources + Mentions légales */}
                <div className="col-span-2 flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Open-Meteo · ERA5 · CMIP6</span>
                  <a
                    href="https://leswww.com/mentions-legales/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-neutral-600 transition-colors"
                  >
                    Mentions légales
                  </a>
                </div>
              </>

            ) : (

              // ── Ville sélectionnée ───────────────────────────────
              <>
                {/* Carte météo principale */}
                <div className={`col-span-2 rounded-3xl p-6 ${isFR ? "bg-[#dbeafe]" : "bg-[#d1fae5]"}`}>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold opacity-40 mb-1">
                        {isFR
                          ? (selectedCity as CityFR).region
                          : (selectedCity as CityWorld).country}
                      </p>
                      <h2 className="text-3xl font-black text-neutral-900 tracking-tight leading-tight">
                        {selectedCity.name}
                      </h2>
                    </div>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="text-black/20 hover:text-black/60 mt-1 shrink-0 transition-colors"
                      aria-label="Fermer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-1 leading-none">
                        <span className="text-[72px] font-black text-neutral-900 leading-none tabular-nums">
                          {selectedCity.apparent_temp_max}°
                        </span>
                        <span className="text-2xl font-black text-neutral-400">C</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">
                        {getWeather(selectedCity.weathercode).emoji}{" "}
                        {getWeather(selectedCity.weathercode).label} · ressenti max
                      </p>
                    </div>
                    <div className="text-right text-xs text-neutral-500 space-y-1">
                      <div>💧 {selectedCity.humidity}%</div>
                      <div>💨 {selectedCity.wind} km/h</div>
                    </div>
                  </div>
                </div>

                {/* Normale */}
                <div className="bg-[#c8dfc4] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/40 mb-4">
                    Normale
                  </p>
                  {climate.loading ? (
                    <><Skeleton className="h-11 w-20 mb-2" /><Skeleton className="h-3 w-24" /></>
                  ) : climate.normal !== null ? (
                    <>
                      <div className="text-[44px] font-black text-green-900 leading-none tabular-nums">
                        {climate.normal}°
                      </div>
                      <p className="text-xs text-green-900/40 mt-2">
                        {monthName} 1991–2020
                      </p>
                    </>
                  ) : (
                    <p className="text-4xl font-black text-green-900/20">—</p>
                  )}
                </div>

                {/* Anomalie */}
                <div className={`rounded-3xl p-5 transition-colors ${
                  climate.anomaly !== null && climate.anomaly > 2
                    ? "bg-[#f4a27a]"
                    : climate.anomaly !== null && climate.anomaly < -2
                    ? "bg-[#a8c4d4]"
                    : "bg-neutral-200"
                }`}>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/35 mb-4">
                    Anomalie
                  </p>
                  {climate.loading ? (
                    <><Skeleton className="h-11 w-20 mb-2" /><Skeleton className="h-3 w-24" /></>
                  ) : climate.anomaly !== null ? (
                    <>
                      <div className="text-[44px] font-black text-neutral-900 leading-none tabular-nums">
                        {climate.anomaly > 0 ? "+" : ""}{climate.anomaly}°
                      </div>
                      <p className="text-xs text-black/40 mt-2">
                        {climate.anomaly > 2
                          ? "au-dessus de la normale"
                          : climate.anomaly < -2
                          ? "en-dessous de la normale"
                          : "dans la normale"}
                      </p>
                    </>
                  ) : (
                    <p className="text-4xl font-black text-black/15">—</p>
                  )}
                </div>

                {/* Tendance 30 ans */}
                <div className="col-span-2 bg-white rounded-3xl p-5 border border-black/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-300 mb-2">
                    Tendance 30 ans
                  </p>
                  {climate.loading ? (
                    <Skeleton className="h-8 w-40" />
                  ) : climate.trend !== null ? (
                    <p className="text-2xl font-black text-neutral-900">
                      {climate.trend > 0 ? "+" : ""}{climate.trend}°C
                      <span className="text-sm font-normal text-neutral-400 ml-2">
                        depuis 1990 en {monthName}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-400">Non disponible</p>
                  )}
                </div>

                {/* Projections GIEC */}
                <div className="col-span-2 bg-[#e4dff0] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/40 mb-1">
                    Projections GIEC
                  </p>
                  <p className="text-[10px] text-purple-900/30 mb-5">
                    CMIP6 · écart vs 2000–2020
                  </p>
                  {climate.loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : climate.error ? (
                    <p className="text-xs text-purple-900/30">Données non disponibles</p>
                  ) : (
                    <div className="divide-y divide-purple-900/10">
                      {([
                        { year: 2030, val: climate.proj2030 },
                        { year: 2040, val: climate.proj2040 },
                        { year: 2050, val: climate.proj2050 },
                      ] as { year: number; val: number | null }[]).map(({ year, val }) => (
                        <div key={year} className="flex items-center justify-between py-2.5">
                          <span className="text-sm font-semibold text-purple-900/50">{year}</span>
                          <span className="font-black text-3xl text-purple-900 tabular-nums">
                            {val !== null ? `${val >= 0 ? "+" : ""}${val.toFixed(1)}°` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Jumeaux climatiques */}
                <div className="col-span-2 bg-white rounded-3xl p-5 border border-black/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-300 mb-3">
                    {isFR ? "Ressent pareil aujourd'hui" : "Villes françaises similaires"}
                  </p>
                  {twins.length === 0 ? (
                    <p className="text-sm text-neutral-400">Aucun jumeau à ±4°C aujourd'hui.</p>
                  ) : (
                    <div className="space-y-0.5">
                      {twins.map((twin) => {
                        const tw = getWeather(twin.weathercode)
                        const sub = twin.type === "world"
                          ? (twin as CityWorld).country
                          : (twin as CityFR).region
                        return (
                          <button
                            key={twin.id}
                            onClick={() => handleCityClick(twin.id)}
                            className="w-full flex items-center gap-3 py-2.5 px-3 rounded-2xl hover:bg-neutral-50 text-left transition-colors"
                          >
                            <span className="text-lg leading-none">{tw.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-neutral-800 truncate">
                                {twin.name}
                              </div>
                              <div className="text-xs text-neutral-400 truncate">{sub}</div>
                            </div>
                            <div className="font-black text-sm text-neutral-700 shrink-0 tabular-nums">
                              {twin.apparent_temp_max}°C
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="col-span-2 flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Open-Meteo · ERA5 · CMIP6 · {dataLabel}</span>
                  <a
                    href="https://leswww.com/mentions-legales/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-neutral-600 transition-colors"
                  >
                    Mentions légales
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
