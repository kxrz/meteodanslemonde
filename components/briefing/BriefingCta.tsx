"use client"

import { useState } from "react"
import Button, { Arrow, type ButtonVariant } from "@/components/ui/Button"
import SubscribeModal from "@/components/SubscribeModal"

/** Le bouton principal : ouvre directement le choix de la ville et l'inscription. */
export default function BriefingCta({ label = "Recevoir le chiffre du jour", variant = "chaud", className }: { label?: string; variant?: ButtonVariant; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} aria-haspopup="dialog" className={`group min-h-14 px-7 text-[17px] ${className ?? ""}`}>
        {label} <Arrow />
      </Button>
      {open && <SubscribeModal onClose={() => setOpen(false)} />}
    </>
  )
}
