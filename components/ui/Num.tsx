import { fmt, fmtDelta } from "@/lib/format"
import { cn } from "@/lib/cn"

interface Props {
  value: number | null | undefined
  /** valeur de départ de l'animation (ex. la normale : le compteur part de la normale) */
  from?: number
  decimals?: number
  signed?: boolean
  unit?: string
  className?: string
}

/**
 * Nombre formaté en français. Le texte final est rendu par le serveur ;
 * le moteur GSAP le fait compter depuis `from` quand il entre à l'écran.
 */
export default function Num({ value, from, decimals = 0, signed = false, unit = "", className }: Props) {
  if (value == null || Number.isNaN(value)) return <span className={className}>–</span>
  const text = (signed ? fmtDelta(value, decimals) : fmt(value, decimals)) + unit
  return (
    <span
      className={cn("tabular", className)}
      data-anim="count"
      data-to={value}
      data-from={from ?? (signed ? 0 : undefined)}
      data-decimals={decimals}
      data-signed={signed ? "1" : undefined}
      data-unit={unit || undefined}
    >
      {text}
    </span>
  )
}
