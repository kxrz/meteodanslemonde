"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import gsap from "gsap"
import Logo from "@/components/brand/Logo"
import { NAV_MAIN, NAV_MORE } from "@/components/nav"
import { cn } from "@/lib/cn"

/**
 * Menu plein écran. Dialogue accessible : Échap ferme, le focus reste dans le menu,
 * la page derrière ne défile plus, le focus revient sur le bouton à la fermeture.
 */
export default function SiteHeaderMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  // Ferme le menu quand la route change
  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const root = panel.current
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusables = () => Array.from(root?.querySelectorAll<HTMLElement>("a, button") ?? [])
    focusables()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return }
      if (e.key !== "Tab") return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", onKey)

    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(root!.querySelectorAll("[data-menu-item]"), { yPercent: 60, autoAlpha: 0, duration: 0.45, ease: "power3.out", stagger: 0.035 })
    })

    const triggerEl = trigger.current
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      mm.revert()
      triggerEl?.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink px-4 font-display text-[15px] font-bold text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
        Menu
      </button>

      {open && createPortal(
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
          className="fixed inset-0 z-[2000] overflow-y-auto bg-ink text-paper"
        >
          <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-10 px-5 pb-10 pt-4 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="rounded-md bg-paper px-2.5 py-1.5" aria-label="cestchaud.fr, accueil">
                <Logo size="sm" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-paper px-4 font-display text-[15px] font-bold hover:bg-paper hover:text-ink"
              >
                Fermer
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav aria-label="Navigation principale" className="grid gap-x-10 gap-y-2 lg:grid-cols-[1.6fr_1fr]">
              <ul className="flex flex-col">
                {NAV_MAIN.map((item, i) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                  return (
                    <li key={item.href} data-menu-item className="border-b border-paper/15">
                      <Link href={item.href} aria-current={active ? "page" : undefined} className="group flex items-baseline gap-4 py-3.5">
                        <span className="w-6 shrink-0 font-mono text-[13px] text-paper/60 tabular">{String(i + 1).padStart(2, "0")}</span>
                        <span className="flex min-w-0 flex-col">
                          <span className={cn(
                            "font-display text-[clamp(1.9rem,6vw,3rem)] font-extrabold leading-none tracking-tight transition-colors group-hover:text-signal",
                            active && "text-signal",
                          )}>
                            {item.label}
                          </span>
                          <span className="mt-1.5 text-[15px] text-paper/70">{item.desc}</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <ul className="flex flex-col pt-4 lg:pt-1">
                {NAV_MORE.map((item) => (
                  <li key={item.href} data-menu-item>
                    <Link href={item.href} className="group flex flex-col py-2.5">
                      <span className="font-display text-xl font-bold group-hover:text-signal">{item.label}</span>
                      <span className="text-[14px] text-paper/70">{item.desc}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <p className="mt-auto font-mono text-[12px] text-paper/60">Données ERA5 · GIEC CMIP6 · Open-Meteo · NASA FIRMS</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
