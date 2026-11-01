import Num from "@/components/ui/Num"
import { cn } from "@/lib/cn"

/** Écart signé, coloré selon son sens (rouge au-dessus, bleu en dessous de la normale). */
export default function Delta({ value, decimals = 1, unit = "°C", className }: { value: number | null | undefined; decimals?: number; unit?: string; className?: string }) {
  const tone = value == null ? "text-mute" : value >= 0.5 ? "text-chaud" : value <= -0.5 ? "text-froid" : "text-ink"
  return <Num value={value} signed decimals={decimals} unit={unit ? ` ${unit}` : ""} className={cn(tone, className)} />
}
