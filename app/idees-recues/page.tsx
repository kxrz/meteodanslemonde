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
import { cn } from "@/lib/cn"

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
            Une phrase entendue. Dix secondes. La réponse, avec les chiffres de votre ville.
          </p>
          <CityPicker cities={ctx.cities} value={ctx.city.id} label="Les chiffres de quelle ville ?" />
        </header>

        <nav aria-label="Sommaire des idées reçues" className="flex flex-col gap-3">
          <Eyebrow as="div">De saison</Eyebrow>
          <ol className="flex flex-wrap gap-2">
            {all.map((m, i) => (
              <li key={m.slug} className={cn(i === current.length && "basis-full pt-2")}>
                {i === current.length && <Eyebrow as="span" className="mb-2 block">Toute l&apos;année et les autres saisons</Eyebrow>}
                <Link
                  href={`#${m.slug}`}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border-2 text-left text-[15px] font-semibold leading-snug transition-colors",
                    "max-sm:w-11 max-sm:justify-center sm:px-4 sm:py-1.5",
                    i < current.length ? "border-ink bg-white hover:bg-ink hover:text-paper max-sm:bg-ink max-sm:text-paper" : "border-line bg-paper hover:border-ink",
                  )}
                >
                  <span className="font-mono text-[15px] font-bold sm:text-[12px] sm:font-normal sm:text-mute">{i + 1}</span>
                  <span className="max-sm:sr-only">{m.claim}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

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
