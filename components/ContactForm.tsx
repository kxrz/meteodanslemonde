"use client"

import { useId, useRef, useState } from "react"
import Button from "@/components/ui/Button"
import { isValidEmail } from "@/lib/subscription"

type State = "idle" | "sending" | "sent" | "error"
type Field = "name" | "email" | "message"
type Errors = Partial<Record<Field, string>>

export function validateContact(v: { name: string; email: string; message: string }): Errors {
  const e: Errors = {}
  if (!v.name.trim()) e.name = "Indiquez votre nom (ou un pseudo)."
  if (!v.email.trim()) e.email = "Indiquez votre email, pour qu'on puisse vous répondre."
  else if (!isValidEmail(v.email)) e.email = "Cet email ne semble pas valide. Vérifiez-le."
  if (!v.message.trim()) e.message = "Écrivez votre message."
  else if (v.message.length > 5000) e.message = "Message trop long : 5 000 caractères au maximum."
  return e
}

export default function ContactForm() {
  const [state, setState] = useState<State>("idle")
  const [values, setValues] = useState({ name: "", email: "", message: "" })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState("")
  const [website, setWebsite] = useState("")
  const base = useId()
  const refs = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), message: useRef<HTMLTextAreaElement>(null) }

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (website) return
    const errs = validateContact(values)
    setErrors(errs)
    const first = (["name", "email", "message"] as Field[]).find((k) => errs[k])
    if (first) { refs[first].current?.focus(); return }

    setState("sending")
    setServerError("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (res.ok) { setState("sent"); return }
      setState("error")
      setServerError(
        res.status === 429 ? "Plusieurs messages en peu de temps : patientez une minute avant de réessayer."
          : res.status === 400 || res.status === 413 ? "Un champ pose problème : vérifiez votre email et la longueur du message."
            : "L'envoi a échoué de notre côté. Réessayez dans quelques minutes, votre texte est conservé.",
      )
    } catch {
      setState("error")
      setServerError("Connexion impossible. Vérifiez votre réseau : votre texte est conservé.")
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-[var(--radius-card)] border-2 border-ink bg-signal p-6">
        <p className="font-display text-2xl font-extrabold">Message reçu. Merci&#8239;!</p>
        <p className="text-[16px] text-ink-soft">Nous lisons tout. Réponse sous 7 jours à <strong className="text-ink">{values.email}</strong>, plus vite pour une erreur de chiffre.</p>
      </div>
    )
  }

  const input = "min-h-12 w-full rounded-2xl border-2 bg-white px-4 text-[16px] text-ink placeholder:text-mute focus:outline-none focus-visible:ring-4 focus-visible:ring-froid/30"
  const fieldProps = (k: Field) => ({
    id: `${base}-${k}`,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${base}-${k}-err` : undefined,
    className: `${input} ${errors[k] ? "border-chaud" : "border-ink"}`,
  })
  const err = (k: Field) => errors[k] && <p id={`${base}-${k}-err`} className="text-[14px] font-semibold text-chaud-deep">{errors[k]}</p>

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-[var(--radius-card)] border-2 border-ink bg-white p-5 sm:p-6">
      {/* piège à robots, invisible pour les humains */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor={`${base}-website`}>Site web</label>
        <input id={`${base}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${base}-name`} className="font-display text-[15px] font-bold">Votre nom</label>
        <input ref={refs.name} type="text" autoComplete="name" value={values.name} onChange={set("name")} {...fieldProps("name")} />
        {err("name")}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${base}-email`} className="font-display text-[15px] font-bold">Votre email</label>
        <input ref={refs.email} type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.fr" value={values.email} onChange={set("email")} {...fieldProps("email")} />
        {err("email")}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${base}-message`} className="font-display text-[15px] font-bold">Votre message</label>
        <textarea ref={refs.message} rows={5} value={values.message} onChange={set("message")} {...fieldProps("message")} className={`${fieldProps("message").className} resize-y py-3`} />
        {err("message")}
      </div>

      <div aria-live="assertive" className="empty:hidden">
        {Object.values(errors).some(Boolean) && <p className="sr-only">Le formulaire contient des erreurs.</p>}
        {state === "error" && serverError && <p className="rounded-2xl border-2 border-chaud p-3 text-[15px] font-semibold text-chaud-deep">{serverError}</p>}
      </div>

      <Button type="submit" variant="ink" disabled={state === "sending"} className="min-h-12 w-full text-[17px]">
        {state === "sending" ? "Envoi…" : "Envoyer"}
      </Button>
      <p className="text-[13px] text-mute">Votre message nous parvient par email (via Resend). Il n&apos;est pas enregistré sur le site.</p>
    </form>
  )
}
