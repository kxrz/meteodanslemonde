import { anomalyHex, anomalyInk } from "@/lib/anomaly"
import { fmtDelta } from "@/lib/format"
import { cn } from "@/lib/cn"

/** Pastille colorée selon l'échelle d'anomalie unique. */
export default function AnomalyChip({ value, className, suffix = "" }: { value: number | null | undefined; className?: string; suffix?: string }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[13px] font-semibold tabular", className)}
      style={{ background: anomalyHex(value), color: anomalyInk(value) }}
    >
      {fmtDelta(value)}&#8239;°C{suffix}
    </span>
  )
}
