"use client"

import { useState } from "react"

interface Props {
  text: string
  url: string
  label?: string
  variant?: "inline" | "nudge" | "prominent"
}

export default function ShareButton({ text, url, label = "Partager", variant = "inline" }: Props) {
  const [state, setState] = useState<"idle" | "copied">("idle")

  async function handleShare() {
    const full = `${text}\n${url}`
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url })
        return
      } catch {
        // user cancelled or not supported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(full)
      setState("copied")
      setTimeout(() => setState("idle"), 2500)
    } catch {
      // clipboard not available
    }
  }

  if (variant === "prominent") {
    return (
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-2xl px-4 py-3.5 group"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {state === "copied" ? "Copié dans le presse-papiers !" : label}
        </span>
        {state === "idle" && <span className="text-white/40 group-hover:text-white transition-colors text-sm">→</span>}
      </button>
    )
  }

  if (variant === "nudge") {
    return (
      <div className="flex items-center justify-between gap-3 bg-neutral-50 rounded-2xl px-4 py-3 border border-neutral-100">
        <p className="text-xs text-neutral-500 leading-snug">
          Ces données vous ont surpris ?
        </p>
        <button
          onClick={handleShare}
          className="shrink-0 flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 transition-colors text-white text-xs font-semibold rounded-xl px-3 py-2"
        >
          {state === "copied" ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copié
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Partager
            </>
          )}
        </button>
      </div>
    )
  }

  // inline
  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {state === "copied" ? "Copié !" : label}
    </button>
  )
}
