"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Mark from "@/components/brand/Mark"

type Mode = "android" | "ios" | null
type InstallPrompt = Event & { prompt: () => void }

const DISMISS_KEY = "pwa-banner-dismissed"
const VISITS_KEY = "pwa-visits"
const SESSION_KEY = "pwa-visit-counted"

function store<T>(fn: () => T, fallback: T): T {
  try { return fn() } catch { return fallback }
}

/** Compte une visite par session de navigation ; retourne le total. */
function countVisit(): number {
  return store(() => {
    let n = Number(localStorage.getItem(VISITS_KEY) ?? "0") || 0
    if (!sessionStorage.getItem(SESSION_KEY)) {
      n += 1
      localStorage.setItem(VISITS_KEY, String(n))
      sessionStorage.setItem(SESSION_KEY, "1")
    }
    return n
  }, 0)
}

/**
 * Proposition d'installer le site sur l'écran d'accueil.
 * Jamais au premier passage : à partir de la 2e visite, ou sur une fiche ville.
 * Le bandeau réserve sa place en bas de page (il ne masque pas le contenu) et reste sous les fenêtres modales.
 */
export default function PWAInstallBanner() {
  const pathname = usePathname()
  const [mode, setMode] = useState<Mode>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(null)
  const [eligible, setEligible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if (store(() => localStorage.getItem(DISMISS_KEY), "1")) return
    const visits = countVisit()
    setEligible(visits >= 2 || pathname.startsWith("/a/"))
  }, [pathname])

  useEffect(() => {
    if (!eligible) return
    const ua = navigator.userAgent
    if (/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios/i.test(ua)) {
      setMode("ios")
      return
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as InstallPrompt)
      setMode("android")
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [eligible])

  // Réserve la hauteur du bandeau en bas de page pour ne rien masquer
  useEffect(() => {
    if (!mode || !ref.current) return
    const prev = document.body.style.paddingBottom
    document.body.style.paddingBottom = `${ref.current.offsetHeight + 16}px`
    return () => { document.body.style.paddingBottom = prev }
  }, [mode])

  function dismiss() {
    store(() => localStorage.setItem(DISMISS_KEY, "1"), undefined)
    setMode(null)
  }

  function install() {
    deferredPrompt?.prompt()
    dismiss()
  }

  if (!mode) return null

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Installer cestchaud.fr"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[900] mx-auto flex max-w-lg items-start gap-3 rounded-[var(--radius-card)] border-2 border-paper bg-ink p-4 pr-2 text-paper shadow-xl"
    >
      <span className="mt-0.5 shrink-0 rounded-lg bg-paper p-1.5"><Mark size={24} /></span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[17px] font-extrabold leading-snug">Votre écart du jour, en un geste.</p>
        {mode === "ios" ? (
          <p className="mt-1 text-[14px] leading-snug text-paper/85">
            Touchez <strong className="text-paper">Partager</strong>, puis <strong className="text-paper">Sur l&apos;écran d&apos;accueil</strong>.
          </p>
        ) : (
          <>
            <p className="mt-1 text-[14px] leading-snug text-paper/85">Ajoutez cestchaud.fr à votre écran d&apos;accueil.</p>
            <button type="button" onClick={install} className="mt-2 min-h-11 rounded-full bg-signal px-5 font-display text-[15px] font-bold text-ink">
              Installer
            </button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer la proposition d'installation"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-paper hover:bg-paper/15"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  )
}
