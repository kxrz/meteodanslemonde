"use client"

import dynamic from "next/dynamic"
import { useState, useMemo, useRef, useEffect } from "react"
import citiesFRRaw from "@/data/cities-fr.json"
import citiesWorldRaw from "@/data/cities-world.json"
import metaRaw from "@/data/meta.json"
import { CityFR, CityWorld, AnyCity } from "@/lib/types"
import CityPanel from "@/components/CityPanel"

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-100">
      <div className="text-neutral-400 text-sm">Chargement de la carte…</div>
    </div>
  ),
})

const citiesFR: CityFR[] = citiesFRRaw as CityFR[]
const citiesWorld: CityWorld[] = citiesWorldRaw as CityWorld[]

const allCities: AnyCity[] = [
  ...citiesFR.map((c) => ({ ...c, type: "fr" as const })),
  ...citiesWorld.map((c) => ({ ...c, type: "world" as const })),
]

const TWIN_MAX_DIFF = 4
const TWIN_COUNT = 5

function computeTwins(city: AnyCity): AnyCity[] {
  const ref = city.apparent_temp_max
  const pool = city.type === "fr"
    ? allCities.filter((c) => c.type === "world")
    : allCities.filter((c) => c.type === "fr")

  return pool
    .map((c) => ({ city: c, diff: Math.abs(c.apparent_temp_max - ref) }))
    .filter(({ diff }) => diff <= TWIN_MAX_DIFF)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, TWIN_COUNT)
    .map(({ city }) => city)
}

const fetchedAt = (metaRaw as { fetchedAt: string }).fetchedAt
const dataLabel = new Date(fetchedAt).toLocaleDateString("fr-FR", {
  day: "numeric", month: "long", year: "numeric",
})

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [legendPos, setLegendPos] = useState({ x: 16, y: 16 })
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const isDragging = useRef(false)

  const selectedCity = useMemo(
    () => allCities.find((c) => c.id === selectedId) ?? null,
    [selectedId]
  )

  const twins = useMemo(
    () => (selectedCity ? computeTwins(selectedCity) : []),
    [selectedCity]
  )

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return
      isDragging.current = true
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setLegendPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy })
    }
    function onMouseUp() {
      dragRef.current = null
      setTimeout(() => { isDragging.current = false }, 0)
    }
    function onTouchMove(e: TouchEvent) {
      if (!dragRef.current) return
      isDragging.current = true
      const t = e.touches[0]
      const dx = t.clientX - dragRef.current.startX
      const dy = t.clientY - dragRef.current.startY
      setLegendPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy })
    }
    function onTouchEnd() {
      dragRef.current = null
      setTimeout(() => { isDragging.current = false }, 0)
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("touchend", onTouchEnd)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
    }
  }, [])

  function handleCityClick(id: string) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Hero */}
      <header className="bg-white border-b border-neutral-200 px-6 py-10 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Météo &amp; Climat
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">Chaud comme là.</h1>
          <p className="text-lg text-neutral-500 leading-relaxed">
            Quand il fait 38°C à Lille, où dans le monde est-ce la normale ?
            Explorez les <span className="text-blue-600 font-medium">jumeaux climatiques</span> de vos villes françaises.
          </p>
        </div>
      </header>

      {/* Map */}
      <section className="relative" style={{ height: "85vh" }}>
        {/* Draggable legend */}
        <div
          className="absolute z-[1000] bg-white rounded-lg shadow-md px-4 py-3 space-y-1.5 select-none cursor-grab active:cursor-grabbing"
          style={{ left: legendPos.x, top: legendPos.y }}
          onMouseDown={(e) => {
            dragRef.current = { startX: e.clientX, startY: e.clientY, origX: legendPos.x, origY: legendPos.y }
            e.preventDefault()
          }}
          onTouchStart={(e) => {
            const t = e.touches[0]
            dragRef.current = { startX: t.clientX, startY: t.clientY, origX: legendPos.x, origY: legendPos.y }
          }}
        >
          <p className="text-xs font-semibold text-neutral-700 mb-1">Cliquez sur une ville</p>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow" />
            Villes françaises ({citiesFR.length})
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow" />
            Villes mondiales ({citiesWorld.length})
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1 border-t border-neutral-100">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow" />
            Sélectionnée / jumeau
          </div>
          <p className="text-[10px] text-neutral-600 pt-1 border-t border-neutral-100">
            Données du {dataLabel}
          </p>
        </div>

        <Map
          citiesFR={citiesFR}
          citiesWorld={citiesWorld}
          selectedId={selectedId}
          twinIds={twins.map((t) => t.id)}
          onCityClick={(id) => handleCityClick(id)}
        />

        <CityPanel
          city={selectedCity}
          twins={twins}
          onTwinClick={handleCityClick}
          onClose={() => setSelectedId(null)}
        />
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-neutral-200 py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-neutral-800 mb-8 text-center">Comment ça fonctionne ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center px-4">
              <div className="text-3xl mb-3">🌡️</div>
              <h3 className="font-semibold text-neutral-800 mb-2">Données en temps réel</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Les températures sont récupérées chaque jour via <strong>Open-Meteo</strong>, une API météo libre et gratuite.
              </p>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-semibold text-neutral-800 mb-2">Comparaison par ressenti</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                On compare le <strong>ressenti maximal journalier</strong> — plus représentatif que la température brute — entre villes françaises et mondiales.
              </p>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="font-semibold text-neutral-800 mb-2">Jumeaux climatiques</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Chaque ville est associée aux villes où le ressenti du jour est identique, à <strong>±4°C près</strong>. Un miroir vivant du climat mondial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Heat tips */}
      <section className="bg-orange-50 border-t border-orange-100 py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-neutral-800 mb-2 text-center">Face à la chaleur</h2>
          <p className="text-center text-sm text-neutral-500 mb-8">Quelques réflexes simples quand les températures grimpent</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
              <div className="text-2xl mb-3">💧</div>
              <h3 className="font-semibold text-neutral-800 mb-2">Boire avant d'avoir soif</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                La sensation de soif est un signal tardif. Buvez régulièrement, même sans en ressentir le besoin, et évitez alcool et caféine.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
              <div className="text-2xl mb-3">🪟</div>
              <h3 className="font-semibold text-neutral-800 mb-2">Gérer les flux d'air</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Ouvrez la nuit pour laisser entrer l'air frais, fermez volets et fenêtres dès le matin. L'inertie thermique du bâtiment fait le reste.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
              <div className="text-2xl mb-3">🕑</div>
              <h3 className="font-semibold text-neutral-800 mb-2">Adapter ses horaires</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Déplacez les activités physiques en dehors de la plage 11h–18h. Les pics de chaleur sont plus dangereux qu'il n'y paraît.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-8 px-6 mt-auto">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <p>Aucune donnée personnelle collectée. Ce site ne dépose aucun cookie.</p>
          <div className="flex items-center gap-4">
            <p>
              Réalisé par{" "}
              <span className="text-neutral-200 font-medium">leswww.com</span>
              {" "}· Expérience météo &amp; données ouvertes
            </p>
            <a
              href="https://github.com/kxrz/meteodanslemonde"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Forker sur GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
