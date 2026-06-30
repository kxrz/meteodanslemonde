export function fmt(n: number | null | undefined, decimals = 1): string {
  if (n == null) return "-"
  return n.toFixed(decimals)
}

export function fmtDelta(n: number | null | undefined, decimals = 1): string {
  if (n == null) return "-"
  return (n > 0 ? "+" : "") + n.toFixed(decimals)
}
