import { cn } from "@/lib/cn"

export type HlTone = "chaud" | "froid" | "signal" | "ink"

/**
 * Mot ou groupe de mots mis en avant : gras + surligneur.
 * Le surligneur se trace à l'apparition (moteur GSAP, data-anim="hl").
 */
export default function Hl({ children, tone = "signal", className }: { children: React.ReactNode; tone?: HlTone; className?: string }) {
  return (
    <strong data-anim="hl" className={cn("hl font-extrabold", `hl-${tone}`, className)}>
      {children}
    </strong>
  )
}
