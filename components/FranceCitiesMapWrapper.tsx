"use client"

import dynamic from "next/dynamic"

interface City {
  id: string
  name: string
  lat: number
  lon: number
  region: string
  apparent_temp_max: number
  anomaly: number | null
}

const FranceCitiesMap = dynamic(() => import("@/components/FranceCitiesMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-200/40 rounded-3xl">
      <span className="text-neutral-400 text-sm">Chargement de la carte…</span>
    </div>
  ),
})

export default function FranceCitiesMapWrapper({ cities }: { cities: City[] }) {
  return <FranceCitiesMap cities={cities} />
}
