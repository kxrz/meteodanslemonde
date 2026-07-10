"use client"

import Link from "next/link"
import { useState } from "react"

const MENU_ITEMS = [
  {
    href: "/explorer",
    label: "Jumeaux climatiques",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    href: "/carte",
    label: "Carte de chaleur",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    href: "/en/france",
    label: "France en chiffres",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    href: "/citoyens",
    label: "Écrire à vos élus",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    href: "/a-propos",
    label: "À propos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  {
    href: "/contact",
    label: "Contact",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
]

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
            className="relative bg-[#f5f4f0] rounded-3xl p-8 shadow-2xl min-w-[300px]"
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
              Navigation
            </p>
            <ul className="space-y-1">
              {MENU_ITEMS.map(({ href, label, icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 font-black text-lg text-neutral-900 hover:opacity-60 transition-opacity py-2"
                  >
                    <span className="text-neutral-400 shrink-0">{icon}</span>
                    {label}
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
