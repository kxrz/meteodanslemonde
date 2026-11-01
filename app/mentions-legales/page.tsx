import Link from "next/link"
import { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"

export const revalidate = 604800

export const metadata: Metadata = {
  title: "Mentions légales · cestchaud.fr",
  alternates: { canonical: "https://www.cestchaud.fr/mentions-legales" },
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t-2 border-ink pt-5">
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      <div className="text-[16px] leading-relaxed text-ink-soft [&_strong]:text-ink">{children}</div>
    </section>
  )
}

export default function MentionsLegalesPage() {
  return (
    <PageShell width="text" crumbs={[{ label: "Mentions légales" }]}>
      <div className="flex flex-col gap-8 pt-2 sm:pt-6">
        <header className="flex flex-col gap-3">
          <Eyebrow>Informations légales · mise à jour : novembre 2026</Eyebrow>
          <Title as="h1" size="xl">Mentions <Hl>légales</Hl>.</Title>
        </header>

        <Block title="Éditeur">
          <p>
            <strong>LesWWW</strong>, EURL<br />
            SIREN 912 258 050, RCS Lille Métropole<br />
            TVA intracommunautaire FR60 912 258 050 · code NAF 73.11Z<br />
            Siège : chez NOW Coworking, 40 place du Théâtre, 59800 Lille
          </p>
        </Block>

        <Block title="Directeur de la publication">
          <p><strong>Florent Bertiaux</strong>, gérant de LesWWW.</p>
        </Block>

        <Block title="Contact">
          <p>Par la <Link href="/contact" className="font-semibold text-ink underline underline-offset-2">page Contact</Link>. Aucune adresse email directe n&apos;est affichée publiquement.</p>
        </Block>

        <Block title="Hébergement">
          <p><strong>Vercel Inc.</strong>, 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis.</p>
        </Block>

        <Block title="Données personnelles">
          <p>
            Pas de publicité, pas de cookie, pas de revente. La mesure d&apos;audience (Vercel Analytics) fonctionne sans cookie. Les polices sont hébergées sur nos serveurs. Tout le détail, dont la durée de conservation des abonnements, est dans la{" "}
            <Link href="/confidentialite" className="font-semibold text-ink underline underline-offset-2">politique de confidentialité</Link>.
          </p>
        </Block>

        <Block title="Données et sources">
          <p>
            Les données climatiques proviennent de sources ouvertes (Open-Meteo, Copernicus ERA5, GIEC CMIP6, NASA FIRMS), citées sur chaque page et détaillées dans la{" "}
            <Link href="/a-propos" className="font-semibold text-ink underline underline-offset-2">méthode</Link>. Elles restent soumises à leurs licences respectives.
          </p>
        </Block>

        <Block title="Propriété intellectuelle">
          <p>Les textes, la mise en forme et la marque cestchaud.fr appartiennent à LesWWW. Toute reproduction nécessite son accord écrit, en dehors des citations courtes avec lien vers la source.</p>
        </Block>

        <Block title="Responsabilité">
          <p>Les informations sont mises à jour avec soin, sans garantie d&apos;exactitude permanente. Elles ne remplacent pas les vigilances officielles de Météo-France.</p>
        </Block>
      </div>
    </PageShell>
  )
}
