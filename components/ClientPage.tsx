"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useState, useMemo } from "react"
import { CityFR, CityWorld, AnyCity } from "@/lib/types"
import { slugify } from "@/lib/slugify"
import { getWeather } from "@/lib/weather-codes"
import { useClimateData } from "@/lib/use-climate-data"

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-200/50 rounded-3xl">
      <span className="text-neutral-400 text-sm">Chargement de la carte…</span>
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
  return <div className={`bg-black/10 rounded-xl animate-pulse ${className ?? ""}`} />
}

interface Props {
  citiesFR: CityFR[]
  citiesWorld: CityWorld[]
  fetchedAt: string
}

export default function ClientPage({ citiesFR, citiesWorld, fetchedAt }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [heroCity] = useState(
    () => citiesFR[Math.floor(Math.random() * citiesFR.length)]
  )

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

  const now = new Date()
  const dayName = now.toLocaleDateString("fr-FR", { weekday: "long" })
  const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  const dateLabel = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  const timeLabel = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  const monthName = now.toLocaleDateString("fr-FR", { month: "long" })

  const isFR = selectedCity?.type === "fr"

  return (
    <div className="h-screen flex flex-col bg-[#f5f4f0] overflow-hidden">

      {/* Header */}
      <header className="shrink-0 px-5 pt-4 pb-3 border-b border-black/5 bg-[#f5f4f0]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 leading-none">
              En vrai, c’est chaud.
            </h1>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Nous sommes le {dayNameCap} {dateLabel}. Il est {timeLabel}.{" "}
              Le ressenti d’aujourd’hui, les villes jumelles dans le monde, et ce que le GIEC prédit pour 2030–2050.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-neutral-500">{dateLabel}</span>
            </div>
            <Link
              href="/en/france"
              className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors whitespace-nowrap"
            >
              La France en chiffres →
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

        {/* Map */}
        <div className="h-[42vh] lg:h-auto lg:w-[60%] shrink-0 relative">
          <Map
            citiesFR={citiesFR}
            citiesWorld={citiesWorld}
            selectedId={selectedId}
            twinIds={twins.map((t) => t.id)}
            onCityClick={(id) => handleCityClick(id)}
          />
        </div>

        {/* Bento panel */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4">
          <div className="grid grid-cols-2 gap-3 pb-4">

            {!selectedCity ? (

              // ── État par défaut
              <>
                {/* Hero */}
                <div className="col-span-2 bg-white rounded-3xl p-6">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-5">
                    En ce moment · France
                  </p>
                  <p className="text-neutral-500 text-sm mb-0.5">il fait</p>
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <span className="text-7xl font-black text-neutral-900">
                      {heroCity.apparent_temp_max}°
                    </span>
                    <span className="text-3xl font-black text-neutral-300">C</span>
                  </div>
                  <p className="text-neutral-600 text-sm mt-1.5">
                    <span className="font-bold text-neutral-900">{heroCity.name}</span>
                    <span className="text-neutral-400"> · ressenti max</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-4 leading-relaxed">
                    Touchez une ville sur la carte.
                  </p>
                </div>

                {/* Compteur FR */}
                <div className="bg-[#dbeafe] rounded-3xl p-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-sm">🇫🇷</span>
                    <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-800">
                      France
                    </span>
                  </div>
                  <div className="text-5xl font-black text-blue-900 leading-none">
                    {citiesFR.length}
                  </div>
                  <div className="text-xs text-blue-700 mt-1.5">villes</div>
                </div>

                {/* Compteur Monde */}
                <div className="bg-[#d1fae5] rounded-3xl p-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-sm">🌍</span>
                    <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-emerald-800">
                      Monde
                    </span>
                  </div>
                  <div className="text-5xl font-black text-emerald-900 leading-none">
                    {citiesWorld.length}
                  </div>
                  <div className="text-xs text-emerald-700 mt-1.5">villes</div>
                </div>

                {/* Comment ça marche */}
                <div className="col-span-2 bg-white rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                    Comment ça marche
                  </p>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    On compare le <strong className="text-neutral-900">ressenti maximal journalier</strong> de chaque ville.
                    Les villes à ±4°C deviennent des <strong className="text-neutral-900">jumeaux climatiques</strong>.
                    En plus : données historiques ERA5 et projections GIEC (CMIP6).
                  </p>
                </div>

                {/* Source */}
                <div className="col-span-2 bg-neutral-100 rounded-3xl p-4 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Open-Meteo · ERA5 · CMIP6</span>
                  <Link href="/en/france" className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
                    La France en chiffres →
                  </Link>
                </div>

                {/* Footer */}
                <div className="col-span-2 text-center text-xs text-neutral-400 pb-1">
                  <a href="https://leswww.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-600">
                    © LesWWW
                  </a>
                  {" · "}
                  <a href="https://leswww.com/mentions-legales/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-neutral-600">
                    Mentions légales
                  </a>
                </div>
              </>

            ) : (

              // ── Ville sélectionnée
              <>
                {/* Météo principale */}
                <div className={`col-span-2 ${isFR ? "bg-[#dbeafe]" : "bg-[#d1fae5]"} rounded-3xl p-6`}>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold opacity-40 mb-1">
                        {isFR
                          ? (selectedCity as CityFR).region
                          : (selectedCity as CityWorld).country}
                      </p>
                      <h2 className="text-2xl font-black text-neutral-900 leading-tight">
                        {selectedCity.name}
                      </h2>
                      {!isFR && (
                        <p className="text-xs opacity-50 mt-0.5">
                          {(selectedCity as CityWorld).climateLabel}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="text-black/30 hover:text-black/70 text-sm mt-1 shrink-0 transition-colors"
                      aria-label="Fermer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-1 leading-none">
                        <span className="text-6xl font-black text-neutral-900">
                          {selectedCity.apparent_temp_max}°
                        </span>
                        <span className="text-2xl font-black text-neutral-400">C</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1.5">
                        {getWeather(selectedCity.weathercode).emoji}{" "}
                        ressenti max · {getWeather(selectedCity.weathercode).label}
                      </p>
                    </div>
                    <div className="text-right text-xs text-neutral-500 space-y-1">
                      <div>💧 {selectedCity.humidity}%</div>
                      <div>💨 {selectedCity.wind} km/h</div>
                    </div>
                  </div>
                </div>

                {/* Normale */}
                <div className="bg-[#b8d4b0] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/50 mb-3">
                    Normalement
                  </p>
                  {climate.loading ? (
                    <>
                      <Skeleton className="h-10 w-20 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </>
                  ) : climate.normal !== null ? (
                    <>
                      <div className="text-4xl font-black text-green-900 leading-none">
                        {climate.normal}°C
                      </div>
                      <p className="text-xs text-green-900/50 mt-2">
                        moy. {monthName} 1991–2020
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-black text-green-900/30">—</p>
                  )}
                </div>

                {/* Anomalie */}
                <div
                  className={`rounded-3xl p-5 transition-colors ${
                    climate.anomaly !== null && climate.anomaly > 2
                      ? "bg-[#f4a27a]"
                      : climate.anomaly !== null && climate.anomaly < -2
                      ? "bg-[#a8c4d4]"
                      : "bg-neutral-200"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-black/40 mb-3">
                    Aujourd’hui c’est
                  </p>
                  {climate.loading ? (
                    <>
                      <Skeleton className="h-10 w-20 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </>
                  ) : climate.anomaly !== null ? (
                    <>
                      <div className="text-4xl font-black text-neutral-900 leading-none">
                        {climate.anomaly > 0 ? "+" : ""}{climate.anomaly}°C
                      </div>
                      <p className="text-xs text-black/50 mt-2">
                        {climate.anomaly > 2
                          ? "au-dessus de la normale"
                          : climate.anomaly < -2
                          ? "en-dessous de la normale"
                          : "dans la normale"}
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-black text-black/20">—</p>
                  )}
                </div>

                {/* Tendance 30 ans */}
                <div className="col-span-2 bg-white rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                    Tendance observée · 30 ans
                  </p>
                  {climate.loading ? (
                    <Skeleton className="h-7 w-40" />
                  ) : climate.trend !== null ? (
                    <p className="font-black text-xl text-neutral-900">
                      {climate.trend > 0 ? "+" : ""}{climate.trend}°C
                      <span className="text-sm font-normal text-neutral-400 ml-2">
                        depuis 1990 sur {monthName}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-400">Données non disponibles</p>
                  )}
                </div>

                {/* Projections GIEC */}
                <div className="col-span-2 bg-[#c4b8d4] rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/50 mb-1">
                    Si rien ne change…
                  </p>
                  <p className="text-[10px] text-purple-900/40 mb-4">
                    Modèle CMIP6 (GIEC AR6) · écart vs. 2000–2020
                  </p>
                  {climate.loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-7 w-full" />
                      <Skeleton className="h-7 w-full" />
                      <Skeleton className="h-7 w-full" />
                    </div>
                  ) : climate.error ? (
                    <p className="text-xs text-purple-900/40">Données non disponibles</p>
                  ) : (
                    <div className="space-y-2.5">
                      {(
                        [
                          { year: 2030, val: climate.proj2030 },
                          { year: 2040, val: climate.proj2040 },
                          { year: 2050, val: climate.proj2050 },
                        ] as { year: number; val: number | null }[]
                      ).map(({ year, val }) => (
                        <div key={year} className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-purple-900/60">{year}</span>
                          <span className="font-black text-2xl text-purple-900">
                            {val !== null
                              ? `${val >= 0 ? "+" : ""}${val.toFixed(1)}°C`
                              : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Jumeaux */}
                <div className="col-span-2 bg-white rounded-3xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                    {isFR ? "Aujourd’hui, c’est comme à…" : "Villes françaises similaires"}
                  </p>
                  {twins.length === 0 ? (
                    <p className="text-sm text-neutral-400">Aucun jumeau à ±4°C.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {twins.map((twin) => {
                        const tw = getWeather(twin.weathercode)
                        const sub =
                          twin.type === "world"
                            ? (twin as CityWorld).country
                            : (twin as CityFR).region
                        return (
                          <button
                            key={twin.id}
                            onClick={() => handleCityClick(twin.id)}
                            className="w-full flex items-center gap-3 py-2.5 px-3 rounded-2xl hover:bg-neutral-50 text-left transition-colors border border-neutral-100"
                          >
                            <span className="text-lg">{tw.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-neutral-800 truncate">{twin.name}</div>
                              <div className="text-xs text-neutral-400 truncate">{sub}</div>
                            </div>
                            <div className="shrink-0 font-black text-sm text-neutral-700">
                              {twin.apparent_temp_max}°C
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* CTA fiche ville (FR only) */}
                {isFR && (
                  <Link
                    href={`/a/${slugify(selectedCity.name)}`}
                    className="col-span-2 flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-3xl px-6 py-5 group"
                  >
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 mb-1">
                        Fiche complète
                      </p>
                      <p className="text-lg font-black text-white">
                        {selectedCity.name} · données &amp; projections
                      </p>
                    </div>
                    <span className="text-white/40 group-hover:text-white/80 text-2xl transition-colors">→</span>
                  </Link>
                )}

                {/* Footer */}
                <div className="col-span-2 text-center text-xs text-neutral-400 pb-1">
                  cestchaud.fr · Open-Meteo · ERA5 · CMIP6 ·{" "}
                  <a href="https://leswww.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-600">© LesWWW</a>
                  {" · "}
                  <a href="https://leswww.com/mentions-legales/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-neutral-600">Mentions légales</a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
