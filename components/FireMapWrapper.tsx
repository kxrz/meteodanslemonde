"use client"

import dynamic from "next/dynamic"

interface FireFeature {
  type: "Feature"
  geometry: { type: "Point"; coordinates: [number, number] }
  properties: { firedate: string; confidence: string; frp: number }
}

interface Props {
  geojson: { type: "FeatureCollection"; features: FireFeature[] }
}

const FireMap = dynamic(() => import("@/components/FireMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-100">
      <span className="text-neutral-400 text-sm">Chargement de la carte…</span>
    </div>
  ),
})

export default function FireMapWrapper({ geojson }: Props) {
  return <FireMap geojson={geojson} />
}
