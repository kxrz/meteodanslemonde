"use client"

import { useEffect, useState } from "react"

/** Date du jour côté navigateur (le HTML mis en cache ne peut pas la connaître). */
export default function Today({ className }: { className?: string }) {
  const [label, setLabel] = useState<string | null>(null)
  useEffect(() => {
    setLabel(new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }))
  }, [])
  return <span className={className}>{label ?? " "}</span>
}
