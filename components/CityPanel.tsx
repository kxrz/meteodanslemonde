"use client"

import { CityFR, CityWorld, AnyCity } from "@/lib/types"
import { getWeather } from "@/lib/weather-codes"

interface Props {
  city: AnyCity | null
  twins: AnyCity[]
  onTwinClick: (id: string) => void
  onClose: () => void
}

export default function CityPanel({ city, twins, onTwinClick, onClose }: Props) {
  if (!city) return null

  const { label, emoji } = getWeather(city.weathercode)
  const isFR = city.type === "fr"

  return (
    <div className="fixed sm:absolute bottom-0 sm:top-4 left-0 sm:left-auto right-0 sm:right-4 z-[1000] w-full sm:w-80 bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-neutral-200 border-b-0 sm:border-b overflow-hidden max-h-[85vh] flex flex-col">
      <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
        <div className="w-10 h-1 rounded-full bg-neutral-200" />
      </div>

      <div className={`px-5 py-4 ${isFR ? "bg-blue-600" : "bg-emerald-600"} text-white shrink-0`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest opacity-80 mb-1">
              {isFR ? (city as CityFR).region : (city as CityWorld).country}
            </div>
            <h2 className="text-xl font-bold">{city.name}</h2>
            {!isFR && (
              <div className="text-xs opacity-75 mt-1">{(city as CityWorld).climateLabel}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 mt-1 opacity-70 hover:opacity-100 text-white text-lg leading-none"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-neutral-100 shrink-0">
        <div className="flex items-start gap-3">
          <span className="text-4xl mt-1">{emoji}</span>
          <div className="flex-1">
            {isFR ? (
              <>
                <div className="text-3xl font-bold text-neutral-900">{city.apparent_temp_max}°C</div>
                <div className="text-sm text-neutral-400 mt-0.5">ressenti max · {label}</div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-neutral-900">{city.temp}°C</div>
                <div className="text-sm text-neutral-500 mt-0.5">{label}</div>
                <div className="flex gap-3 mt-2 text-xs text-neutral-400">
                  <span>max <span className="font-semibold text-neutral-600">{city.temp_max}°</span></span>
                  <span>ressenti max <span className="font-semibold text-orange-500">{city.apparent_temp_max}°</span></span>
                </div>
              </>
            )}
          </div>
          <div className="text-right text-xs text-neutral-400 space-y-1 shrink-0">
            <div>💧 {city.humidity}%</div>
            <div>💨 {city.wind} km/h</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 overflow-y-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
          {isFR ? "Jumeaux climatiques du jour" : "Villes françaises similaires"}
        </div>
        <div className="text-[10px] text-neutral-300 mb-3">
          Basé sur le ressenti max · ±4°C
        </div>
        {twins.length === 0 ? (
          <p className="text-xs text-neutral-400 italic">Aucun jumeau trouvé aujourd'hui</p>
        ) : (
          <div className="space-y-2">
            {twins.map((twin) => {
              const tw = getWeather(twin.weathercode)
              const diff = twin.apparent_temp_max - city.apparent_temp_max
              const diffStr = diff === 0 ? "=" : diff > 0 ? `+${diff}°` : `${diff}°`
              return (
                <button
                  key={twin.id}
                  onClick={() => onTwinClick(twin.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 text-left transition-colors border border-neutral-100"
                >
                  <span className="text-lg">{tw.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-neutral-800 truncate">{twin.name}</div>
                    <div className="text-xs text-neutral-400 truncate">
                      {twin.type === "world"
                        ? (twin as CityWorld).climateLabel
                        : (twin as CityFR).region}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold text-sm text-neutral-700">{twin.apparent_temp_max}°</div>
                    <div className={`text-[10px] ${diff === 0 ? "text-neutral-400" : diff > 0 ? "text-red-400" : "text-blue-400"}`}>
                      {diffStr}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-5 py-2 bg-neutral-50 border-t border-neutral-100 shrink-0">
        <p className="text-[10px] text-neutral-400">Open-Meteo · données du jour</p>
      </div>
    </div>
  )
}
