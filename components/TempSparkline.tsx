"use client"

import { useEffect, useState } from "react"
import { anomalyHex } from "@/lib/anomaly"
import { fmt, fmtDelta } from "@/lib/format"
import Explain from "@/components/ui/Explain"

interface Props {
  lat: number
  lon: number
  /** normales mensuelles 1991-2020 du ressenti max (12 valeurs) */
  normals: number[] | null
}

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ok"; dates: string[]; values: (number | null)[] }

/** Les 30 derniers jours : chaque barre part de la normale du mois et prend la couleur de l'écart. */
export default function TempSparkline({ lat, lon, normals }: Props) {
  const [state, setState] = useState<State>({ kind: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 12_000)
    const end = new Date()
    end.setDate(end.getDate() - 2)
    const start = new Date(end)
    start.setDate(start.getDate() - 29)
    const d = (x: Date) => x.toISOString().slice(0, 10)
    fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
        `&start_date=${d(start)}&end_date=${d(end)}&daily=apparent_temperature_max&timezone=auto`,
      { signal: ctrl.signal },
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        const values = (data?.daily?.apparent_temperature_max ?? []) as (number | null)[]
        const dates = (data?.daily?.time ?? []) as string[]
        if (!values.some((v) => v != null)) throw new Error("vide")
        setState({ kind: "ok", dates, values })
      })
      .catch(() => setState({ kind: "error" }))
      .finally(() => clearTimeout(timer))
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [lat, lon])

  if (state.kind === "loading") {
    return <div className="h-40 animate-pulse rounded-2xl bg-paper-deep" aria-label="Chargement des 30 derniers jours" />
  }
  if (state.kind === "error") {
    return (
      <p className="rounded-2xl bg-paper p-4 text-[15px] text-ink-soft" role="status">
        Relevé des 30 derniers jours indisponible pour le moment. Réessayez plus tard.
      </p>
    )
  }

  const { dates, values } = state
  const normalOf = (i: number) => {
    const m = Number(dates[i]?.slice(5, 7)) - 1
    return normals && m >= 0 ? normals[m] : null
  }
  const valid = values.filter((v): v is number => v != null)
  const ns = values.map((_, i) => normalOf(i)).filter((v): v is number => v != null)
  const lo = Math.floor(Math.min(...valid, ...ns) - 1)
  const hi = Math.ceil(Math.max(...valid, ...ns) + 1)
  const W = 300, H = 120
  const bw = W / values.length
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H
  const anomalies = values.map((v, i) => {
    const n = normalOf(i)
    return v != null && n != null ? v - n : null
  })
  const above = anomalies.filter((a) => a != null && a >= 0.5).length
  const counted = anomalies.filter((a) => a != null).length
  const maxV = Math.max(...valid)
  const minV = Math.min(...valid)
  const fr = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })

  // ligne de la normale (en escalier si le mois change)
  const normalPath = values.map((_, i) => {
    const n = normalOf(i)
    if (n == null) return ""
    return `${i === 0 ? "M" : "L"}${(i * bw).toFixed(1)} ${y(n).toFixed(1)} L${((i + 1) * bw).toFixed(1)} ${y(n).toFixed(1)}`
  }).join(" ")

  return (
    <div className="flex flex-col gap-3">
      {counted > 0 && (
        <p className="font-display text-[19px] font-bold leading-snug">
          <span className="text-chaud">{above}</span> jours sur {counted} au-dessus de la normale.
        </p>
      )}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label={`Ressenti maximal des 30 derniers jours, entre ${fmt(minV, 0)} et ${fmt(maxV, 0)} degrés`}>
          {values.map((v, i) => {
            const n = normalOf(i)
            if (v == null) return null
            const base = n ?? lo
            const top = Math.min(y(v), y(base))
            const h = Math.max(1.5, Math.abs(y(v) - y(base)))
            return <rect key={i} x={i * bw + bw * 0.15} width={bw * 0.7} y={top} height={h} rx="1" fill={anomalyHex(anomalies[i])} />
          })}
          {normalPath && <path d={normalPath} fill="none" stroke="var(--color-ink)" strokeWidth="1.5" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />}
        </svg>
      </div>
      <div className="flex flex-wrap justify-between gap-2 font-mono text-[12px] text-mute">
        <span>{dates[0] && fr(dates[0])}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-5 border-t-2 border-dashed border-ink" /> normale du mois <Explain term="normale" />
        </span>
        <span>{dates.at(-1) && fr(dates.at(-1)!)}</span>
      </div>
      <p className="text-[13px] text-mute">
        Plus haut : {fmt(maxV, 0)}&#8239;°C · plus bas : {fmt(minV, 0)}&#8239;°C ressentis. Couleur = écart à la normale
        {anomalies.at(-1) != null && <> (dernier jour : {fmtDelta(anomalies.at(-1))}&#8239;°C)</>}. Source : Open-Meteo, archive ERA5.
      </p>
    </div>
  )
}
