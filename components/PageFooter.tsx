import Link from "next/link"
import Logo from "@/components/brand/Logo"
import { NAV_MAIN, NAV_MORE } from "@/components/nav"
import { cn } from "@/lib/cn"

/** Pied de page commun : rappel de la marque, toutes les rubriques, sources, légal. */
export default function PageFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("no-print mt-16 bg-ink text-paper", className)}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <span className="w-fit rounded-md bg-paper px-2.5 py-1.5"><Logo size="sm" /></span>
          <p className="max-w-sm font-display text-2xl font-extrabold leading-tight">
            La science mesure. <span className="text-signal">À nous de le dire clairement.</span>
          </p>
          <p className="max-w-sm text-[14px] text-paper/70">
            Données ouvertes uniquement : Open-Meteo, Copernicus ERA5, GIEC CMIP6, NASA FIRMS. Aucun texte généré au hasard, chaque chiffre a une source.
          </p>
        </div>
        <nav aria-label="Rubriques (pied de page)">
          <ul className="flex flex-col gap-2">
            {NAV_MAIN.map((i) => (
              <li key={i.href}><Link href={i.href} className="font-display text-lg font-bold hover:text-signal">{i.label}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Services et projet">
          <ul className="flex flex-col gap-2">
            {NAV_MORE.map((i) => (
              <li key={i.href}><Link href={i.href} className="text-[15px] text-paper/85 hover:text-signal">{i.label}</Link></li>
            ))}
            <li><Link href="/mentions-legales" className="text-[15px] text-paper/85 hover:text-signal">Mentions légales</Link></li>
            <li><Link href="/confidentialite" className="text-[15px] text-paper/85 hover:text-signal">Confidentialité</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-paper/15">
        <p className="mx-auto max-w-7xl px-4 py-4 font-mono text-[12px] text-paper/60 sm:px-6">
          cestchaud.fr · un projet <a href="https://leswww.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-paper">LesWWW</a>
        </p>
      </div>
    </footer>
  )
}
