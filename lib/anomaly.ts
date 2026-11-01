// Échelle d'anomalie unique (écart à la normale du mois, en °C).
// Toute couleur liée à une anomalie sur le site passe par ici.

export interface AnomalyStep {
  key: string
  min: number // borne basse incluse
  hex: string
  /** texte lisible sur cette couleur */
  ink: "#111111" | "#ffffff"
  label: string
}

export const ANOMALY_STEPS: AnomalyStep[] = [
  { key: "m4", min: -Infinity, hex: "#1e3a8a", ink: "#ffffff", label: "≤ −6 °C" },
  { key: "m3", min: -6, hex: "#2563eb", ink: "#ffffff", label: "−6 à −3 °C" },
  { key: "m2", min: -3, hex: "#60a5fa", ink: "#111111", label: "−3 à −1 °C" },
  { key: "m1", min: -1, hex: "#bfdbfe", ink: "#111111", label: "−1 à −0,5 °C" },
  { key: "0", min: -0.5, hex: "#e7e5df", ink: "#111111", label: "dans la normale" },
  { key: "p1", min: 0.5, hex: "#fed7aa", ink: "#111111", label: "+0,5 à +1 °C" },
  { key: "p2", min: 1, hex: "#fb923c", ink: "#111111", label: "+1 à +3 °C" },
  { key: "p3", min: 3, hex: "#dc2626", ink: "#ffffff", label: "+3 à +6 °C" },
  { key: "p4", min: 6, hex: "#7f1d1d", ink: "#ffffff", label: "≥ +6 °C" },
]

export function anomalyStep(a: number | null | undefined): AnomalyStep | null {
  if (a == null || Number.isNaN(a)) return null
  let step = ANOMALY_STEPS[0]
  for (const s of ANOMALY_STEPS) if (a >= s.min) step = s
  return step
}

export function anomalyHex(a: number | null | undefined): string {
  return anomalyStep(a)?.hex ?? "#cbd5e1"
}

export function anomalyInk(a: number | null | undefined): string {
  return anomalyStep(a)?.ink ?? "#111111"
}

/** Qualificatif en français, valable en toute saison (pas de « chaleur » en janvier). */
export function anomalyWords(a: number | null | undefined): string {
  if (a == null) return "donnée indisponible"
  if (a >= 6) return "très au-dessus de la normale"
  if (a >= 3) return "nettement au-dessus de la normale"
  if (a >= 1) return "au-dessus de la normale"
  if (a > -1) return "proche de la normale"
  if (a > -3) return "en dessous de la normale"
  if (a > -6) return "nettement en dessous de la normale"
  return "très en dessous de la normale"
}

/** Couleur de température absolue (utilisée seulement quand on montre explicitement l'absolu). */
export function absoluteHex(t: number): string {
  if (t <= -5) return "#1e3a8a"
  if (t <= 0) return "#2563eb"
  if (t <= 5) return "#60a5fa"
  if (t <= 10) return "#bfdbfe"
  if (t <= 15) return "#e7e5df"
  if (t <= 20) return "#fed7aa"
  if (t <= 25) return "#fb923c"
  if (t <= 32) return "#dc2626"
  return "#7f1d1d"
}
