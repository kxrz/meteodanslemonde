"use client"

import { useEffect } from "react"

/** Sur mobile, le défilement de la page s'aimante sur les cartes (comme un fil de stories). */
export default function SnapScroll() {
  useEffect(() => {
    const html = document.documentElement
    const classes = ["max-sm:snap-y", "max-sm:snap-proximity", "max-sm:scroll-pt-16"]
    html.classList.add(...classes)
    return () => html.classList.remove(...classes)
  }, [])
  return null
}
