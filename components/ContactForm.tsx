"use client"

import { useState } from "react"

type State = "idle" | "sending" | "sent" | "error"

export default function ContactForm() {
  const [state, setState] = useState<State>("idle")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (website) return
    setState("sending")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })
      if (res.ok) {
        setState("sent")
      } else {
        setState("error")
      }
    } catch {
      setState("error")
    }
  }

  if (state === "sent") {
    return (
      <div className="bg-[#d1fae5] rounded-3xl p-6 text-center">
        <p className="text-2xl font-black text-emerald-900 mb-2">Message envoyé ✓</p>
        <p className="text-sm text-emerald-800/70">On vous répond dès que possible.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 space-y-4">
      {/* honeypot — invisible for humans */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1.5">
          Nom
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-neutral-100 rounded-2xl px-4 py-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-300"
          placeholder="Votre nom"
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1.5">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-neutral-100 rounded-2xl px-4 py-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-300"
          placeholder="votre@email.com"
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1.5">
          Message
        </label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-neutral-100 rounded-2xl px-4 py-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
          placeholder="Votre message…"
        />
      </div>
      {state === "error" && (
        <p className="text-sm text-red-600">Une erreur est survenue. Réessayez ou contactez-nous directement.</p>
      )}
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-black rounded-2xl py-4 transition-colors"
      >
        {state === "sending" ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  )
}
