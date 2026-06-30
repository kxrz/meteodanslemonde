import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

export const revalidate = 604800

export const metadata: Metadata = {
  title: "Mentions légales - cestchaud.fr",
  alternates: { canonical: "https://cestchaud.fr/mentions-legales" },
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <SiteHeader asLink />

      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Left */}
        <div className="lg:w-[40%] shrink-0 p-5 lg:p-8 lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-black/[0.06]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
              Informations légales
            </p>
            <h1 className="text-3xl font-black text-neutral-900 leading-tight">
              Mentions légales
            </h1>
            <p className="text-xs text-neutral-400 mt-3">Mise à jour : Mai 2026</p>
          </div>
          <PageFooter />
        </div>

        {/* Right */}
        <div className="flex-1 p-5 lg:p-8 overflow-y-auto">
          <div className="max-w-lg space-y-4">

            <div className="bg-white rounded-3xl p-6 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400">Éditeur</p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                <strong className="text-neutral-900">LesWWW</strong> - EURL<br />
                SIREN : 912 258 050 - RCS Lille Métropole<br />
                N° TVA : FR60 912 258 050<br />
                Code NAF : 73.11Z<br />
                Gérant : Florent Bertiaux<br />
                Bureau : Chez NOW Coworking, 40 Place du Théâtre, 59800 Lille
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400">Contact</p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                Via la <a href="/contact" className="underline hover:text-neutral-900">page Contact</a> de ce site. Aucune adresse e-mail directe affichée publiquement.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400">Hébergement</p>
              <p className="text-sm text-neutral-700">
                Vercel Inc., San Francisco, CA - infrastructure européenne.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400">Propriété intellectuelle</p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                L&apos;ensemble du site est protégé par la législation sur la propriété intellectuelle. Toute reproduction nécessite l&apos;accord écrit de LesWWW.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400">Données personnelles</p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                Pas de tracking analytics, pas de cookie publicitaire. Les échanges via le formulaire de contact ne sont ni revendus ni loués.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400">Responsabilité</p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                Les informations sont mises à jour avec soin mais sans garantie d&apos;exactitude permanente. Toute utilisation du site se fait sous votre responsabilité.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
