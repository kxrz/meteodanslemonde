"use client"

import { useState } from "react"
import SubscribeModal from "@/components/SubscribeModal"

export default function PushOptIn({ cityName, citySlug }: { cityId: string; cityName: string; citySlug: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
        Recevoir {cityName} chaque matin
      </button>
      {open && (
        <SubscribeModal
          cityName={cityName}
          citySlug={citySlug}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
