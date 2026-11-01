import { cn } from "@/lib/cn"

export default function Eyebrow({ children, className, as: Tag = "p" }: { children: React.ReactNode; className?: string; as?: "p" | "span" | "div" }) {
  return (
    <Tag className={cn("font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-mute", className)}>
      {children}
    </Tag>
  )
}
