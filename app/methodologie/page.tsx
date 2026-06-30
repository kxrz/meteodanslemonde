import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

export const metadata: Metadata = {
  title: "Méthodologie · cestchaud.fr",
  description: "Comment cestchaud.fr collecte, calcule et présente les données de température, les anomalies et les projections climatiques GIEC.",
  alternates: { canonical: "https://cestchaud.fr/methodologie" },
}

export default function MethodologiePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <SiteHeader asLink />

      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Left — sticky intro */}
        <div className="lg:w-[40%] shrink-0 p-5 lg:p-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-black/[0.06]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
              Méthodologie
            </p>
            <h1 className="text-3xl font-black text-neutral-900 leading-tight">
              D'où viennent ces chiffres&nbsp;?
            </h1>
            <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
              Trois sources de données, une seule obsession : comprendre ce que la chaleur fait vraiment à nos villes.
            </p>
          </div>
          <PageFooter />
        </div>

        {/* Right — content */}
        <div className="flex-1 p-5 lg:p-8 overflow-y-auto">
          <div className="max-w-lg space-y-6">

            <section className="bg-white rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                Températures du jour
              </p>
              <h2 className="text-lg font-black text-neutral-900 mb-3">Open-Meteo</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Les ressenti max journaliers proviennent de l'API <strong className="text-neutral-900">Open-Meteo</strong> (open source, gratuite).
                On utilise <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">apparent_temperature_max</code> — le ressenti thermique réel, qui intègre vent et humidité.
                Les données sont rafraîchies une fois par jour.
              </p>
            </section>

            <section className="bg-[#b8d4b0] rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/50 mb-2">
                Normales & tendances
              </p>
              <h2 className="text-lg font-black text-green-900 mb-3">ERA5 · 1991–2020</h2>
              <p className="text-sm text-green-900/70 leading-relaxed">
                Les normales mensuelles (1991–2020) et la tendance sur 30 ans sont calculées à partir des réanalyses <strong>ERA5</strong> du Centre européen de prévision météorologique (ECMWF).
                L'anomalie affichée est la différence entre le ressenti aujourd'hui et la normale historique du même mois.
              </p>
            </section>

            <section className="bg-[#c4b8d4] rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-purple-900/50 mb-2">
                Projections climatiques
              </p>
              <h2 className="text-lg font-black text-purple-900 mb-3">CMIP6 · GIEC AR6</h2>
              <p className="text-sm text-purple-900/70 leading-relaxed">
                Les projections 2030, 2040 et 2050 s'appuient sur les modèles <strong>CMIP6</strong> utilisés dans le 6e rapport du GIEC (AR6), scénario <strong>SSP2-4.5</strong> (trajectoire intermédiaire, "si rien ne change drastiquement").
                Les valeurs représentent l'écart de température projeté par rapport à la période de référence 2000–2020.
              </p>
            </section>

            <section className="bg-neutral-900 rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-2">
                Jumeaux climatiques
              </p>
              <h2 className="text-lg font-black text-white mb-3">±4°C</h2>
              <p className="text-sm text-white/60 leading-relaxed">
                Deux villes sont "jumelles" si leur ressenti maximal du jour diffère de moins de 4°C.
                C'est une façon de rendre concret le réchauffement : aujourd'hui à Lyon, il fait comme à Tunis.
                Demain ?
              </p>
            </section>

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
