"use client"

import { usePathname, useRouter } from "next/navigation"
import { useId, useTransition } from "react"
import { cn } from "@/lib/cn"

interface Props {
  cities: { id: string; name: string }[]
  value: string
  label: React.ReactNode
  /** autres paramètres d'URL à conserver (ex. { deroule: "15" }) */
  keep?: Record<string, string>
  tone?: "light" | "dark"
  size?: "md" | "xl"
  className?: string
}

/**
 * Sélecteur des 62 villes, mémorisé dans l'URL (`?ville=slug`).
 * Sans JavaScript, c'est un formulaire GET classique.
 */
export default function CityPicker({ cities, value, label, keep = {}, tone = "light", size = "md", className }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, start] = useTransition()
  const id = useId()

  const onChange = (ville: string) => {
    const params = new URLSearchParams({ ...keep, ville })
    start(() => router.replace(`${pathname}?${params}${window.location.hash}`, { scroll: false }))
  }

  return (
    <form method="get" action={pathname} className={cn("flex flex-col gap-2", className)} onSubmit={(e) => e.preventDefault()}>
      <label htmlFor={id} className={cn("font-display font-bold", size === "xl" ? "text-[clamp(1.25rem,2.4vw,2rem)]" : "text-[17px]")}>
        {label}
      </label>
      {Object.entries(keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div className="flex items-center gap-3">
        <select
          id={id}
          name="ville"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-busy={pending}
          className={cn(
            "min-h-11 w-full max-w-sm cursor-pointer appearance-none rounded-full border-2 pl-5 pr-12 font-display font-bold",
            size === "xl" ? "min-h-16 text-[clamp(1.4rem,2.6vw,2.2rem)]" : "text-[17px]",
            tone === "dark" ? "border-paper bg-ink text-paper" : "border-ink bg-white text-ink",
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${tone === "dark" ? "%23f5f4f0" : "%23111111"}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "16px",
            backgroundPosition: "right 1.1rem center",
          }}
        >
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <noscript>
          <button type="submit" className="min-h-11 rounded-full bg-ink px-5 font-display font-bold text-paper">Afficher</button>
        </noscript>
        {pending && <span className={cn("text-[15px]", tone === "dark" ? "text-paper/80" : "text-mute")} role="status">Chargement…</span>}
      </div>
    </form>
  )
}
