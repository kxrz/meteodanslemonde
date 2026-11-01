import type { Metadata } from "next"
import Link from "next/link"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import PrintButton from "@/components/atelier/PrintButton"
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary"

export const metadata: Metadata = {
  title: "Glossaire du climat : normale, anomalie, ERA5, SSP… · cestchaud.fr",
  description: "Les mots du climat expliqués en une phrase, puis en un paragraphe. Normale, anomalie, ressenti, tendance, projection, scénario SSP, ERA5, jumeau climatique.",
  alternates: { canonical: "https://www.cestchaud.fr/atelier/glossaire" },
}

/** Où chaque terme sert sur le site. */
const USED_IN: Record<GlossaryKey, { href: string; label: string }[]> = {
  ressenti: [{ href: "/", label: "Aujourd'hui" }, { href: "/idees-recues#vague-de-froid-preuve", label: "Les extrêmes de l'année" }],
  normale: [{ href: "/", label: "Aujourd'hui" }, { href: "/idees-recues#hivers-doux-toujours", label: "La courbe qui glisse" }],
  anomalie: [{ href: "/", label: "La carte du jour" }, { href: "/idees-recues#il-gele-donc", label: "Météo ou climat ?" }],
  tendance: [{ href: "/idees-recues#un-degre-cest-rien", label: "+1,5 °C, ce n'est rien ?" }, { href: "/idees-recues#il-gele-donc", label: "Décomposer l'écart" }],
  projection: [{ href: "/jumeaux", label: "Jumeaux 2050" }, { href: "/idees-recues#jumeau-2050", label: "2050, c'est loin ?" }],
  ssp: [{ href: "/jumeaux", label: "Jumeaux 2050" }, { href: "/a-propos", label: "Méthode et sources" }],
  era5: [{ href: "/a-propos", label: "Méthode et sources" }],
  cmip6: [{ href: "/a-propos", label: "Méthode et sources" }, { href: "/jumeaux", label: "Jumeaux 2050" }],
  jumeau: [{ href: "/jumeaux", label: "Jumeaux 2050" }],
  nuitTropicale: [{ href: "/signaux", label: "Signaux du mois" }, { href: "/idees-recues#clim-suffit", label: "La clim suffit ?" }],
  nuitGel: [{ href: "/signaux", label: "Signaux du mois" }, { href: "/idees-recues#pas-de-gel-tant-mieux", label: "Pas de gel, tant mieux ?" }],
  meteoClimat: [{ href: "/idees-recues#il-gele-donc", label: "Il gèle, donc… ?" }, { href: "/atelier", label: "L'atelier" }],
  firms: [{ href: "/feux", label: "Les feux" }],
}

const letterOf = (term: string) => term.normalize("NFD").replace(/[̀-ͯ]/g, "")[0].toUpperCase()

export default function GlossairePage() {
  const entries = (Object.keys(GLOSSARY) as GlossaryKey[])
    .map((key) => ({ key, ...GLOSSARY[key] as { term: string; short: string; long?: string } }))
    .sort((a, b) => a.term.localeCompare(b.term, "fr"))
  const letters = [...new Set(entries.map((e) => letterOf(e.term)))]

  return (
    <PageShell crumbs={[{ label: "Atelier", href: "/atelier" }, { label: "Glossaire" }]} width="text">
      <div className="flex flex-col gap-10 print:gap-6">
        <header className="flex flex-col gap-4 pt-4">
          <Eyebrow>Glossaire · {entries.length} mots</Eyebrow>
          <Title as="h1" size="xl" animate>Les mots du climat, <Hl>sans jargon</Hl>.</Title>
          <p className="text-[17px] leading-relaxed text-ink-soft">Une phrase pour comprendre. Un paragraphe pour aller plus loin.</p>
          <div className="print:hidden"><PrintButton /></div>
        </header>

        <nav aria-label="Sommaire alphabétique" className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-paper-deep p-5 print:hidden">
          <ul className="flex flex-wrap gap-1.5" aria-label="Lettres">
            {letters.map((l) => (
              <li key={l}>
                <a href={`#lettre-${l}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white font-display text-lg font-extrabold hover:bg-ink hover:text-paper">{l}</a>
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
            {entries.map((e) => (
              <li key={e.key}><a href={`#${e.key}`} className="inline-flex min-h-11 items-center font-semibold underline-offset-2 hover:underline">{e.term}</a></li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-4 print:gap-3">
          {entries.map((e, i) => {
            const first = i === 0 || letterOf(entries[i - 1].term) !== letterOf(e.term)
            return (
              <div key={e.key} className="flex flex-col gap-4">
                {first && <p id={`lettre-${letterOf(e.term)}`} className="scroll-mt-24 font-display text-5xl font-extrabold text-chaud print:text-3xl" aria-hidden="true">{letterOf(e.term)}</p>}
                <article id={e.key} aria-labelledby={`${e.key}-titre`} className="scroll-mt-24 rounded-[var(--radius-card)] bg-white p-5 target:outline target:outline-4 target:outline-signal sm:p-7 print:break-inside-avoid print:rounded-none print:border-b print:border-line print:p-0 print:pb-3">
                  <h2 id={`${e.key}-titre`} className="font-display text-[clamp(1.6rem,4vw,2.2rem)] font-extrabold leading-tight tracking-tight print:text-xl">{e.term}</h2>
                  <p className="mt-2 text-[18px] font-semibold leading-snug print:text-[12pt]">{e.short}</p>
                  {e.long && <p className="mt-3 text-[16px] leading-relaxed text-ink-soft print:text-[11pt]">{e.long}</p>}
                  <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] print:hidden">
                    <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-mute">Voir aussi</span>
                    {USED_IN[e.key].map((u) => (
                      <Link key={u.href} href={u.href} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2 hover:text-chaud">{u.label}</Link>
                    ))}
                  </p>
                </article>
              </div>
            )
          })}
        </div>

        <p className="text-[13px] text-mute">
          Sources : Copernicus (ERA5), GIEC (AR6, CMIP6), Organisation météorologique mondiale (normales 1991-2020), Open-Meteo, NASA FIRMS. Imprimé depuis cestchaud.fr/atelier/glossaire.
        </p>
      </div>
    </PageShell>
  )
}
