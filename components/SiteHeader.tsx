import Link from "next/link"
import SiteHeaderMenu from "@/components/SiteHeaderMenu"
import Logo from "@/components/brand/Logo"
import Today from "@/components/Today"
import { NAV_MAIN } from "@/components/nav"
import { SEASON_LABEL, seasonOf } from "@/lib/season"

interface Props {
  /** conservé pour compatibilité : le logo est toujours un lien vers l'accueil */
  asLink?: boolean
  /** phrase de contexte affichée sous la barre (facultatif) */
  subtitle?: string
}

/** Barre du haut, identique sur toutes les pages : logo, date, saison, navigation. */
export default function SiteHeader({ subtitle }: Props) {
  const season = seasonOf(new Date().getMonth())
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[3000] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Aller au contenu
      </a>
      <header className="no-print sticky top-0 z-[1000] border-b-2 border-ink bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" aria-label="cestchaud.fr, accueil" className="shrink-0 rounded-md py-1">
              <Logo />
            </Link>
            <span className="hidden items-center gap-2 text-[13px] text-mute md:flex">
              <span className="rounded-full bg-froid px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-white">{SEASON_LABEL[season]}</span>
              <Today className="first-letter:uppercase" />
            </span>
          </div>
          <nav aria-label="Rubriques" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {NAV_MAIN.slice(1).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="rounded-full px-3 py-2 font-display text-[15px] font-bold text-ink hover:bg-ink hover:text-paper">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <SiteHeaderMenu />
        </div>
      </header>
      {subtitle && (
        <p className="mx-auto max-w-7xl px-4 pt-3 text-[14px] text-mute sm:px-6">{subtitle}</p>
      )}
      <span id="contenu" />
    </>
  )
}
