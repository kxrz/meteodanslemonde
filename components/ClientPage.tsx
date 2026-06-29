"use client"

import dynamic from "next/dynamic"
import { useState, useMemo, useEffect } from "react"
import { CityFR, CityWorld, AnyCity, ClimateMap } from "@/lib/types"
import { getWeather } from "@/lib/weather-codes"
import { getClimateValues } from "@/lib/use-climate-data"

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

interface Props {
  citiesFR: CityFR[]
  citiesWorld: CityWorld[]
  fetchedAt: string
  climateMap: ClimateMap
}

export default function ClientPage({ citiesFR, citiesWorld, fetchedAt, climateMap }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [heroCity, setHeroCity] = useState(citiesFR[0])
  const [nowStr, setNowStr] = useState("")

  useEffect(() => {
    setHeroCity(citiesFR[Math.floor(Math.random() * citiesFR.length)])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const d = new Date()
    const date = d.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    })
    const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    const cap = date.charAt(0).toUpperCase() + date.slice(1)
    setNowStr(`Nous sommes le ${cap}, il est ${time}. `)
  }, [])

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

  const currentMonth = new Date().getMonth() + 1
  const climate = getClimateValues(
    selectedCity ? climateMap[selectedCity.id] : null,
    currentMonth,
    selectedCity?.apparent_temp_max ?? 0
  )

  const hasGiecData = climate.proj2030 !== null || climate.proj2040 !== null || climate.proj2050 !== null

  // Build GIEC rows: clamp negative deltas to 0 (small negatives = model noise,
  // not genuine cooling — caused by 3-year window variance at end of CMIP6 run)
  const giecRows = selectedCity ? ([
    { year: 2030, delta: climate.proj2030 },
    { year: 2040, delta: climate.proj2040 },
    { year: 2050, delta: climate.proj2050 },
  ] as { year: number; delta: number | null }[])
    .filter((r) => r.delta !== null)
    .map(({ year, delta }) => {
      const d = delta as number
      const stable = d < 0
      const displayDelta = Math.max(0, d)
      return {
        year,
        rawDelta: d,
        stable,
        displayDelta,
        abs: Math.round(selectedCity.apparent_temp_max + displayDelta),
      }
    }) : []

  function handleCityClick(id: string) {
    setSelectedId((prev) => (prev === id ? null : id))
    setShowInfo(false)
  }

  const dataLabel = new Date(fetchedAt).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })
  const isFR = selectedCity?.type === "fr"
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })

  return (
    <div className="h-screen flex flex-col bg-[#f9f8f5] overflow-hidden">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <header className="shrink-0 px-5 lg:px-8 pt-5 pb-4 border-b border-black/5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none text-neutral-900">
              En vrai, c&apos;est{" "}
              <span className="underline decoration-red-500 decoration-[3px] underline-offset-4">chaud</span>.
            </h1>
            <p className="text-[11px] text-neutral-500 mt-2 leading-snug">
              {nowStr && <span className="text-neutral-400">{nowStr}</span>}
              Le ressenti d&apos;aujourd&apos;hui, les villes jumelles dans le monde,
              et ce que le GIEC prédit pour 2030–2050.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-1.5 shrink-0 text-xs text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            {dataLabel}
          </div>
        </div>
      </header>

      {/* ── Map + Panel ────────────────────────────────────────── */}
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

            {selectedCity ? (

              // ── Ville sélectionnée ───────────────────────────────────
              <>
                {/* Météo principale */}
                <div className={`col-span-2 rounded-3xl p-6 ${isFR ? "bg-[#dbeafe]" : "bg-[#d1fae5]"}`}>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-1">
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
                      className="text-black/30 hover:text-black/70 mt-1 shrink-0 transition-colors"
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
                      <p className="text-xs text-neutral-600 mt-2">
                        {getWeather(selectedCity.weathercode).emoji}{" "}
                        {getWeather(selectedCity.weathercode).label} · ressenti max
                      </p>
                    </div>
                    <div className="text-right text-xs text-neutral-600 space-y-1">
                      <div>💧 {selectedCity.humidity}%</div>
                      <div>💨 {selectedCity.wind} km/h</div>
                    </div>
                  </div>
                </div>

                {/* En temps normal */}
                <div className="bg-[#c8dfc4] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/65 mb-4">
                    En temps normal
                  </p>
                  {climate.normal !== null ? (
                    <>
                      <div className="text-[44px] font-black text-green-900 leading-none tabular-nums">
                        {climate.normal}°
                      </div>
                      <p className="text-xs text-green-900/65 mt-2">
                        {monthName} 1991–2020
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-green-900/40 italic mt-2">données insuffisantes</p>
                  )}
                </div>

                {/* L'écart */}
                <div className={`rounded-3xl p-5 ${
                  climate.anomaly !== null && climate.anomaly > 2
                    ? "bg-[#f4a27a]"
                    : climate.anomaly !== null && climate.anomaly < -2
                    ? "bg-[#a8c4d4]"
                    : "bg-neutral-200"
                }`}>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/55 mb-4">
                    L&apos;écart
                  </p>
                  {climate.anomaly !== null ? (
                    <>
                      <div className="text-[44px] font-black text-neutral-900 leading-none tabular-nums">
                        {climate.anomaly > 0 ? "+" : ""}{climate.anomaly}°
                      </div>
                      <p className="text-xs text-black/60 mt-2">
                        {climate.anomaly > 2
                          ? "au-dessus de la normale"
                          : climate.anomaly < -2
                          ? "en-dessous de la normale"
                          : "dans la normale"}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-black/40 italic mt-2">données insuffisantes</p>
                  )}
                </div>

                {/* Ce qui a changé */}
                <div className="col-span-2 bg-white rounded-3xl p-5 border border-black/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-2">
                    Ce qui a changé · 30 ans
                  </p>
                  {climate.trend !== null ? (
                    <p className="text-2xl font-black text-neutral-900">
                      {climate.trend > 0 ? "+" : ""}{climate.trend}°C
                      <span className="text-sm font-normal text-neutral-500 ml-2">
                        depuis 1990 en {monthName}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">données insuffisantes</p>
                  )}
                </div>

                {/* Ce qui vient — GIEC */}
                <div className="col-span-2 bg-[#e4dff0] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/65 mb-1">
                    Ce qui vient · GIEC
                  </p>
                  <p className="text-[10px] text-purple-900/55 mb-5">
                    Si rien ne change · ressenti estimé un jour comme aujourd&apos;hui
                  </p>
                  {hasGiecData ? (
                    <div className="divide-y divide-purple-900/10">
                      {giecRows.map(({ year, stable, displayDelta, abs }) => (
                        <div key={year} className="flex items-center justify-between py-3">
                          <span className="text-sm font-semibold text-purple-900/60">{year}</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-purple-900/45">
                              {stable ? "~+0°" : `+${displayDelta}°`}
                            </span>
                            <span className="font-black text-3xl text-purple-900 tabular-nums">
                              {abs}°C
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-purple-900/50 italic">données insuffisantes</p>
                  )}
                </div>

                {/* Le même ressenti, ailleurs */}
                <div className="col-span-2 bg-white rounded-3xl p-5 border border-black/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-3">
                    {isFR ? "Le même ressenti, ailleurs" : "Villes françaises similaires"}
                  </p>
                  {twins.length === 0 ? (
                    <p className="text-sm text-neutral-500">Aucune ville à ±4°C aujourd&apos;hui.</p>
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
                              <div className="font-semibold text-sm text-neutral-800 truncate">{twin.name}</div>
                              <div className="text-xs text-neutral-500 truncate">{sub}</div>
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

                {/* Footer ville */}
                <div className="col-span-2 flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Open-Meteo · ERA5 · CMIP6 · {dataLabel}</span>
                  <a href="https://leswww.com/mentions-legales/" target="_blank" rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-neutral-600 transition-colors">
                    Mentions légales
                  </a>
                </div>
              </>

            ) : showInfo ? (

              // ── Méthode & sources ─────────────────────────────────
              <>
                <div className="col-span-2 flex items-center justify-between px-1 mb-1">
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
                  >
                    ← Retour
                  </button>
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400">
                    Méthode &amp; sources
                  </span>
                </div>

                <div className="col-span-2 bg-[#dbeafe] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/65 mb-3">
                    Jumeaux climatiques
                  </p>
                  <p className="text-sm text-blue-900/80 leading-relaxed">
                    Deux villes sont jumelles si leur{" "}
                    <strong className="text-blue-900">ressenti maximal journalier</strong>{" "}
                    diffère de moins de 4°C. On compare chaque ville française aux villes
                    mondiales — et inversement.
                  </p>
                </div>

                <div className="col-span-2 bg-[#e4dff0] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/65 mb-3">
                    Projections GIEC
                  </p>
                  <p className="text-sm text-purple-900/75 leading-relaxed">
                    Les projections viennent du modèle{" "}
                    <strong className="text-purple-900">CMIP6 MRI_AGCM3_2_S</strong>{" "}
                    (GIEC AR6). On calcule l&apos;écart projeté pour 2030, 2040 et 2050
                    par rapport à 2000–2020, puis on l&apos;ajoute au ressenti du jour
                    pour donner une température concrète.
                  </p>
                </div>

                <div className="bg-[#d1fae5] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-emerald-900/65 mb-3">
                    Sources
                  </p>
                  <ul className="text-xs text-emerald-900/75 space-y-1.5 leading-relaxed">
                    <li><strong className="text-emerald-900">Météo</strong> · Open-Meteo API</li>
                    <li><strong className="text-emerald-900">Historique</strong> · ERA5 (1991–2024)</li>
                    <li><strong className="text-emerald-900">Projections</strong> · CMIP6 via Open-Meteo</li>
                  </ul>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-black/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-3">
                    À propos
                  </p>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Fait par un passionné de météo et amoureux des cartes, qui croit
                    qu&apos;on peut comprendre le climat sans être climatologue.
                  </p>
                  <a href="https://leswww.com" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-800 mt-2 inline-block transition-colors">
                    leswww.com →
                  </a>
                </div>

                <div className="col-span-2 flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>cestchaud.fr · {dataLabel}</span>
                  <a href="https://leswww.com/mentions-legales/" target="_blank" rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-neutral-600 transition-colors">
                    Mentions légales
                  </a>
                </div>
              </>

            ) : (

              // ── État par défaut ─────────────────────────────────
              <>
                {/* Température hero */}
                <div className="col-span-2 bg-white rounded-3xl p-6 border border-black/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-5">
                    En ce moment · France
                  </p>
                  <div className="text-[80px] font-black text-neutral-900 leading-none tabular-nums">
                    {heroCity.apparent_temp_max}°
                  </div>
                  <p className="text-sm text-neutral-600 mt-3">
                    {getWeather(heroCity.weathercode).emoji}{" "}
                    <span className="font-semibold">{heroCity.name}</span>
                    <span className="text-neutral-500"> · ressenti max</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-4 pt-4 border-t border-black/5">
                    Touchez une ville sur la carte.
                  </p>
                </div>

                {/* Compteur FR */}
                <div className="bg-[#dbeafe] rounded-3xl p-5 flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/65 mb-auto pb-8">
                    🇫🇷 France
                  </span>
                  <div className="text-[60px] font-black text-blue-900 leading-none tabular-nums">
                    {citiesFR.length}
                  </div>
                  <div className="text-xs text-blue-900/60 mt-1">villes</div>
                </div>

                {/* Compteur Monde */}
                <div className="bg-[#d1fae5] rounded-3xl p-5 flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-emerald-900/65 mb-auto pb-8">
                    🌍 Monde
                  </span>
                  <div className="text-[60px] font-black text-emerald-900 leading-none tabular-nums">
                    {citiesWorld.length}
                  </div>
                  <div className="text-xs text-emerald-900/60 mt-1">villes</div>
                </div>

                {/* Comment ça marche */}
                <div className="col-span-2 bg-white rounded-3xl p-5 border border-black/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-3">
                    Comment ça marche
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    On compare le{" "}
                    <strong className="text-neutral-900">ressenti maximal</strong>{" "}
                    de chaque ville. Les villes à ±4°C deviennent des{" "}
                    <strong className="text-neutral-900">jumeaux climatiques</strong>.
                    Les projections{" "}
                    <strong className="text-neutral-900">CMIP6</strong>{" "}
                    donnent les températures estimées pour 2030, 2040 et 2050.
                  </p>
                  <button
                    onClick={() => setShowInfo(true)}
                    className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-800 mt-3 transition-colors"
                  >
                    Méthode &amp; sources →
                  </button>
                </div>

                {/* Footer */}
                <div className="col-span-2 flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Open-Meteo · ERA5 · CMIP6 · {dataLabel}</span>
                  <span>
                    © <a href="https://leswww.com" target="_blank" rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-neutral-600 transition-colors">
                      LesWWW
                    </a>
                    {" · "}
                    <a href="https://leswww.com/mentions-legales/" target="_blank" rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-neutral-600 transition-colors">
                      Mentions légales
                    </a>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
