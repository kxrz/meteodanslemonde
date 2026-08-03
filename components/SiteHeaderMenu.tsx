"use client"

import Link from "next/link"
import { useState } from "react"

const NAV_EXPLORER = [
  {
    items: [
      { href: "/carte", label: "Où ça chauffe", desc: "Ressenti par ville, en direct", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg> },
      { href: "/r", label: "Par région", desc: "Données ERA5 par région", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
      { href: "/en/france", label: "La France entière", desc: "Statistiques nationales", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18"/></svg> },
    ],
  },
  {
    items: [
      { href: "/feux", label: "Anomalies thermiques", desc: "Détections NASA FIRMS, 7 jours", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> },
      { href: "/alertes", label: "Dangers du mois", desc: "Nuits tropicales et canicule", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> },
      { href: "/explorer", label: "Et ailleurs dans le monde ?", desc: "Votre ville dans le monde", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m14.5 9-5 2.5L7 17l5-2.5L14.5 9z"/></svg> },
      { href: "/terrain", label: "Vues d'en haut", desc: "Avant / après, sécheresse", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
      { href: "/jeu", label: "Le jeu du jumeau", desc: "Trouvez le pays qui ressemble au vôtre", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="12" r="10"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> },
    ],
  },
]

const NAV_PROJECT = [
  {
    label: "Services",
    items: [
      { href: "/notifications", label: "Me tenir informé", desc: "Briefing email quotidien pour votre ville", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
      { href: "/citoyens", label: "Écrire à mes élus", desc: "Modèle de lettre personnalisé", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    ],
  },
  {
    label: "Le projet",
    items: [
      { href: "/a-propos", label: "À propos", desc: "Méthodologie, sources, qui fait ce site", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> },
      { href: "/contact", label: "Contact", desc: "Signaler une erreur, suggérer", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
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
                      {group.items.map(({ href, label, desc, icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          className="group flex items-start gap-2.5 py-1.5"
                        >
                          <span className="mt-0.5 shrink-0 text-neutral-400 group-hover:text-orange-500 transition-colors">{icon}</span>
                          <span className="flex flex-col">
                            <span className="text-[15px] font-semibold text-neutral-800 group-hover:text-orange-600 transition-colors leading-snug">{label}</span>
                            <span className="text-xs text-neutral-400 group-hover:text-neutral-500 transition-colors">{desc}</span>
                          </span>
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
                    {items.map(({ href, label: itemLabel, desc, icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className="group flex items-start gap-2.5 py-1.5"
                      >
                        <span className="mt-0.5 shrink-0 text-neutral-400 group-hover:text-orange-500 transition-colors">{icon}</span>
                        <span className="flex flex-col">
                          <span className="text-[15px] font-semibold text-neutral-800 group-hover:text-orange-600 transition-colors leading-snug">{itemLabel}</span>
                          <span className="text-xs text-neutral-400 group-hover:text-neutral-500 transition-colors">{desc}</span>
                        </span>
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
