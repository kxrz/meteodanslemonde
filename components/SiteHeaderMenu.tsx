"use client"

import Link from "next/link"
import { useState } from "react"

const NAV = [
  {
    items: [
      { href: "/", label: "Accueil", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    ],
  },
  {
    items: [
      { href: "/carte", label: "Carte de chaleur", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg> },
      { href: "/explorer", label: "Jumeaux climatiques", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
      { href: "/r", label: "Régions", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    ],
  },
  {
    items: [
      { href: "/en/france", label: "France en chiffres", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18"/></svg> },
      { href: "/terrain", label: "Terrain", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
      { href: "/methodologie", label: "Méthodologie", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> },
    ],
  },
  {
    items: [
      { href: "/citoyens", label: "Écrire à vos élus", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
      { href: "/a-propos", label: "À propos", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg> },
      { href: "/contact", label: "Contact", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> },
    ],
  },
]

const RESOURCES = [
  {
    items: [
      { href: "/a-propos", label: "Sources de données", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg> },
      { href: "/a-propos#era5", label: "ERA5 & CMIP6", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 2-12 4 8 3-4 3 4 4-8 2 12"/></svg> },
      { href: "/a-propos#calculs", label: "Calculs d'anomalie", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h4"/></svg> },
    ],
  },
  {
    items: [
      { href: "/terrain", label: "Images satellite", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
      { href: "/explorer", label: "Explorateur mondial", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
      { href: "/carte", label: "Carte interactive", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    ],
  },
  {
    items: [
      { href: "/citoyens", label: "Modèle de lettre", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg> },
      { href: "/contact", label: "Signaler une erreur", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg> },
      { href: "/mentions-legales", label: "Mentions légales", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
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
                      {group.items.map(({ href, label, icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2.5 text-[15px] font-semibold text-neutral-800 hover:text-neutral-500 transition-colors py-0.5"
                        >
                          <span className="text-neutral-400 shrink-0">{icon}</span>
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
                      {group.items.map(({ href, label, icon }) => (
                        <Link
                          key={href + label}
                          href={href}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2.5 text-[15px] font-semibold text-neutral-800 hover:text-neutral-500 transition-colors py-0.5"
                        >
                          <span className="text-neutral-400 shrink-0">{icon}</span>
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
