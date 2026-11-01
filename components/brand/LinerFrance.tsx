import { FRANCE_PATH, NEIGHBOURS_PATH, VIEW_H, VIEW_W, graticulePath } from "@/lib/france-shape"

/**
 * Fond de carte de France, style Liner : papier, graticule en pointillés, voisins en trait fin,
 * la France en trait épais remplie d'une trame de points. Les villes se posent par-dessus (children).
 * `id` doit être unique dans la page (il nomme la trame).
 */
export default function LinerFrance({ id = "fr", children, className, label, ink = "var(--color-ink)", screen = "var(--color-ink)" }: {
  id?: string
  children?: React.ReactNode
  className?: string
  label?: string
  ink?: string
  screen?: string
}) {
  const pattern = `trame-${id}`
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={className} role={label ? "group" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <pattern id={pattern} width="7" height="7" patternUnits="userSpaceOnUse">
          <rect x="2.5" y="2.5" width="2" height="2" fill={screen} opacity="0.55" />
        </pattern>
        <clipPath id={`${pattern}-clip`}><rect width={VIEW_W} height={VIEW_H} /></clipPath>
      </defs>
      <g clipPath={`url(#${pattern}-clip)`}>
        <path d={graticulePath(2)} stroke={ink} strokeWidth="1" strokeDasharray="2 5" fill="none" opacity="0.45" />
        <path d={NEIGHBOURS_PATH} stroke={ink} strokeWidth="1" fill="none" opacity="0.55" strokeLinejoin="round" />
        <path data-outline d={FRANCE_PATH} fill={`url(#${pattern})`} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      </g>
      {children}
    </svg>
  )
}
