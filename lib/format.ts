// Formatage des nombres à la française : virgule décimale, vrai signe moins (U+2212).
// Une valeur entière s'affiche sans décimale inutile (12 °C, pas 12,0 °C).

const MINUS = "−"

function frNumber(n: number, decimals: number): string {
  const rounded = Number(n.toFixed(decimals))
  const str = Number.isInteger(rounded) ? String(Math.abs(rounded)) : Math.abs(rounded).toFixed(decimals)
  return str.replace(".", ",")
}

/** 12,4 · −3 · 0 */
export function fmt(n: number | null | undefined, decimals = 1): string {
  if (n == null || Number.isNaN(n)) return "–"
  const rounded = Number(n.toFixed(decimals))
  return (rounded < 0 ? MINUS : "") + frNumber(n, decimals)
}

/** +1,5 · −0,3 · 0 (toujours signé sauf zéro) */
export function fmtDelta(n: number | null | undefined, decimals = 1): string {
  if (n == null || Number.isNaN(n)) return "–"
  const rounded = Number(n.toFixed(decimals))
  if (rounded === 0) return "0"
  return (rounded > 0 ? "+" : MINUS) + frNumber(n, decimals)
}

/** 12 °C (espace insécable fine avant l'unité) */
export function fmtTemp(n: number | null | undefined, decimals = 0): string {
  if (n == null || Number.isNaN(n)) return "–"
  return `${fmt(n, decimals)} °C`
}

/** +1,5 °C */
export function fmtDeltaTemp(n: number | null | undefined, decimals = 1): string {
  if (n == null || Number.isNaN(n)) return "–"
  return `${fmtDelta(n, decimals)} °C`
}
