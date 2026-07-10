"use client"

import dynamic from "next/dynamic"

interface City {
  id: string
  name: string
  lat: number
  lon: number
  apparent_temp_max: number
  anomaly: number | null
}

interface Props {
  cities: City[]
}

const MiniHeatMapLeaflet = dynamic(() => import("./MiniHeatMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-200/50" style={{ minHeight: 260 }}>
      <span className="text-neutral-400 text-sm">Chargement…</span>
    </div>
  ),
})

export default function MiniHeatMap({ cities }: Props) {
  return <MiniHeatMapLeaflet cities={cities} />
}
