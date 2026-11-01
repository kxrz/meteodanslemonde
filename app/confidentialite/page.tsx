import Link from "next/link"
import { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import { PROCESSORS, RETENTION } from "@/lib/subscription"

export const revalidate = 604800

export const metadata: Metadata = {
  title: "Confidentialité · cestchaud.fr",
  description: "Ce que cestchaud.fr collecte, pourquoi, combien de temps, et comment exercer vos droits.",
  alternates: { canonical: "https://www.cestchaud.fr/confidentialite" },
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-24 flex flex-col gap-3 border-t-2 border-ink pt-6">
      <h2 id={`${id}-t`} className="font-display text-2xl font-extrabold">{title}</h2>
      <div className="flex flex-col gap-3 text-[16px] leading-relaxed text-ink-soft [&_strong]:text-ink">{children}</div>
    </section>
  )
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) =>
  href.startsWith("/")
    ? <Link href={href} className="font-semibold text-ink underline underline-offset-2">{children}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">{children}</a>

export default function ConfidentialitePage() {
  return (
    <PageShell width="text" crumbs={[{ label: "Confidentialité" }]}>
      <div className="flex flex-col gap-10 pt-2 sm:pt-6">
        <header className="flex flex-col gap-4">
          <Eyebrow>Confidentialité · mise à jour : novembre 2026</Eyebrow>
          <Title as="h1" size="xl">
            Vos données : <Hl>le strict nécessaire</Hl>.
          </Title>
          <p className="text-[18px] leading-snug text-ink-soft">
            Pas de publicité, pas de revente, pas de cookie. Voici exactement ce que nous gardons, et pour combien de temps.
          </p>
        </header>

        <Block id="responsable" title="Qui est responsable ?">
          <p>
            <strong>LesWWW</strong> (EURL, SIREN 912 258 050), représentée par son gérant <strong>Florent Bertiaux</strong>, édite cestchaud.fr et décide de l&apos;usage des données. Pour toute question : la <A href="/contact">page Contact</A>. Détails dans les <A href="/mentions-legales">mentions légales</A>.
          </p>
        </Block>

        <Block id="briefing" title="Le briefing par email">
          <p>Si vous vous inscrivez, nous enregistrons : votre <strong>email</strong>, votre <strong>prénom</strong> s&apos;il est renseigné (il est facultatif), vos <strong>villes</strong>, les dates d&apos;inscription et de confirmation, votre choix « bêta-testeur » et un jeton aléatoire qui sert de lien personnel vers votre profil.</p>
          <p><strong>Pourquoi :</strong> vous envoyer le briefing que vous avez demandé. <strong>Base légale :</strong> votre consentement (case à cocher, puis confirmation par email).</p>
          <p><strong>Combien de temps :</strong> {RETENTION.long}</p>
        </Block>

        <Block id="contact" title="Le formulaire de contact">
          <p>Votre nom, votre email et votre message nous sont transmis par email (via Resend) pour que nous puissions vous répondre. Ils ne sont pas enregistrés sur le site. Ils restent dans notre boîte de réception : aucun effacement automatique n&apos;est programmé, et vous pouvez demander leur suppression à tout moment.</p>
          <p><strong>Base légale :</strong> notre intérêt légitime à répondre aux messages reçus.</p>
        </Block>

        <Block id="audience" title="Mesure d'audience">
          <p>
            Nous utilisons <strong>Vercel Analytics</strong> pour compter les pages vues. Il ne dépose <strong>aucun cookie</strong>{" "}et ne crée pas de profil : il enregistre la page, le site d&apos;origine, le pays, le type d&apos;appareil et le navigateur, de façon agrégée. Les visiteurs ne sont pas identifiés d&apos;une visite à l&apos;autre.
          </p>
          <p><strong>Base légale :</strong> notre intérêt légitime à savoir quelles pages sont utiles.</p>
        </Block>

        <Block id="navigateur" title="Ce qui reste dans votre navigateur">
          <p>Le site garde dans le stockage local de votre navigateur le nombre de vos visites et votre choix de masquer la proposition d&apos;installation sur l&apos;écran d&apos;accueil. Ces informations ne nous sont pas transmises. Vous pouvez les effacer depuis les réglages de votre navigateur.</p>
        </Block>

        <Block id="tiers" title="Services appelés par votre navigateur">
          <p>Certaines fonctions font appel, depuis votre navigateur, à des services publics ou ouverts qui reçoivent donc votre adresse IP :</p>
          <ul className="list-disc pl-5">
            <li><strong>geo.api.gouv.fr</strong> (État français) quand vous tapez une commune dans la recherche ;</li>
            <li><strong>CARTO</strong> (fonds de carte) sur les pages qui affichent une carte ;</li>
            <li><strong>Open-Meteo</strong> pour la courbe des 30 derniers jours sur les fiches ville.</li>
          </ul>
          <p>Les polices de caractères sont hébergées sur nos serveurs : aucun appel à Google Fonts.</p>
        </Block>

        <Block id="prestataires" title="Nos prestataires">
          <ul className="list-disc pl-5">
            <li>{PROCESSORS.resend}</li>
            <li>{PROCESSORS.neon}</li>
            <li>{PROCESSORS.vercel} Ses journaux techniques (dont les adresses IP) servent à la sécurité et au bon fonctionnement du site. Transfert encadré par le Data Privacy Framework UE–États-Unis.</li>
          </ul>
          <p>Aucune donnée n&apos;est vendue ni louée.</p>
        </Block>

        <Block id="droits" title="Vos droits">
          <p>Vous pouvez accéder à vos données, les corriger, les exporter, retirer votre consentement ou les faire effacer.</p>
          <ul className="list-disc pl-5">
            <li><strong>Depuis votre profil</strong> (lien en bas de chaque briefing) : modifier votre prénom, retirer une ville, télécharger vos données, vous désabonner, supprimer votre compte.</li>
            <li><strong>Par la <A href="/contact">page Contact</A></strong> pour toute autre demande, y compris l&apos;effacement d&apos;un message envoyé.</li>
          </ul>
          <p>Vous pouvez aussi saisir la <A href="https://www.cnil.fr/fr/plaintes">CNIL</A>.</p>
        </Block>

        <Block id="securite" title="Sécurité">
          <p>Tout passe en HTTPS. La base de données n&apos;est accessible qu&apos;au site. Votre lien de profil contient un jeton aléatoire : il fonctionne comme un mot de passe, ne le partagez pas. Si c&apos;est arrivé, créez-en un nouveau depuis votre profil.</p>
        </Block>
      </div>
    </PageShell>
  )
}
