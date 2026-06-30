"use client"

import { useState } from "react"

export default function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })
      if (!res.ok) throw new Error()
      setStatus("sent")
    } catch {
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-[#b8d4b0] rounded-3xl p-6 text-center">
        <p className="text-xl font-black text-green-900">Message envoyé ✓</p>
        <p className="text-sm text-green-800 mt-2 leading-relaxed">On revient vers vous rapidement. Merci !</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 space-y-4">
      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-2">
        Formulaire de contact
      </p>
      <div>
        <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Nom</label>
        <input
          type="text" required value={name} onChange={e => setName(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-neutral-50"
          placeholder="Votre nom"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Email</label>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-neutral-50"
          placeholder="vous@exemple.fr"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Message</label>
        <textarea
          required rows={4} value={message} onChange={e => setMessage(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-neutral-50 resize-none"
          placeholder="Votre message…"
        />
      </div>
      {status === "error" && (
        <p className="text-xs text-red-600 font-medium">
          Erreur lors de l'envoi. Contactez-nous directement sur LinkedIn.
        </p>
      )}
      <button
        type="submit" disabled={status === "sending"}
        className="w-full bg-neutral-900 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl py-3 transition-colors text-sm"
      >
        {status === "sending" ? "Envoi en cours…" : "Envoyer le message"}
      </button>
    </form>
  )
}
