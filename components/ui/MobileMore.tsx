"use client"

import { useId, useState } from "react"
import { cn } from "@/lib/cn"

/**
 * Contenu secondaire replié sur mobile, toujours visible à partir de `md`.
 * Sur téléphone, un bouton « En savoir plus » le déplie : la page reste courte,
 * l'information reste à un toucher (et dans le HTML pour les moteurs et lecteurs d'écran).
 */
export default function MobileMore({ label = "En savoir plus", children, className, invert = false }: {
  label?: string
  children: React.ReactNode
  className?: string
  invert?: boolean
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex min-h-11 w-fit items-center gap-2 rounded-full border-2 px-4 font-display text-[14px] font-bold md:hidden",
          invert ? "border-paper/60 text-paper" : "border-ink text-ink",
        )}
      >
        {open ? "Réduire" : label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className={cn("transition-transform", open && "rotate-180")}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div id={id} className={cn(open ? "flex" : "hidden", "flex-col gap-4 md:flex", className)}>
        {children}
      </div>
    </>
  )
}
