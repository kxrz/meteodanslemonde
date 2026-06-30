"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface Props {
  asLink?: boolean
}

export default function SiteHeader({ asLink = false }: Props) {
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const dayName = now.toLocaleDateString("fr-FR", { weekday: "long" })
  const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  const dateLabel = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  const timeLabel = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  const titleEl = (
    <span className="text-3xl font-black tracking-tight text-neutral-900 leading-none block">
      En vrai, c'est chaud.
    </span>
  )

  return (
    <header className="shrink-0 px-5 pt-4 pb-3 border-b border-black/5 bg-[#f5f4f0] z-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="leading-none">
            {asLink ? (
              <Link href="/" className="hover:opacity-70 transition-opacity">{titleEl}</Link>
            ) : titleEl}
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
            Nous sommes le {dayNameCap} {dateLabel}. Il est {timeLabel}.{" "}
            Le ressenti d'aujourd'hui, les villes jumelles dans le monde, et ce que le GIEC prédit pour 2030–2050.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-neutral-500">{dateLabel}</span>
          </div>
          <Link
            href="/en/france"
            className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors whitespace-nowrap"
          >
            La France en chiffres →
          </Link>
        </div>
      </div>
    </header>
  )
}
