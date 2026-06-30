import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

export const revalidate = 604800

export const metadata: Metadata = {
  title: "À propos · cestchaud.fr",
  description: "Comment cestchaud.fr collecte, calcule et présente les données de température, les anomalies et les projections climatiques GIEC.",
  alternates: { canonical: "https://cestchaud.fr/a-propos" },
}

export default function AProposPage() {
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-[#f5f4f0]">
      <SiteHeader asLink />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

        {/* Left */}
        <div className="lg:w-[40%] shrink-0 p-5 lg:p-8 flex flex-col justify-between border-b lg:border-b-0 border-black/[0.06]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
              À propos
            </p>
            <h1 className="text-3xl font-black text-neutral-900 leading-tight">
              D’où viennent ces chiffres ?
            </h1>
            <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
              Des données ouvertes, des calculs transparents, zéro hallucination. Un outil pédagogique pour rendre la crise climatique lisible.
            </p>
          </div>
          <PageFooter />
        </div>

        {/* Right */}
        <div className="flex-1 lg:overflow-y-auto p-5 lg:p-8">
          <div className="max-w-lg space-y-4">

            {/* Pas d'IA générative */}
            <section className="bg-neutral-950 rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/50 mb-2">
                Transparence
              </p>
              <h2 className="text-lg font-black text-white mb-3">Pas d’hallucinations, que des données</h2>
              <p className="text-sm text-white/80 leading-relaxed">
                Aucun texte sur ce site n’est généré par une intelligence artificielle générative. Les chiffres, les anomalies, les projections et les analyses narratives sont construits entièrement à partir de sources scientifiques ouvertes (Open-Meteo, ERA5, CMIP6). L’objectif est pédagogique : rendre les données climatiques accessibles à tous, sans interprétation inventée.
              </p>
            </section>

            {/* Open-Meteo */}
            <section className="bg-white rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                Températures du jour
              </p>
              <h2 className="text-lg font-black text-neutral-900 mb-3">Open-Meteo</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Les ressenti max journaliers proviennent de l’API <strong className="text-neutral-900">Open-Meteo</strong> (open source, gratuite).
                On utilise <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">apparent_temperature_max</code> — le ressenti thermique réel, qui intègre vent et humidité.
                Les données sont rafraîchiees une fois par jour.
              </p>
            </section>

            {/* ERA5 */}
            <section className="bg-[#b8d4b0] rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/50 mb-2">
                Normales &amp; tendances
              </p>
              <h2 className="text-lg font-black text-green-900 mb-3">ERA5 · 1991–2020</h2>
              <p className="text-sm text-green-900/70 leading-relaxed">
                Les normales mensuelles (1991–2020) et la tendance sur 30 ans sont calculées à partir des réanalyses <strong>ERA5</strong> du Centre européen de prévision météorologique (ECMWF).
                L’anomalie affichée est la différence entre le ressenti aujourd’hui et la normale historique du même mois.
              </p>
            </section>

            {/* GIEC */}
            <section className="bg-[#c4b8d4] rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/50 mb-2">
                Projections climatiques
              </p>
              <h2 className="text-lg font-black text-purple-900 mb-3">CMIP6 · GIEC AR6</h2>
              <p className="text-sm text-purple-900/70 leading-relaxed">
                Les projections 2030, 2040 et 2050 s’appuient sur les modèles <strong>CMIP6</strong> utilisés dans le 6e rapport du GIEC (AR6), scénario <strong>SSP2-4.5</strong> (trajectoire intermédiaire, « si rien ne change drastiquement »).
                Les valeurs représentent l’écart de température projeté par rapport à la période de référence 2000–2020.
              </p>
            </section>

            {/* Jumeaux */}
            <section className="bg-white rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                Jumeaux climatiques
              </p>
              <h2 className="text-lg font-black text-neutral-900 mb-3">±4°C</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Deux villes sont « jumelles » si leur ressenti maximal du jour diffère de moins de 4°C.
                C’est une façon de rendre concret le réchauffement : aujourd’hui à Lyon, il fait comme à Tunis. Demain ?
              </p>
            </section>

            {/* Outils */}
            <section className="bg-[#dbeafe] rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/50 mb-2">
                Technologies
              </p>
              <h2 className="text-lg font-black text-blue-900 mb-4">Outils utilisés</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Next.js", desc: "Framework React (App Router, ISR)" },
                  { name: "Vercel", desc: "Hébergement &amp; déploiement" },
                  { name: "Tailwind CSS", desc: "Styles et mise en page" },
                  { name: "Leaflet", desc: "Cartes interactives" },
                  { name: "Open-Meteo API", desc: "Météo temps réel" },
                  { name: "ERA5 / ECMWF", desc: "Climatologie historique" },
                  { name: "CMIP6 / GIEC", desc: "Projections futures" },
                  { name: "OpenStreetMap", desc: "Fond de carte" },
                ].map(({ name, desc }) => (
                  <div key={name} className="bg-white/60 rounded-2xl p-3">
                    <p className="text-sm font-black text-blue-900">{name}</p>
                    <p className="text-xs text-blue-900/60 mt-0.5" dangerouslySetInnerHTML={{ __html: desc }} />
                  </div>
                ))}
              </div>
            </section>

            {/* Limites */}
            <section className="bg-white rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                Limites
              </p>
              <h2 className="text-lg font-black text-neutral-900 mb-3">Ce que ce site ne fait pas</h2>
              <ul className="text-sm text-neutral-600 leading-relaxed space-y-2">
                <li>— Les projections sont des tendances, pas des prévisions.</li>
                <li>— Le ressenti dépend du contexte local (îlots de chaleur urbains, etc.).</li>
                <li>— Les données ERA5/CMIP6 sont précalculées et mises à jour manuellement.</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
