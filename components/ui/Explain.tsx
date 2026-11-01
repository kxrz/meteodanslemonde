"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary"
import { cn } from "@/lib/cn"

/**
 * « Expliquer ce chiffre » : un petit bouton « ? » qui ouvre une définition courte.
 * Bulle sous le bouton sur grand écran, feuille en bas d'écran sur mobile.
 * Fermeture : Échap, clic à l'extérieur, ou re-clic.
 */
export default function Explain({ term, invert = false, label }: { term: GlossaryKey; invert?: boolean; label?: string }) {
  const entry = GLOSSARY[term]
  const [open, setOpen] = useState(false)
  const id = useId()
  const wrap = useRef<HTMLSpanElement>(null)
  const btn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        btn.current?.focus()
      }
    }
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open])

  return (
    <span ref={wrap} className="relative inline-flex align-middle">
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label ?? `Expliquer : ${entry.term}`}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          // zone de clic 44px, pastille visible 20px
          "relative inline-flex h-5 w-5 items-center justify-center rounded-full font-display text-[12px] font-extrabold leading-none transition-colors",
          "before:absolute before:-inset-3 before:content-['']",
          invert ? "bg-white/20 text-current hover:bg-white/35" : "bg-ink/10 text-ink hover:bg-ink hover:text-paper",
          open && (invert ? "bg-white/40" : "bg-ink text-paper"),
        )}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className={cn(
            "z-[1500] flex flex-col gap-2 bg-ink p-4 text-left text-[15px] font-normal normal-case leading-snug tracking-normal text-paper shadow-2xl",
            "fixed inset-x-3 bottom-3 rounded-2xl",
            "sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-7 sm:w-72 sm:-translate-x-1/2 sm:rounded-xl",
          )}
        >
          <span className="font-display text-[17px] font-extrabold">{entry.term}</span>
          <span>{entry.short}</span>
          <Link href={`/atelier/glossaire#${term}`} className="font-semibold text-signal underline underline-offset-2" onClick={() => setOpen(false)}>
            Tout le glossaire
          </Link>
        </span>
      )}
    </span>
  )
}
