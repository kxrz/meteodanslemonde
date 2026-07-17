"use client"

import Link from "next/link"
import { useState } from "react"

const NAV_EXPLORER = [
  {
    items: [
      { href: "/carte", label: "Où ça chauffe", desc: "Ressenti par ville, en direct" },
      { href: "/r", label: "Par région", desc: "Données ERA5 par région" },
      { href: "/en/france", label: "La France entière", desc: "Statistiques nationales" },
    ],
  },
  {
    items: [
      { href: "/feux", label: "Ça brûle", desc: "Détections NASA FIRMS, 7 jours" },
      { href: "/alertes", label: "Dangers du mois", desc: "Nuits tropicales et canicule" },
      { href: "/explorer", label: "Et ailleurs dans le monde ?", desc: "Votre ville dans le monde" },
      { href: "/terrain", label: "Vues d'en haut", desc: "Avant / après, sécheresse" },
    ],
  },
]

const NAV_PROJECT = [
  {
    label: "Services",
    items: [
      { href: "/notifications", label: "Me tenir informé", desc: "Briefing email quotidien pour votre ville" },
      { href: "/citoyens", label: "Écrire à mes élus", desc: "Modèle de lettre personnalisé" },
    ],
  },
  {
    label: "Le projet",
    items: [
      { href: "/a-propos", label: "À propos", desc: "Méthodologie, sources, qui fait ce site" },
      { href: "/contact", label: "Contact", desc: "Signaler une erreur, suggérer" },
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
              <Link href="/" onClick={() => setOpen(false)} className="font-black text-neutral-900 tracking-tight hover:opacity-70 transition-opacity">
                cestchaud.fr
              </Link>
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

            {/* Body : 2 colonnes */}
            <div className="grid grid-cols-2 divide-x divide-neutral-200">

              {/* Gauche : Explorer les données */}
              <div className="px-7 py-6">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400 mb-5">Explorer</p>
                <div className="space-y-5">
                  {NAV_EXPLORER.map((group, gi) => (
                    <div key={gi} className={gi > 0 ? "pt-5 border-t border-neutral-200" : ""}>
                      {group.items.map(({ href, label, desc }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          className="group flex flex-col py-1.5"
                        >
                          <span className="text-[15px] font-semibold text-neutral-800 group-hover:text-orange-600 transition-colors leading-snug">{label}</span>
                          <span className="text-xs text-neutral-400 group-hover:text-neutral-500 transition-colors">{desc}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Droite : Services & Projet */}
              <div className="px-7 py-6 flex flex-col gap-6">
                {NAV_PROJECT.map(({ label, items }) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400 mb-3">{label}</p>
                    {items.map(({ href, label: itemLabel, desc }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className="group flex flex-col py-1.5"
                      >
                        <span className="text-[15px] font-semibold text-neutral-800 group-hover:text-orange-600 transition-colors leading-snug">{itemLabel}</span>
                        <span className="text-xs text-neutral-400 group-hover:text-neutral-500 transition-colors">{desc}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-7 py-4 border-t border-neutral-200">
              <p className="text-xs text-neutral-400">Données ERA5 · GIEC CMIP6 · NASA FIRMS</p>
              <Link
                href="/mentions-legales"
                onClick={() => setOpen(false)}
                className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
