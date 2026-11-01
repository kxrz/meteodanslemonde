import Link from "next/link"
import { cn } from "@/lib/cn"

export type CardTone = "white" | "paper" | "ink" | "chaud" | "froid" | "signal" | "outline"

const TONES: Record<CardTone, string> = {
  white: "bg-white text-ink",
  paper: "bg-paper-deep text-ink",
  ink: "bg-ink text-paper",
  chaud: "bg-chaud text-white",
  froid: "bg-froid text-white",
  signal: "bg-signal text-ink",
  outline: "bg-transparent text-ink border-2 border-ink",
}

interface Props {
  tone?: CardTone
  href?: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  as?: "div" | "article" | "section" | "li"
}

/** Le bloc de base du site. Un lien devient une carte entière cliquable avec un état de survol visible. */
export default function Card({ tone = "white", href, className, style, children, as: Tag = "div" }: Props) {
  const base = cn("rounded-[var(--radius-card)] p-5 sm:p-6 min-w-0", TONES[tone], className)
  if (href) {
    return (
      <Link
        href={href}
        style={style}
        className={cn(base, "group block transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--color-ink)]")}
      >
        {children}
      </Link>
    )
  }
  return (
    <Tag style={style} className={base}>
      {children}
    </Tag>
  )
}
