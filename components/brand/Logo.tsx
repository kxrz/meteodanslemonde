import Mark from "@/components/brand/Mark"
import { cn } from "@/lib/cn"

/** Logotype : « cestchaud » en Bricolage extra-gras + l'anneau en exposant. */
export default function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-5xl" : size === "sm" ? "text-lg" : "text-[22px]"
  const ring = size === "lg" ? 30 : size === "sm" ? 12 : 15
  return (
    <span className={cn("inline-flex items-start font-display font-extrabold leading-none tracking-[-0.04em] text-ink", text, className)}>
      cestchaud
      <Mark size={ring} className="ml-[0.06em] mt-[0.02em] shrink-0" />
    </span>
  )
}
