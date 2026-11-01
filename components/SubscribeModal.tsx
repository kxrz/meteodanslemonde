"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import CitySearch from "@/components/CitySearch"
import Button from "@/components/ui/Button"
import Eyebrow from "@/components/ui/Eyebrow"
import { isValidEmail, subscribeErrorMessage } from "@/lib/subscription"
import { slugify } from "@/lib/slugify"
import citiesFR from "@/data/cities-fr.json"

interface Props {
  /** ville déjà choisie (depuis une fiche ville) ; sinon la modale propose le choix */
  cityName?: string
  citySlug?: string
  onClose: () => void
}

const SEARCH_CITIES = citiesFR.map((c) => ({ id: c.id, name: c.name, lat: c.lat, lon: c.lon, region: c.region }))
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Inscription au briefing : boîte de dialogue accessible (piège de focus, Échap,
 * défilement verrouillé, focus rendu à l'élément d'origine). Visible au départ :
 * la ville, l'email et le consentement. Le prénom est facultatif.
 */
export default function SubscribeModal({ cityName, citySlug, onClose }: Props) {
  const [city, setCity] = useState<{ name: string; slug: string } | null>(cityName && citySlug ? { name: cityName, slug: citySlug } : null)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [showName, setShowName] = useState(false)
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [tried, setTried] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  const ids = { title: useId(), email: useId(), name: useId(), consent: useId(), hint: useId(), city: useId() }

  // Ouverture : verrou du défilement, focus initial, Échap, piège de focus ; fermeture : on rend le focus.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const first = dialogRef.current?.querySelector<HTMLElement>("input:not([tabindex='-1'])")
    first?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Échap ferme d'abord la liste de la recherche si elle est ouverte
        if ((e.target as HTMLElement)?.getAttribute("aria-expanded") === "true") return
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== "Tab" || !dialogRef.current) return
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [onClose])

  const emailOk = isValidEmail(email)
  const missing: string[] = []
  if (!city) missing.push("choisissez une ville")
  if (!emailOk) missing.push(email ? "vérifiez l'adresse email" : "indiquez votre email")
  if (!consent) missing.push("cochez la case d'accord")
  const ready = missing.length === 0
  const hint = ready ? "" : `Pour continuer : ${missing.join(", ")}.`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTried(true)
    if (!ready || !city) {
      // On place le focus sur le premier champ à corriger
      const target = !city ? ids.city : !emailOk ? ids.email : ids.consent
      document.getElementById(target)?.focus()
      return
    }
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, email, citySlug: city.slug, cityName: city.name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(subscribeErrorMessage(res.status, data.code))
      }
      setStatus("success")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error && err.message !== "Failed to fetch" ? err.message : "Connexion impossible. Vérifiez votre réseau et réessayez.")
    }
  }

  const inputCls = "min-h-12 w-full rounded-2xl border-2 border-ink bg-white px-4 text-[16px] text-ink placeholder:text-mute focus:outline-none focus-visible:ring-4 focus-visible:ring-froid/30"

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-ink/60 sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ids.title}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[var(--radius-card)] border-2 border-ink bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-[var(--radius-card)] sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-ink hover:text-paper"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="flex flex-col gap-4 py-4" role="status">
            <Eyebrow>C&apos;est presque fini</Eyebrow>
            <h2 id={ids.title} className="font-display text-3xl font-extrabold leading-tight">Ouvrez vos emails.</h2>
            <p className="text-[16px] leading-relaxed text-ink-soft">
              Un lien de confirmation vient de partir vers <strong className="text-ink">{email}</strong>. Un clic, et le chiffre du jour de <strong className="text-ink">{city?.name}</strong> arrive demain matin.
            </p>
            <p className="text-[14px] text-mute">Rien reçu dans 5 minutes ? Regardez dans les indésirables.</p>
            <Button onClick={onClose} variant="ink" className="self-start">Fermer</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 pr-10">
              <Eyebrow>Briefing du matin · gratuit</Eyebrow>
              <h2 id={ids.title} className="font-display text-[1.7rem] font-extrabold leading-tight">
                Le chiffre du jour de votre ville, <span className="hl hl-signal">en 10 secondes</span>.
              </h2>
            </div>

            {/* Ville */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.city} className="font-display text-[15px] font-bold">Votre ville</label>
              {city ? (
                <div className="flex min-h-12 items-center justify-between gap-2 rounded-2xl border-2 border-ink bg-white pl-4">
                  <span className="font-display text-[17px] font-bold">{city.name}</span>
                  <button
                    id={ids.city}
                    type="button"
                    onClick={() => setCity(null)}
                    className="min-h-11 rounded-full px-4 text-[14px] font-semibold text-ink underline underline-offset-2"
                  >
                    Changer<span className="sr-only"> de ville ({city.name})</span>
                  </button>
                </div>
              ) : (
                <>
                  <CitySearch
                    id={ids.city}
                    cities={SEARCH_CITIES}
                    variant="select"
                    placeholder="Tapez votre commune…"
                    onSelect={(c) => setCity({ name: c.name, slug: slugify(c.name) })}
                  />
                  <p className="text-[13px] text-mute">Votre commune n&apos;est pas suivie&#8239;? On prend la plus proche des 62 villes suivies.</p>
                </>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.email} className="font-display text-[15px] font-bold">Votre email</label>
              <input
                id={ids.email}
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                autoComplete="email"
                required
                aria-invalid={tried && !emailOk ? true : undefined}
                className={inputCls}
              />
            </div>

            {/* Prénom facultatif */}
            {showName ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={ids.name} className="font-display text-[15px] font-bold">Votre prénom <span className="font-sans text-[13px] font-normal text-mute">(facultatif)</span></label>
                <input id={ids.name} type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" className={inputCls} />
              </div>
            ) : (
              <button type="button" onClick={() => setShowName(true)} className="min-h-11 self-start text-[14px] font-semibold text-ink-soft underline underline-offset-2">
                + Ajouter mon prénom (facultatif)
              </button>
            )}

            {/* Consentement : vraie case à cocher, visible et focalisable */}
            <div className="flex items-start gap-3">
              <input
                id={ids.consent}
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-invalid={tried && !consent ? true : undefined}
                className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded accent-[var(--color-ink)] focus:outline-none focus-visible:ring-4 focus-visible:ring-froid/40"
              />
              <label htmlFor={ids.consent} className="cursor-pointer text-[14px] leading-snug text-ink-soft">
                J&apos;accepte de recevoir un email chaque matin. Désabonnement en un clic.{" "}
                <Link href="/confidentialite" className="font-semibold text-ink underline underline-offset-2">Vos données</Link>
              </label>
            </div>

            <div aria-live="assertive" className="empty:hidden">
              {status === "error" && errorMsg && (
                <p className="rounded-2xl border-2 border-chaud bg-white p-3 text-[15px] font-semibold text-chaud-deep">{errorMsg}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="chaud"
              aria-describedby={hint ? ids.hint : undefined}
              aria-disabled={!ready || status === "loading"}
              className={`w-full min-h-12 text-[17px] ${!ready ? "opacity-60" : ""}`}
            >
              {status === "loading" ? "Inscription…" : "Recevoir le chiffre du jour"}
            </Button>
            <p id={ids.hint} aria-live="polite" className={`text-center text-[13px] ${tried && hint ? "font-semibold text-chaud-deep" : "text-mute"}`}>
              {hint || "Gratuit, sans publicité. Un lien de confirmation part tout de suite."}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
