"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface Props {
  asLink?: boolean
}

export default function SiteHeader({ asLink = false }: Props) {
  const [now, setNow] = useState<Date | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const title = (
    <span className="font-black text-3xl sm:text-4xl tracking-tight text-neutral-900 leading-none">
      En vrai, c'est{" "}
      <span className="relative inline-block">
        chaud
        <span className="absolute left-0 right-0 bottom-0.5 h-[3px] bg-red-500 rounded-full" />
      </span>
      .
    </span>
  )

  const subtitle = (
    <div className="text-sm text-neutral-500 mt-2 leading-snug">
      {now ? (
        <p>
          Nous sommes le{" "}
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })},
          il est{" "}
          {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.
        </p>
      ) : null}
      <p>Le ressenti d'aujourd'hui, les villes jumelles dans le monde, et ce que le GIEC prédit pour 2030–2050.</p>
    </div>
  )

  return (
    <>
      <header className="shrink-0 flex items-start justify-between px-5 py-5 border-b border-black/5 bg-[#f5f4f0]">
        <div className="flex-1 min-w-0 pr-4">
          {asLink ? (
            <Link href="/" className="hover:opacity-70 transition-opacity block">
              {title}
            </Link>
          ) : (
            title
          )}
          {subtitle}
        </div>

        <button
          onClick={() => setMenuOpen(true)}
          className="mt-1 shrink-0 flex flex-col gap-1.5 p-2 hover:opacity-60 transition-opacity"
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 bg-neutral-700 rounded-full" />
          <span className="block w-5 h-0.5 bg-neutral-700 rounded-full" />
          <span className="block w-3 h-0.5 bg-neutral-700 rounded-full" />
        </button>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center"
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <nav
            className="relative bg-[#f5f4f0] rounded-3xl p-8 shadow-2xl min-w-[280px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 text-lg transition-colors"
              aria-label="Fermer"
            >
              ✕
            </button>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-5">
              Menu
            </p>
            <ul className="space-y-4">
              {[
                { href: "/en/france", label: "La France en chiffres" },
                { href: "/methodologie", label: "Méthodologie" },
                { href: "/contact", label: "Contact" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="font-black text-xl text-neutral-900 hover:opacity-60 transition-opacity block"
                  >
                    {label} →
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
