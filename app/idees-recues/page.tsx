import type { Metadata } from "next"
import Link from "next/link"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import CityPicker from "@/components/pedago/CityPicker"
import MythFeed from "@/components/myths/MythFeed"
import { loadPedagoContext } from "@/lib/pedago-data"
import { mythsInPageOrder } from "@/lib/pedago"
import { SEASON_LABEL, isColdHalf, isHotSeason } from "@/lib/season"

export const metadata: Metadata = {
  title: "Idées reçues sur le climat, démontées en 10 secondes · cestchaud.fr",
  description: "« Il gèle, donc pas de réchauffement. » « +1,5 °C, ce n'est rien. » Vrai ou faux ? La réponse, le chiffre de votre ville, les sources.",
  alternates: { canonical: "https://www.cestchaud.fr/idees-recues" },
  openGraph: {
    title: "Il fait froid, donc… non.",
    description: "Les idées reçues sur le climat, démontées avec les chiffres de votre ville.",
    url: "https://www.cestchaud.fr/idees-recues",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
}

export default async function IdeesRecuesPage({ searchParams }: { searchParams: Promise<{ ville?: string | string[] }> }) {
  const { ville } = await searchParams
  const ctx = await loadPedagoContext(ville)
  const { current, others } = mythsInPageOrder(ctx.season)
  const all = [...current, ...others]
  const month = ctx.month

  const title = isColdHalf(month)
    ? <>Il fait froid, donc… <Hl tone="chaud">non</Hl>.</>
    : isHotSeason(month)
      ? <>Il a toujours fait chaud l&apos;été&#8239;? <Hl tone="chaud">Non</Hl>.</>
      : <>Vous l&apos;avez entendu. C&apos;est <Hl tone="chaud">faux</Hl>.</>

  return (
    <PageShell crumbs={[{ label: "Idées reçues" }]}>
      <div className="flex flex-col gap-8 sm:gap-12">
        <header className="flex flex-col gap-5 pt-2 sm:pt-6">
          <Eyebrow>{all.length} idées reçues · édition {SEASON_LABEL[ctx.season]}</Eyebrow>
          <Title as="h1" size="hero" animate className="max-w-4xl">{title}</Title>
          <p className="max-w-[48ch] font-display text-[clamp(1.2rem,2.6vw,1.6rem)] font-bold leading-snug text-ink-soft">
            Une phrase qu&apos;on entend souvent. Vous tranchez. La réponse arrive avec les chiffres de votre ville.
          </p>
        </header>

        {/* Mode d'emploi : d'abord la ville, ensuite on fait défiler */}
        <section aria-label="Avant de commencer" className="flex flex-col gap-6 rounded-[var(--radius-card)] bg-white p-5 sm:p-8">
          <div className="flex flex-col gap-3">
            <p className="font-display text-[clamp(1.3rem,2.8vw,1.8rem)] font-extrabold leading-tight">
              <span className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink align-middle font-mono text-[16px] text-paper">1</span>
              Choisissez votre ville
            </p>
            <CityPicker cities={ctx.cities} value={ctx.city.id} label={<span className="sr-only">Votre ville</span>} size="xl" />
          </div>
          <div className="flex flex-col gap-2 border-t border-line pt-5">
            <p className="font-display text-[clamp(1.3rem,2.8vw,1.8rem)] font-extrabold leading-tight">
              <span className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink align-middle font-mono text-[16px] text-paper">2</span>
              Faites défiler
            </p>
            <p className="max-w-[60ch] text-[17px] leading-relaxed text-ink-soft">
              Les {all.length} idées reçues se suivent, celles de la saison d&apos;abord. Pour chacune, touchez « Vrai ou faux ? » : la réponse s&apos;affiche, avec l&apos;explication et les chiffres de {ctx.city.name}.
            </p>
          </div>
          <a href={`#${all[0].slug}`} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-ink px-6 font-display text-[16px] font-bold text-paper hover:bg-ink-soft">
            Commencer
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
          </a>
        </section>

        <MythFeed myths={all} ctx={ctx} inSeason={(m) => current.includes(m)} />

        {!ctx.hasData && (
          <p className="rounded-2xl bg-signal p-4 font-display text-lg font-bold">
            Les relevés du jour ne sont pas encore arrivés. Les normales, tendances et projections restent affichées.
          </p>
        )}
        <p className="text-[13px] text-mute">
          Normales et tendances Copernicus ERA5 (1991-2020), projections GIEC CMIP6, relevés du jour Open-Meteo.{" "}
          <Link href="/atelier/glossaire" className="underline underline-offset-2">Glossaire</Link> ·{" "}
          <Link href="/atelier" className="underline underline-offset-2">Animer un atelier</Link>
        </p>
      </div>
    </PageShell>
  )
}
