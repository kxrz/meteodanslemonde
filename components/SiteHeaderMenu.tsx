"use client"

import Link from "next/link"
import { useState } from "react"

export default function SiteHeaderMenu() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setMenuOpen(true)}
        className="mt-1 shrink-0 flex flex-col gap-1.5 p-2 hover:opacity-60 transition-opacity"
        aria-label="Menu"
      >
        <span className="block w-5 h-0.5 bg-neutral-700 rounded-full" />
        <span className="block w-5 h-0.5 bg-neutral-700 rounded-full" />
        <span className="block w-3 h-0.5 bg-neutral-700 rounded-full" />
      </button>

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
                { href: "/citoyens", label: "Écrire à vos élus" },
                { href: "/a-propos", label: "À propos" },
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
