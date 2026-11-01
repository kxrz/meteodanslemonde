import Link from "next/link"
import { Metadata } from "next"
import { Suspense } from "react"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import Card from "@/components/ui/Card"
import Section from "@/components/ui/Section"
import Explain from "@/components/ui/Explain"
import ConfirmedBanner from "@/components/ConfirmedBanner"
import BriefingCta from "@/components/briefing/BriefingCta"
import EmailPreview from "@/components/briefing/EmailPreview"
import { briefingExample } from "@/lib/briefing-example"
import { loadClimateFull } from "@/lib/climate-season"
import { RETENTION } from "@/lib/subscription"
import citiesFR from "@/data/cities-fr.json"

export const revalidate = 86400

const BASE = "https://www.cestchaud.fr"
const TITLE = "Briefing du matin · le chiffre du jour de votre ville en 10 secondes"
const DESCRIPTION = "Chaque matin, l'écart à la normale de votre ville, ce que le climat a déjà changé et l'idée reçue du jour. Gratuit, sans publicité, 62 villes suivies."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/notifications` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/notifications`,
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: `${BASE}/notifications/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [`${BASE}/notifications/opengraph-image`] },
}

const POINTS = [
  { n: "1", title: "L'écart du jour", text: "Votre ville comparée à un jour normal de ce mois. Plus doux, plus froid, ou pile dans la norme.", explain: "anomalie" as const },
  { n: "2", title: "Le climat derrière", text: "Ce que 30 ans de réchauffement ont déjà ajouté, et votre saison en 2050.", explain: "tendance" as const },
  { n: "3", title: "L'idée reçue du jour", text: "« Il gèle, donc pas de réchauffement ? » Démontée en une phrase.", explain: "meteoClimat" as const },
]

export default function NotificationsPage() {
  const now = new Date()
  const month = now.getMonth()
  const full = loadClimateFull()
  const lyon = citiesFR.find((c) => c.id === "lyon")!
  const example = briefingExample("lyon", lyon.name, full.lyon, month)

  return (
    <PageShell crumbs={[{ label: "Briefing du matin" }]}>
      <Suspense>
        <ConfirmedBanner />
      </Suspense>

      <div className="flex flex-col gap-16 sm:gap-20">
        {/* ── Écran 1 : la promesse + un seul bouton ── */}
        <header className="grid items-center gap-10 pt-2 lg:grid-cols-[1.1fr_1fr] lg:pt-8">
          <div className="flex flex-col gap-5">
            <Eyebrow>Briefing du matin · gratuit</Eyebrow>
            <Title as="h1" size="hero" animate>
              Le chiffre du jour de votre ville. <Hl tone="chaud">En 10 secondes.</Hl>
            </Title>
            <p className="max-w-md text-[18px] leading-snug text-ink-soft">
              Un email, chaque matin. Un chiffre, ce qu&apos;il veut dire, et c&apos;est tout.
            </p>
            <div>
              <BriefingCta />
            </div>
            <p className="text-[14px] text-mute">Sans publicité · désabonnement en un clic · {citiesFR.length} villes suivies</p>
          </div>
          {example && <EmailPreview example={example} month={month} date={now} />}
        </header>

        {/* ── Écran 2 : ce qu'il y a dedans ── */}
        <Section eyebrow="Dedans" title={<>Trois choses. <Hl>Pas plus.</Hl></>}>
          <ol className="grid gap-3 md:grid-cols-3" data-anim="stagger">
            {POINTS.map((p) => (
              <Card as="li" key={p.n} tone={p.n === "3" ? "signal" : "white"} className="flex flex-col gap-2">
                <span className="font-display text-5xl font-extrabold leading-none text-chaud" aria-hidden="true">{p.n}</span>
                <p className="flex items-center gap-2 font-display text-xl font-extrabold">
                  {p.title} <Explain term={p.explain} />
                </p>
                <p className="text-[16px] leading-snug text-ink-soft">{p.text}</p>
              </Card>
            ))}
          </ol>
        </Section>

        {/* ── Écran 3 : engagements + même bouton ── */}
        <Card tone="ink" className="flex flex-col gap-6 p-6 sm:p-10">
          <Title size="xl" className="text-paper">
            Gratuit. <span className="text-signal">Sans pub.</span> Sans revente.
          </Title>
          <ul className="flex flex-col gap-2 text-[16px] text-paper/85">
            <li>Un clic de confirmation avant le premier envoi.</li>
            <li>Un lien pour se désabonner dans chaque email.</li>
            <li>{RETENTION.short}</li>
          </ul>
          <div>
            <BriefingCta variant="paper" label="Je m'inscris" />
          </div>
        </Card>

        {/* ── Précisions ── */}
        <section aria-labelledby="precisions" className="flex max-w-3xl flex-col gap-3 text-[15px] leading-relaxed text-ink-soft">
          <h2 id="precisions" className="font-display text-xl font-extrabold text-ink">Bon à savoir</h2>
          <p>
            Le briefing couvre les <strong className="text-ink">{citiesFR.length} villes suivies</strong>{" "}par le site. Votre commune n&apos;y est pas&#8239;? Tapez-la quand même : on vous propose la ville suivie la plus proche, et c&apos;est d&apos;elle que parlera l&apos;email.
          </p>
          <p>
            Les chiffres : ressenti maximal prévu par Open-Meteo le matin même, comparé à la normale 1991-2020 de la réanalyse ERA5 ; projections des modèles du GIEC (CMIP6). <Link href="/a-propos" className="font-semibold text-ink underline underline-offset-2">La méthode</Link> · <Link href="/confidentialite" className="font-semibold text-ink underline underline-offset-2">Vos données</Link>
          </p>
        </section>
      </div>
    </PageShell>
  )
}
