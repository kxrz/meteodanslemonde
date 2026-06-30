"use client"

import dynamic from "next/dynamic"

const CityMap = dynamic(() => import("@/components/CityMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-100">
      <span className="text-neutral-400 text-sm">Chargement…</span>
    </div>
  ),
})

export default function CityMapWrapper(props: { lat: number; lon: number; name: string }) {
  return <CityMap {...props} />
}
