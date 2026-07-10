import Link from "next/link"

interface Crumb {
  label: string
  href?: string
  icon?: React.ReactNode
}

const HOME_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const all = [{ label: "Accueil", href: "/", icon: HOME_ICON }, ...crumbs]

  return (
    <nav
      aria-label="Fil d'Ariane"
      className="px-5 py-2 flex items-center gap-1.5 text-xs text-neutral-400 overflow-x-auto scrollbar-none"
    >
      {all.map((crumb, i) => {
        const isLast = i === all.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-neutral-300">/</span>}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="flex items-center gap-1 hover:text-neutral-700 transition-colors">
                {crumb.icon}
                {crumb.label}
              </Link>
            ) : (
              <span className={`flex items-center gap-1 ${isLast ? "text-neutral-700 font-semibold" : ""}`}>
                {crumb.icon}
                {crumb.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
