"use client"

import dynamic from "next/dynamic"

interface FireFeature {
  type: "Feature"
  geometry: { type: "Point"; coordinates: [number, number] }
  properties: { firedate: string; confidence: string; frp: number }
}

interface CityFR {
  id: string; name: string; lat: number; lon: number; region: string
}

interface Props {
  geojson: { type: "FeatureCollection"; features: FireFeature[] }
  cities?: CityFR[]
}

const FireMap = dynamic(() => import("@/components/FireMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-3xl">
      <span className="text-neutral-400 text-sm">Chargement de la carte…</span>
    </div>
  ),
})

export default function FireMapWrapper({ geojson, cities }: Props) {
  return <FireMap geojson={geojson} cities={cities} />
}
