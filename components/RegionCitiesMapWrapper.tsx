"use client"

import dynamic from "next/dynamic"

interface City {
  id: string
  name: string
  lat: number
  lon: number
  normal: number | null
  trend: number | null
}

const RegionCitiesMap = dynamic(() => import("@/components/RegionCitiesMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-200/40 rounded-3xl">
      <span className="text-neutral-400 text-sm">Chargement de la carte…</span>
    </div>
  ),
})

export default function RegionCitiesMapWrapper({ cities }: { cities: City[] }) {
  return <RegionCitiesMap cities={cities} />
}
