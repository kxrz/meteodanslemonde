import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import PageShell from "@/components/ui/PageShell"
import Eyebrow from "@/components/ui/Eyebrow"
import CityPicker from "@/components/pedago/CityPicker"
import MythFeed from "@/components/myths/MythFeed"
import { ButtonLink, Arrow } from "@/components/ui/Button"
import { MYTHS } from "@/lib/myths"
import { loadPedagoContext } from "@/lib/pedago-data"

export function generateStaticParams() {
  return MYTHS.map((m) => ({ slug: m.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const myth = MYTHS.find((m) => m.slug === slug)
  if (!myth) return {}
  const url = `https://www.cestchaud.fr/idees-recues/${slug}`
  return {
    title: `« ${myth.claim} » Vrai ou faux ? · cestchaud.fr`,
    description: myth.answer,
    alternates: { canonical: url },
    openGraph: { title: `« ${myth.claim} »`, description: `En vrai : ${myth.answer}`, url, siteName: "cestchaud.fr", locale: "fr_FR", type: "article" },
    twitter: { card: "summary_large_image", title: `« ${myth.claim} »`, description: `En vrai : ${myth.answer}` },
  }
}

/** Page d'une seule idée reçue : c'est l'URL qu'on partage (aperçu 1200×630 dédié). */
export default async function MythPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ville?: string | string[] }> }) {
  const { slug } = await params
  const { ville } = await searchParams
  const myth = MYTHS.find((m) => m.slug === slug)
  if (!myth) notFound()
  const ctx = await loadPedagoContext(ville)

  return (
    <PageShell crumbs={[{ label: "Accueil", href: "/" }, { label: "Idées reçues", href: "/idees-recues" }, { label: "Vrai ou faux ?" }]}>
      <div className="flex flex-col gap-8">
        <h1 className="sr-only">Idée reçue : « {myth.claim} »</h1>
        <MythFeed myths={[myth]} ctx={ctx} inSeason={(m) => m.seasons.includes(ctx.season)} />
        <div className="flex flex-col gap-5 rounded-[var(--radius-card)] bg-paper-deep p-6">
          <CityPicker cities={ctx.cities} value={ctx.city.id} label="Les chiffres d'une autre ville ?" />
          <Eyebrow>Il en reste {MYTHS.length - 1}</Eyebrow>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/idees-recues?ville=${ctx.city.id}`}>Toutes les idées reçues <Arrow /></ButtonLink>
            <ButtonLink href="/atelier" variant="ghost">Animer un atelier</ButtonLink>
          </div>
        </div>
        <p className="text-[13px] text-mute">
          <Link href="/atelier/glossaire" className="underline underline-offset-2">Glossaire</Link> · <Link href="/a-propos" className="underline underline-offset-2">Méthode et sources</Link>
        </p>
      </div>
    </PageShell>
  )
}
