"use client"

import { useState } from "react"
import { Metadata } from "next"

type SyncResult = {
  email: string
  status: "synced" | "error"
  resend_id: string | null
  note?: string
}

type SyncResponse = {
  total: number
  synced: number
  errors: number
  results: SyncResult[]
  error?: string
}

export default function SyncResendPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SyncResponse | null>(null)

  async function run() {
    setLoading(true)
    setData(null)
    try {
      const res = await fetch("/api/admin/sync-resend", { method: "POST" })
      const json = await res.json()
      setData(json)
    } catch (err) {
      setData({ total: 0, synced: 0, errors: 1, results: [], error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">Admin · One-shot</p>
        <h1 className="text-2xl font-black text-neutral-900 mb-2">Sync Resend</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Upsert tous les abonnés DB vers les listes Resend. Met à jour <code className="bg-neutral-200 px-1 rounded text-xs">resend_id</code> pour les contacts sans liaison.
          Respecte le statut confirme / non-confirme.
        </p>

        <button
          onClick={run}
          disabled={loading}
          className="bg-neutral-900 text-white text-sm font-bold px-6 py-3 rounded-2xl disabled:opacity-40 hover:bg-neutral-700 transition-colors mb-8"
        >
          {loading ? "Synchronisation en cours..." : "Lancer le sync"}
        </button>

        {loading && (
          <div className="bg-white rounded-3xl p-6 mb-4 text-sm text-neutral-500 animate-pulse">
            Envoi vers Resend... (environ 120ms par contact)
          </div>
        )}

        {data && !loading && (
          <div className="space-y-4">
            {data.error ? (
              <div className="bg-red-50 rounded-3xl p-5 text-red-700 text-sm font-semibold">{data.error}</div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-3xl p-5 text-center">
                    <p className="text-3xl font-black text-neutral-900">{data.total}</p>
                    <p className="text-xs text-neutral-400 mt-1">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-3xl p-5 text-center">
                    <p className="text-3xl font-black text-green-700">{data.synced}</p>
                    <p className="text-xs text-neutral-400 mt-1">Synces</p>
                  </div>
                  <div className={`rounded-3xl p-5 text-center ${data.errors > 0 ? "bg-red-50" : "bg-neutral-50"}`}>
                    <p className={`text-3xl font-black ${data.errors > 0 ? "text-red-700" : "text-neutral-400"}`}>{data.errors}</p>
                    <p className="text-xs text-neutral-400 mt-1">Erreurs</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-neutral-100">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400">Detail par contact</p>
                  </div>
                  <div className="divide-y divide-neutral-50">
                    {data.results.map((r, i) => (
                      <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-800 truncate">{r.email}</p>
                          {r.note && <p className="text-xs text-neutral-400">{r.note}</p>}
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${r.status === "synced" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {r.status === "synced" ? "OK" : "ERR"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
