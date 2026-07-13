"use client"

import Link from "next/link"
import { useState } from "react"

const NAV = [
  {
    items: [
      { href: "/", label: "Accueil" },
    ],
  },
  {
    items: [
      { href: "/carte", label: "Carte de chaleur" },
      { href: "/explorer", label: "Jumeaux climatiques" },
      { href: "/r", label: "Régions" },
    ],
  },
  {
    items: [
      { href: "/en/france", label: "France en chiffres" },
      { href: "/terrain", label: "Terrain" },
      { href: "/methodologie", label: "Méthodologie" },
    ],
  },
  {
    items: [
      { href: "/citoyens", label: "Écrire à vos élus" },
      { href: "/a-propos", label: "À propos" },
      { href: "/contact", label: "Contact" },
    ],
  },
]

const RESOURCES = [
  {
    items: [
      { href: "/methodologie", label: "Sources de données" },
      { href: "/methodologie#era5", label: "ERA5 & CMIP6" },
      { href: "/methodologie#calculs", label: "Calculs d'anomalie" },
    ],
  },
  {
    items: [
      { href: "/terrain", label: "Images satellite" },
      { href: "/explorer", label: "Explorateur mondial" },
      { href: "/carte", label: "Carte interactive" },
    ],
  },
  {
    items: [
      { href: "/citoyens", label: "Modèle de lettre" },
      { href: "/contact", label: "Signaler une erreur" },
      { href: "/mentions-legales", label: "Mentions légales" },
    ],
  },
]

export default function SiteHeaderMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-1 shrink-0 flex flex-col gap-1.5 p-2 hover:opacity-60 transition-opacity"
        aria-label="Menu"
      >
        <span className="block w-5 h-0.5 bg-neutral-700 rounded-full" />
        <span className="block w-5 h-0.5 bg-neutral-700 rounded-full" />
        <span className="block w-3 h-0.5 bg-neutral-700 rounded-full" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          <div
            className="relative bg-[#f8f7f3] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-200">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-neutral-400">Menu</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Body — 2 colonnes */}
            <div className="grid grid-cols-2 divide-x divide-neutral-200">

              {/* Colonne gauche : Naviguer */}
              <div className="px-7 py-6">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400 mb-4">Naviguer</p>
                <div className="space-y-5">
                  {NAV.map((group, gi) => (
                    <div key={gi} className={gi > 0 ? "pt-4 border-t border-neutral-200" : ""}>
                      {group.items.map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          className="block text-[15px] font-semibold text-neutral-800 hover:text-neutral-500 transition-colors py-0.5"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Colonne droite : Ressources */}
              <div className="px-7 py-6">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400 mb-4">Ressources</p>
                <div className="space-y-5">
                  {RESOURCES.map((group, gi) => (
                    <div key={gi} className={gi > 0 ? "pt-4 border-t border-neutral-200" : ""}>
                      {group.items.map(({ href, label }) => (
                        <Link
                          key={href + label}
                          href={href}
                          onClick={() => setOpen(false)}
                          className="block text-[15px] font-semibold text-neutral-800 hover:text-neutral-500 transition-colors py-0.5"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-7 py-4 border-t border-neutral-200">
              <p className="text-xs text-neutral-400">cestchaud.fr &middot; données ERA5 &amp; GIEC CMIP6</p>
              <div className="flex gap-4">
                <Link href="/a-propos" onClick={() => setOpen(false)} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">À propos</Link>
                <Link href="/mentions-legales" onClick={() => setOpen(false)} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">Mentions légales</Link>
                <Link href="/contact" onClick={() => setOpen(false)} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">Contact</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
