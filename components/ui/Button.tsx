import Link from "next/link"
import { cn } from "@/lib/cn"

export type ButtonVariant = "ink" | "chaud" | "froid" | "ghost" | "paper"

const VARIANTS: Record<ButtonVariant, string> = {
  ink: "bg-ink text-paper hover:bg-ink-soft",
  chaud: "bg-chaud text-white hover:bg-chaud-deep",
  froid: "bg-froid text-white hover:bg-froid-deep",
  paper: "bg-paper text-ink hover:bg-white",
  ghost: "bg-transparent text-ink border-2 border-ink hover:bg-ink hover:text-paper",
}

const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 font-display text-[15px] font-bold tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50"

type Common = { variant?: ButtonVariant; className?: string; children: React.ReactNode }

export function ButtonLink({ href, variant = "ink", className, children, ...rest }: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const external = href.startsWith("http")
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn(base, VARIANTS[variant], className)} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={cn(base, VARIANTS[variant], className)} {...rest}>
      {children}
    </Link>
  )
}

export default function Button({ variant = "ink", className, children, type = "button", ...rest }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(base, VARIANTS[variant], className)} {...rest}>
      {children}
    </button>
  )
}

export function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
