/**
 * L'anneau de l'écart : un « ° » épais, moitié chaud, moitié froid.
 * Le signe de la marque. Il dit : ce qui compte, c'est l'écart, pas le thermomètre.
 */
export const MARK_HOT_PATH = "M46.85 17.15A21 21 0 0 0 17.15 46.85"
export const MARK_COLD_PATH = "M46.85 17.15A21 21 0 0 1 17.15 46.85"

export default function Mark({ size = 28, className, title, mono }: { size?: number; className?: string; title?: string; mono?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={MARK_HOT_PATH} fill="none" stroke={mono ?? "#e3261b"} strokeWidth="14" />
      <path d={MARK_COLD_PATH} fill="none" stroke={mono ?? "#1d4ed8"} strokeWidth="14" />
    </svg>
  )
}
