import Eyebrow from "@/components/ui/Eyebrow"
import Explain from "@/components/ui/Explain"
import type { GlossaryKey } from "@/lib/glossary"
import { cn } from "@/lib/cn"

/** Un chiffre clé : étiquette, valeur en très gras, phrase de contexte, et explication optionnelle. */
export default function Stat({ label, value, sub, explain, className, invert = false }: {
  label: React.ReactNode
  value: React.ReactNode
  sub?: React.ReactNode
  explain?: GlossaryKey
  className?: string
  invert?: boolean
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <Eyebrow className={invert ? "text-current opacity-75" : undefined}>{label}</Eyebrow>
        {explain && <Explain term={explain} invert={invert} />}
      </div>
      <div className="font-display text-[clamp(2.4rem,6vw,3.6rem)] font-extrabold leading-none tracking-tight">{value}</div>
      {sub && <p className={cn("text-[15px] leading-snug", invert ? "opacity-85" : "text-ink-soft")}>{sub}</p>}
    </div>
  )
}
