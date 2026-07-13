"use client"

import Link from "next/link"
import { useState } from "react"

const MENU_SECTIONS = [
  {
    section: "Explorer",
    items: [
      {
        href: "/carte",
        emoji: "🗺️",
        label: "Carte de chaleur",
        desc: "Anomalies du jour sur toute la France",
      },
      {
        href: "/explorer",
        emoji: "🌍",
        label: "Jumeaux climatiques",
        desc: "Ta ville aujourd'hui, comme où dans le monde ?",
      },
      {
        href: "/r",
        emoji: "📍",
        label: "Régions",
        desc: "Tendances et projections par région",
      },
      {
        href: "/en/france",
        emoji: "📊",
        label: "France en chiffres",
        desc: "Vue d'ensemble nationale ERA5 et GIEC",
      },
    ],
  },
  {
    section: "Comprendre",
    items: [
      {
        href: "/terrain",
        emoji: "🛰️",
        label: "Terrain",
        desc: "Ce que le satellite confirme : avant/après",
      },
      {
        href: "/methodologie",
        emoji: "🔬",
        label: "Méthodologie",
        desc: "Sources, ERA5, GIEC CMIP6, calculs",
      },
      {
        href: "/citoyens",
        emoji: "✉️",
        label: "Écrire à vos élus",
        desc: "Modèle de lettre pour agir localement",
      },
    ],
  },
  {
    section: "Le site",
    items: [
      {
        href: "/a-propos",
        emoji: "💡",
        label: "À propos",
        desc: "Pourquoi ce site existe",
      },
      {
        href: "/contact",
        emoji: "💬",
        label: "Contact",
        desc: "Une question, une suggestion",
      },
    ],
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
          className="fixed inset-0 z-[2000] flex items-start justify-end"
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <nav
            className="relative bg-[#f5f4f0] h-full w-full max-w-sm overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-neutral-400">Navigation</p>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 transition-colors w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-200"
                aria-label="Fermer"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Sections */}
            <div className="px-4 py-4 space-y-6">
              {MENU_SECTIONS.map(({ section, items }) => (
                <div key={section}>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 px-2 mb-2">
                    {section}
                  </p>
                  <div className="space-y-1">
                    {items.map(({ href, emoji, label, desc }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-start gap-3 px-3 py-3 rounded-2xl hover:bg-white transition-colors group"
                      >
                        <span className="text-xl mt-0.5 shrink-0">{emoji}</span>
                        <div className="min-w-0">
                          <p className="font-black text-neutral-900 group-hover:text-neutral-700 leading-tight">{label}</p>
                          <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-neutral-200 mt-2">
              <Link
                href="/en/france"
                onClick={() => setMenuOpen(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                cestchaud.fr · données ERA5 &amp; GIEC CMIP6
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
