"use client"

import { useEffect, useState } from "react"

type Mode = "android" | "ios" | null

export default function PWAInstallBanner() {
  const [mode, setMode] = useState<Mode>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Déjà installée en standalone — ne rien afficher
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if (dismissed || localStorage.getItem("pwa-banner-dismissed")) return

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isAndroid = /android/i.test(navigator.userAgent)

    if (isIOS && /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)) {
      setMode("ios")
    }

    if (isAndroid) {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as Event & { prompt: () => void })
        setMode("android")
      }
      window.addEventListener("beforeinstallprompt", handler)
      return () => window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [dismissed])

  function dismiss() {
    localStorage.setItem("pwa-banner-dismissed", "1")
    setDismissed(true)
    setMode(null)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    dismiss()
  }

  if (!mode) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-neutral-900 text-white rounded-3xl p-4 shadow-xl flex items-start gap-3">
      <div className="text-2xl shrink-0">📱</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black leading-snug mb-1">Installer l&apos;app</p>
        {mode === "ios" ? (
          <p className="text-xs text-white/60 leading-relaxed">
            Appuie sur <strong className="text-white/80">Partager</strong> puis <strong className="text-white/80">Sur l&apos;écran d&apos;accueil</strong> pour accéder au site en un geste.
          </p>
        ) : (
          <p className="text-xs text-white/60 leading-relaxed">
            Installe cestchaud.fr sur ton écran d&apos;accueil pour un accès rapide.
          </p>
        )}
        {mode === "android" && (
          <button
            onClick={install}
            className="mt-2 bg-white text-neutral-900 text-xs font-black rounded-xl px-4 py-2 hover:bg-neutral-100 transition-colors"
          >
            Installer &rarr;
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  )
}
