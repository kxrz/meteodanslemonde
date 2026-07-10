"use client"

import { useEffect, useState } from "react"

interface Props {
  cityId: string
  cityName: string
}

type Status = "idle" | "loading" | "active" | "denied" | "unsupported"

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export default function PushOptIn({ cityId, cityName }: Props) {
  const [status, setStatus] = useState<Status>("idle")

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported")
      return
    }
    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    const stored = localStorage.getItem(`push:${cityId}`)
    if (stored === "active") setStatus("active")
  }, [cityId])

  async function toggle() {
    if (status === "active") {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
      localStorage.removeItem(`push:${cityId}`)
      setStatus("idle")
      return
    }

    setStatus("loading")
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") { setStatus("denied"); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), cityId }),
      })
      localStorage.setItem(`push:${cityId}`, "active")
      setStatus("active")
    } catch {
      setStatus("idle")
    }
  }

  if (status === "unsupported") return null

  return (
    <button
      onClick={toggle}
      disabled={status === "loading"}
      className={`w-full flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
        status === "active"
          ? "bg-green-100 text-green-800 hover:bg-green-200"
          : status === "denied"
          ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          : "bg-[#f5f4f0] text-neutral-700 hover:bg-neutral-200"
      }`}
    >
      <span className="text-base">{status === "active" ? "🔔" : "🔕"}</span>
      {status === "active"
        ? `Alertes activées pour ${cityName}`
        : status === "denied"
        ? "Notifications bloquées"
        : status === "loading"
        ? "Activation..."
        : `Recevoir le ressenti de ${cityName} chaque matin`}
    </button>
  )
}
