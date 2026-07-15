import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

export const revalidate = 604800

export const metadata: Metadata = {
  title: "Politique de confidentialité · cestchaud.fr",
  description: "Comment cestchaud.fr collecte et utilise vos données personnelles dans le cadre du briefing matinal.",
  alternates: { canonical: "https://www.cestchaud.fr/confidentialite" },
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-lg font-bold text-neutral-900 mb-3">{title}</h2>
    <div className="text-sm text-neutral-600 leading-relaxed space-y-3">{children}</div>
  </section>
)

export default function ConfidentialitePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f4f0]">
      <SiteHeader asLink />

      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-5 py-14">
          <p className="text-xs uppercase tracking-widest font-semibold text-orange-500 mb-4">Politique de confidentialité</p>
          <h1 className="text-3xl font-black text-neutral-900 mb-2">Vos données personnelles</h1>
          <p className="text-sm text-neutral-400 mb-10">Dernière mise à jour : juillet 2025</p>

          <Section title="Qui sommes-nous ?">
            <p>
              cestchaud.fr est un service indépendant d'information climatique. Le responsable du traitement est Florent Leswww, joignable à <a href="mailto:florent@leswww.com" className="text-orange-500 underline">florent@leswww.com</a>.
            </p>
          </Section>

          <Section title="Données collectées">
            <p>Dans le cadre du briefing matinal par email, nous collectons uniquement :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Votre <strong>prénom</strong>, pour personnaliser l'email.</li>
              <li>Votre <strong>adresse email</strong>, pour envoyer le briefing.</li>
              <li>La ou les <strong>villes suivies</strong>, pour personnaliser le contenu.</li>
            </ul>
            <p>Aucune autre donnée n'est collectée. Nous n'utilisons pas de cookies tiers, pas de pixel de tracking dans nos emails, et nous ne vendons ni ne partageons vos données.</p>
          </Section>

          <Section title="Finalité du traitement">
            <p>
              Les données collectées sont utilisées exclusivement pour l'envoi du briefing matinal auquel vous avez souscrit (base légale : consentement explicite, article 6.1.a du RGPD).
            </p>
          </Section>

          <Section title="Sous-traitants">
            <p>Nous utilisons les services suivants, chacun soumis à sa propre politique de confidentialité :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Resend</strong> (Resend Inc., États-Unis) : routage et envoi des emails transactionnels. Données hébergées en conformité avec le Data Privacy Framework EU-US.</li>
              <li><strong>Neon</strong> (Neon Inc., États-Unis) : base de données PostgreSQL pour stocker les abonnements. Données hébergées en Europe (région AWS eu-west-1).</li>
            </ul>
          </Section>

          <Section title="Durée de conservation">
            <p>
              Vos données sont conservées tant que vous êtes abonné au briefing. En cas de désinscription (lien présent dans chaque email), vos données sont supprimées dans un délai de 30 jours.
            </p>
          </Section>

          <Section title="Vos droits">
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Droit d'accès</strong> : obtenir une copie des données vous concernant.</li>
              <li><strong>Droit de rectification</strong> : corriger des données inexactes.</li>
              <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données.</li>
              <li><strong>Droit de retrait du consentement</strong> : à tout moment, via le lien de désinscription dans l'email ou en nous contactant.</li>
            </ul>
            <p>Pour exercer ces droits, écrivez à <a href="mailto:florent@leswww.com" className="text-orange-500 underline">florent@leswww.com</a>. Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">CNIL</a>.</p>
          </Section>

          <Section title="Sécurité">
            <p>
              Les données sont transmises en HTTPS et stockées dans une base PostgreSQL avec accès restreint. Les tokens de confirmation et de désabonnement sont générés de façon cryptographiquement aléatoire.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Pour toute question relative à ce document ou au traitement de vos données : <a href="mailto:florent@leswww.com" className="text-orange-500 underline">florent@leswww.com</a>
            </p>
          </Section>
        </div>
      </main>

      <PageFooter />
    </div>
  )
}
