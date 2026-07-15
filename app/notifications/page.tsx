import Link from "next/link"
import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

export const metadata: Metadata = {
  title: "Briefing matinal · Données climatiques de votre ville chaque matin",
  description: "Recevez chaque matin par email le ressenti du jour, l'anomalie vs la normale et les projections GIEC pour la ville de votre choix. Gratuit, sans publicité.",
  alternates: { canonical: "https://www.cestchaud.fr/notifications" },
}

const FEATURES = [
  {
    label: "Ressenti max du jour",
    desc: "La température ressentie prévue pour aujourd'hui, calculée d'après le modèle Open-Meteo.",
  },
  {
    label: "Anomalie vs la normale",
    desc: "Écart par rapport à la normale climatique ERA5 du même mois sur 30 ans. Vous savez tout de suite si c'est une journée hors norme.",
  },
  {
    label: "Alerte canicule",
    desc: "Si le seuil d'alerte canicule est atteint pour votre ville, c'est signalé clairement.",
  },
  {
    label: "Jumeau climatique du jour",
    desc: "La ville dans le monde qui vit la même température aujourd'hui. Une façon concrète de se représenter le ressenti.",
  },
  {
    label: "Projections GIEC 2050",
    desc: "Le scénario intermédiaire CMIP6 pour votre ville : de combien de degrés l'été sera plus chaud d'ici 2050.",
  },
]

const STEPS = [
  {
    num: "1",
    title: "Choisissez une ville",
    desc: "Naviguez parmi les 500+ villes françaises disponibles sur cestchaud.fr et ouvrez sa page.",
  },
  {
    num: "2",
    title: "Inscrivez-vous en 30 secondes",
    desc: "Prénom, email et consentement. Un lien de confirmation vous est envoyé aussitôt.",
  },
  {
    num: "3",
    title: "Recevez votre briefing à 7h",
    desc: "Chaque matin, l'essentiel de la situation climatique pour votre ville, avant de commencer votre journée.",
  },
]

export default function NotificationsPage() {
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  const todayShort = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f4f0]">
      <SiteHeader asLink />

      {/* Hero sombre */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-5xl mx-auto px-5 py-16 lg:py-24">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start lg:items-center">

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-orange-400 mb-5">
                Briefing matinal
              </p>
              <h1 className="text-4xl lg:text-5xl font-black leading-[1.08] tracking-tight mb-5" style={{ textWrap: "balance" } as React.CSSProperties}>
                Votre météo climatique,{" "}
                <span className="text-orange-400">chaque matin.</span>
              </h1>
              <p className="text-neutral-400 text-base leading-relaxed mb-8 max-w-md">
                Un email sobre, envoyé à 7h, avec le ressenti du jour, l&apos;anomalie vs la normale et les projections GIEC pour la ville de votre choix.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/r"
                  className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
                >
                  Choisir ma ville
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/14 text-white/70 font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
                >
                  Voir la carte
                </Link>
              </div>
            </div>

            {/* Mock email */}
            <div className="w-full lg:w-[340px] shrink-0">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden text-neutral-900">
                {/* En-tête email */}
                <div className="bg-neutral-100 px-4 py-3 border-b border-neutral-200">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-[0.12em] font-semibold mb-0.5">Nouveau message</p>
                  <p className="text-xs font-semibold text-neutral-700">De : cestchaud.fr</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Bordeaux · {todayShort}</p>
                </div>
                {/* Corps email */}
                <div className="px-5 py-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">Ressenti max aujourd&apos;hui</p>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-5xl font-black text-neutral-900 leading-none">38°</span>
                    <span className="text-sm font-semibold text-orange-500">+4.2°C vs normale</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">Alerte canicule</p>
                    <span className="inline-block bg-red-50 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Niveau orange · Préfecture de la Gironde
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">Projection GIEC 2050</p>
                    <p className="text-sm font-black text-neutral-900">+3.1°C en été</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Scénario SSP2-4.5 (CMIP6)</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">Jumeau climatique du jour</p>
                    <p className="text-sm font-semibold text-neutral-700">Séville, Espagne · 39°C</p>
                  </div>
                  <div className="mt-5">
                    <a href="#" className="block text-center bg-orange-500 text-white text-xs font-semibold rounded-lg py-2.5 px-4">
                      Voir la carte complète de Bordeaux &rarr;
                    </a>
                  </div>
                  <p className="text-[10px] text-neutral-400 text-center mt-3">
                    Se désabonner · cestchaud.fr
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-600 text-center mt-3">Aperçu du briefing matinal</p>
            </div>

          </div>
        </div>
      </section>

      {/* Ce que contient l'email */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-3">Contenu</p>
        <h2 className="text-2xl font-black text-neutral-900 mb-10" style={{ textWrap: "balance" } as React.CSSProperties}>
          Cinq données, choisies pour leur utilité
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ label, desc }) => (
            <div key={label} className="bg-white rounded-3xl p-6">
              <div className="w-2 h-2 rounded-full bg-orange-400 mb-4" />
              <p className="font-black text-neutral-900 text-sm mb-2">{label}</p>
              <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
            </div>
          ))}
          <div className="bg-neutral-100 rounded-3xl p-6 flex flex-col justify-between">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Des données issues de sources scientifiques : ERA5 (ECMWF), CMIP6 (GIEC), Open-Meteo, NASA FIRMS.
            </p>
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-400 mt-4">Sources scientifiques</p>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-5 py-16">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-3">Processus</p>
          <h2 className="text-2xl font-black text-neutral-900 mb-10">Trois étapes, pas plus.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="flex flex-col gap-4">
                <span className="text-4xl font-black text-orange-200 leading-none">{num}</span>
                <div>
                  <p className="font-black text-neutral-900 mb-1.5">{title}</p>
                  <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Garanties */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="bg-[#111111] rounded-3xl px-8 py-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-orange-400 mb-3">Engagements</p>
            <h2 className="text-2xl font-black text-white mb-4" style={{ textWrap: "balance" } as React.CSSProperties}>
              Gratuit. Sans publicité. Sans revente de données.
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-neutral-400">
              {[
                "Double opt-in : un lien de confirmation avant le premier envoi",
                "Désabonnement en un clic depuis chaque email",
                "Données conservées uniquement le temps de l'abonnement + 3 ans (RGPD)",
                "Envoi via Resend, hébergement EU, conforme RGPD",
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/r"
            className="shrink-0 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-7 py-3.5 text-sm transition-colors"
          >
            Choisir ma ville
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 pb-8 w-full">
        <PageFooter />
      </div>
    </div>
  )
}
