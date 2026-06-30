"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface Props {
  asLink?: boolean
}

export default function SiteHeader({ asLink = false }: Props) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const title = (
    <span className="font-black text-3xl sm:text-4xl tracking-tight text-neutral-900 leading-none">
      En vrai, c'est chaud.
    </span>
  )

  const subtitle = now ? (
    <p className="text-sm text-neutral-500 mt-1">
      {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      {" · "}
      {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
    </p>
  ) : null

  return (
    <header className="shrink-0 flex items-start justify-between px-5 py-5 border-b border-black/5 bg-[#f5f4f0]">
      <div>
        {asLink ? (
          <Link href="/" className="hover:opacity-70 transition-opacity block">
            {title}
          </Link>
        ) : (
          title
        )}
        {subtitle}
      </div>
      <div className="flex items-center gap-2 mt-1 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <Link
          href="/en/france"
          className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          France →
        </Link>
      </div>
    </header>
  )
}
