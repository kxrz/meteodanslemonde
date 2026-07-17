import Link from "next/link"
import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

export const revalidate = 604800

export const metadata: Metadata = {
  title: "Méthodologie & sources · cestchaud.fr",
  description:
    "Sources de données, méthodes de calcul et choix éditoriaux de cestchaud.fr : Open-Meteo, ERA5 (ECMWF), CMIP6 (GIEC AR6), NASA FIRMS, INRAE, ONF, IFREMER.",
  alternates: { canonical: "https://www.cestchaud.fr/a-propos" },
  openGraph: {
    title: "Méthodologie & sources · cestchaud.fr",
    description:
      "Sources de données, méthodes de calcul et choix éditoriaux de cestchaud.fr.",
    url: "https://www.cestchaud.fr/a-propos",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
}

/* ── Icônes ──────────────────────────────────────────────────────────────── */

function IconExternal() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline shrink-0 mb-0.5 ml-1 opacity-50">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

/* ── Composants ──────────────────────────────────────────────────────────── */

function Label({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-[10px] uppercase tracking-[0.18em] font-bold mb-3 ${light ? "text-white/50" : "text-neutral-400"}`}>
      {children}
    </p>
  )
}

function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4">
      <p className="text-3xl font-black text-neutral-900 leading-none">{value}</p>
      <p className="text-xs font-semibold text-neutral-700 mt-1.5">{label}</p>
      {sub && <p className="text-[10px] text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Source({
  bg, labelColor, name, badge, badgeBg, body, url, urlLabel,
}: {
  bg: string; labelColor: string; name: string; badge?: string; badgeBg?: string;
  body: React.ReactNode; url: string; urlLabel: string;
}) {
  return (
    <section className={`${bg} rounded-3xl p-6 lg:p-8`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <Label light={bg.includes("111") || bg.includes("neutral-9")}>{badge ?? "Source de données"}</Label>
          <h2 className={`text-xl font-black ${labelColor} leading-tight`}>{name}</h2>
        </div>
        {badgeBg && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 mt-1 ${badgeBg}`}>
            Open data
          </span>
        )}
      </div>
      <div className={`text-sm leading-relaxed space-y-2 ${labelColor.includes("white") ? "text-white/75" : labelColor.replace("font-black", "").replace("text-", "text-") + "/70"}`}>
        {body}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 text-xs font-semibold mt-5 underline underline-offset-2 ${labelColor.includes("white") ? "text-white/60 hover:text-white" : "text-neutral-600 hover:text-neutral-900"} transition-colors`}
      >
        {urlLabel}
        <IconExternal />
      </a>
    </section>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function AProposPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f4f0]">
      <SiteHeader asLink />

      {/* Hero */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-4xl mx-auto px-5 py-16 lg:py-20">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 mb-5">
            Méthodologie & sources
          </p>
          <h1
            className="text-4xl lg:text-5xl font-black leading-[1.06] tracking-tight mb-5 max-w-2xl"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Des données scientifiques ouvertes,{" "}
            <span className="text-orange-400">rendues lisibles.</span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-xl mb-10">
            cestchaud.fr ne génère aucun contenu. Chaque chiffre affiché provient de sources
            scientifiques publiques : réanalyses climatiques, modèles de projection, satellites
            NASA, études INRAE, IFREMER, ONF. Voici précisément ce qu'on utilise, comment,
            et pourquoi.
          </p>

          {/* Chiffres clés */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat value="129" label="villes couvertes" sub="62 FR · 67 monde" />
            <Stat value="1940" label="point de départ" sub="archives ERA5" />
            <Stat value="2050" label="horizon projeté" sub="GIEC CMIP6 SSP2-4.5" />
            <Stat value="26" label="faits sourcés" sub="INRAE, ONF, IFREMER…" />
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-12 w-full space-y-16">

        {/* Sources de données */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-5">
            Sources de données
          </p>
          <div className="space-y-4">

            {/* Open-Meteo */}
            <section className="bg-[#dbeafe] rounded-3xl p-6 lg:p-8">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <Label>Météo temps réel & archive climatique</Label>
                  <h2 className="text-xl font-black text-blue-900 leading-tight">Open-Meteo</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 mt-1 bg-blue-200 text-blue-800">
                  Open source · gratuit
                </span>
              </div>
              <div className="text-sm text-blue-900/75 leading-relaxed space-y-2">
                <p>
                  API météo open source utilisée pour deux usages distincts : les prévisions du jour
                  (modèles <strong className="text-blue-900">ECMWF, GFS et Météo-France</strong> en temps réel)
                  et les archives climatiques depuis 1940 via la réanalyse ERA5.
                </p>
                <p>
                  L'indice retenu est l'<strong className="text-blue-900">UTCI</strong> (Universal
                  Thermal Climate Index), qui intègre température, humidité, rayonnement et vent pour
                  donner le ressenti thermique réel, et non la température de l'air seule.
                  Jusqu'à 10 000 requêtes gratuites par jour, sans clé API ni authentification.
                </p>
              </div>
              <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold mt-5 underline underline-offset-2 text-blue-800/70 hover:text-blue-900 transition-colors">
                open-meteo.com <IconExternal />
              </a>
            </section>

            {/* ERA5 */}
            <section className="bg-[#b8d4b0] rounded-3xl p-6 lg:p-8">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <Label>Normales & tendances historiques</Label>
                  <h2 className="text-xl font-black text-green-900 leading-tight">
                    ERA5 · ECMWF · Copernicus
                  </h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 mt-1 bg-green-200 text-green-900">
                  Open data
                </span>
              </div>
              <div className="text-sm text-green-900/75 leading-relaxed space-y-2">
                <p>
                  ERA5 est la réanalyse de référence mondiale produite par le{" "}
                  <strong className="text-green-900">Centre européen pour les prévisions météorologiques
                  à moyen terme (ECMWF)</strong>, distribuée librement via le programme Copernicus
                  de l'Union européenne. Elle couvre la planète entière depuis 1940 avec une résolution
                  de 31 km, à partir de la fusion de milliards d'observations historiques et de modèles
                  numériques.
                </p>
                <p>
                  Les normales climatiques mensuelles affichées sur cestchaud.fr sont calculées sur la
                  période <strong className="text-green-900">1991–2020</strong> (référence OMM en vigueur).
                  La tendance sur 30 ans est l'écart linéaire entre les températures de la période
                  récente et celles de la période de référence, calculé mois par mois.
                </p>
                <p>
                  L'<strong className="text-green-900">anomalie du jour</strong> est la différence entre
                  le ressenti UTCI prévu par Open-Meteo et la normale ERA5 du même mois. C'est ce chiffre
                  qui dit si aujourd'hui est vraiment exceptionnel, ou juste dans la norme.
                </p>
              </div>
              <a href="https://cds.climate.copernicus.eu" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold mt-5 underline underline-offset-2 text-green-900/60 hover:text-green-900 transition-colors">
                Copernicus Climate Data Store <IconExternal />
              </a>
            </section>

            {/* CMIP6 / GIEC */}
            <section className="bg-[#c4b8d4] rounded-3xl p-6 lg:p-8">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <Label>Projections climatiques 2030–2050</Label>
                  <h2 className="text-xl font-black text-purple-900 leading-tight">
                    CMIP6 · GIEC AR6
                  </h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 mt-1 bg-purple-200 text-purple-900">
                  Open data
                </span>
              </div>
              <div className="text-sm text-purple-900/75 leading-relaxed space-y-2">
                <p>
                  Les projections affichées proviennent des modèles{" "}
                  <strong className="text-purple-900">CMIP6</strong> (Coupled Model Intercomparison
                  Project, 6e phase), utilisés dans le{" "}
                  <strong className="text-purple-900">6e rapport d'évaluation du GIEC (AR6)</strong>,
                  publié en 2021–2022. Ces modèles constituent aujourd'hui la référence scientifique
                  mondiale sur l'évolution future du climat.
                </p>
                <p>
                  Le scénario retenu est le <strong className="text-purple-900">SSP2-4.5</strong>{" "}
                  (trajectoire intermédiaire, ni optimiste ni catastrophiste), qui suppose que les
                  politiques climatiques actuelles se poursuivent sans accélération majeure.
                  Les valeurs représentent l'écart de température projeté par rapport à la période
                  de référence <strong className="text-purple-900">2000–2020</strong>.
                </p>
                <p>
                  Ces données sont pré-calculées et embarquées dans le projet sous forme de fichiers
                  légers. Elles sont mises à jour manuellement à chaque publication d'un nouveau rapport GIEC.
                </p>
              </div>
              <a href="https://www.ipcc.ch/report/ar6/wg1/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold mt-5 underline underline-offset-2 text-purple-900/60 hover:text-purple-900 transition-colors">
                GIEC · Rapport AR6, Groupe de travail I <IconExternal />
              </a>
            </section>

            {/* NASA FIRMS */}
            <section className="bg-[#431407] rounded-3xl p-6 lg:p-8">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <Label light>Détections d'incendies en temps réel</Label>
                  <h2 className="text-xl font-black text-white leading-tight">
                    NASA FIRMS · VIIRS
                  </h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 mt-1 bg-orange-900 text-orange-200">
                  Open data
                </span>
              </div>
              <div className="text-sm text-orange-100/80 leading-relaxed space-y-2">
                <p>
                  La carte des feux utilise{" "}
                  <strong className="text-white">NASA FIRMS</strong> (Fire Information for Resource
                  Management System), le système de surveillance des incendies par satellite de la NASA.
                  Les détections proviennent du capteur{" "}
                  <strong className="text-white">VIIRS</strong> (Visible Infrared Imaging Radiometer
                  Suite), embarqué sur les satellites Suomi-NPP et NOAA-20.
                </p>
                <p>
                  Chaque point sur la carte représente une détection de chaleur radiative anormale
                  à la surface, mise à jour{" "}
                  <strong className="text-white">toutes les heures</strong>. La résolution spatiale
                  est de 375 mètres. L'accès est libre via une clé API gratuite.
                </p>
              </div>
              <a href="https://firms.modaps.eosdis.nasa.gov" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold mt-5 underline underline-offset-2 text-orange-300/70 hover:text-orange-200 transition-colors">
                NASA FIRMS <IconExternal />
              </a>
            </section>

          </div>
        </section>

        {/* Ce qu'on calcule */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-5">
            Ce qu'on calcule
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "L'anomalie du jour",
                body: "Différence entre le ressenti UTCI prévu par Open-Meteo et la normale mensuelle ERA5 (1991–2020) pour la ville concernée. Un chiffre positif signifie qu'il fait plus chaud que d'habitude pour la saison. C'est la donnée centrale du site.",
              },
              {
                title: "La normale de saison",
                body: "Moyenne mensuelle du ressenti UTCI calculée sur la période de référence 1991–2020, issue des archives ERA5. Elle représente ce qu'on attend «normalement» pour un mois donné dans une ville donnée.",
              },
              {
                title: "Le jumeau climatique",
                body: "Deux villes sont jumelles si leur ressenti maximal du jour diffère de moins de 4°C. Le jumeau est calculé en comparant la ville française à 67 villes mondiales (ou l'inverse). Il rend concret ce que signifie une température : «aujourd'hui à Lyon, il fait comme à Tunis».",
              },
              {
                title: "L'alerte canicule",
                body: "Un épisode de canicule est identifié quand le ressenti max dépasse 35°C durant au moins 3 jours consécutifs (seuil Météo-France). Le compteur est calculé sur les 10 derniers jours d'archive ERA5.",
              },
              {
                title: "La tendance sur 30 ans",
                body: "Écart entre les températures moyennes de la période récente et celles de la référence historique, calculé mois par mois à partir des archives ERA5 depuis 1990. Ce chiffre mesure le réchauffement déjà survenu, pas une projection.",
              },
              {
                title: "Les projections GIEC",
                body: "Réchauffement additionnel projeté pour 2030, 2040 et 2050 sous scénario SSP2-4.5, par rapport à la période 2000–2020. Ces valeurs sont pré-calculées à partir des modèles CMIP6 et embarquées dans le projet.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-white rounded-3xl p-6">
                <div className="w-2 h-2 rounded-full bg-orange-400 mb-4" />
                <p className="font-black text-neutral-900 text-sm mb-2">{title}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* En vrai, ça fait quoi */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-5">
            En vrai, ça fait quoi ?
          </p>
          <div className="bg-[#111111] rounded-3xl p-6 lg:p-8">
            <h2 className="text-lg font-black text-white mb-4 leading-tight">
              26 faits d'impact sourcés, contextualisés selon l'anomalie du jour
            </h2>
            <p className="text-sm text-white/75 leading-relaxed mb-5">
              Sur chaque page de ville et de région, un bloc affiche un fait concret sur les
              conséquences observées du réchauffement dans cette zone, avec la cause, le mécanisme,
              et ce que ça implique réellement. Un badge indique si le phénomène est{" "}
              <span className="text-orange-400 font-semibold">déjà en cours ici</span>,{" "}
              <span className="text-amber-300 font-semibold">en cours en France</span> ou{" "}
              <span className="text-neutral-400 font-semibold">en approche</span> selon l'anomalie du jour.
            </p>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Ces faits ne sont pas des projections : ce sont des observations mesurées et publiées
              par des institutions scientifiques françaises et internationales.
            </p>
            {/* Sources listées */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { name: "INRAE", desc: "Agriculture & vigne" },
                { name: "ONF", desc: "Santé des forêts" },
                { name: "IFREMER", desc: "Milieu marin" },
                { name: "LPO / STOC", desc: "Oiseaux migrateurs" },
                { name: "ANSES", desc: "Moustique tigre" },
                { name: "GLACIOCLIM", desc: "Glaciers alpins" },
                { name: "CNRS / INEE", desc: "Écosystèmes marins" },
                { name: "Météo-France", desc: "ClimSnow, enneigement" },
                { name: "Haut Conseil Climat", desc: "Rapport annuel 2025" },
              ].map(({ name, desc }) => (
                <div key={name} className="bg-white/8 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-black text-white">{name}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ce que ce site ne fait pas */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-5">
            Limites & engagements
          </p>
          <div className="bg-white rounded-3xl p-6 lg:p-8">
            <h2 className="text-lg font-black text-neutral-900 mb-5">Ce que cestchaud.fr ne fait pas</h2>
            <ul className="space-y-3">
              {[
                {
                  titre: "Pas de contenu généré ou interprété.",
                  corps: "Tous les chiffres proviennent directement des APIs et jeux de données sources. Aucun texte de synthèse n'est produit par un modèle de langage ou une IA générative.",
                },
                {
                  titre: "Pas d'extrapolations non vérifiées.",
                  corps: "Les faits d'impact (\"En vrai, ça fait quoi ?\") sont sourcés individuellement. Si une source n'existe pas pour une ville donnée, le fait n'est pas affiché.",
                },
                {
                  titre: "Les projections sont des tendances, pas des prévisions.",
                  corps: "Le scénario SSP2-4.5 décrit une trajectoire probable si les politiques actuelles se poursuivent. Ce n'est pas une certitude : c'est la meilleure estimation scientifique disponible.",
                },
                {
                  titre: "Le ressenti UTCI est différent de la température de l'air.",
                  corps: "L'UTCI intègre vent, humidité et rayonnement. Les valeurs peuvent différer significativement de la température officielle Météo-France, surtout en cas de vent fort ou d'ensoleillement intense.",
                },
                {
                  titre: "Les données ERA5/CMIP6 sont pré-calculées.",
                  corps: "Les normales et projections sont mises à jour manuellement lors des nouvelles publications scientifiques. Elles ne se rafraîchissent pas quotidiennement.",
                },
              ].map(({ titre, corps }) => (
                <li key={titre} className="flex items-start gap-3">
                  <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#f97316" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    <strong className="text-neutral-900">{titre}</strong>{" "}{corps}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Projet & contact */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-5">
            Le projet
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="bg-white rounded-3xl p-6">
              <Label>Auteur</Label>
              <h2 className="text-lg font-black text-neutral-900 mb-3">Florent Bertiaux</h2>
              <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                Créatif technologique basé en France. cestchaud.fr est né de la conviction que
                les données climatiques méritent d'être lues autrement, sans jargon, sans filtre,
                accessibles à tous. Le projet est indépendant, sans publicité, sans investisseur.
              </p>
              <a href="https://leswww.com" target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold text-neutral-900 hover:underline inline-flex items-center gap-1">
                leswww.com <IconExternal />
              </a>
            </div>

            <div className="bg-[#111111] rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <Label light>Contact presse & partenariats</Label>
                <p className="text-sm text-white/75 leading-relaxed mb-5">
                  Pour toute demande d'information, de partenariat éditorial ou d'interview
                  autour du projet cestchaud.fr et de ses données.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/contact"
                  className="flex items-center justify-between bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-5 py-3 text-sm transition-colors group"
                >
                  Formulaire de contact
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/backstage"
                  className="flex items-center justify-between bg-white/10 hover:bg-white/15 text-white/80 font-semibold rounded-xl px-5 py-3 text-sm transition-colors"
                >
                  Voir le backstage technique
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* Liens utiles */}
        <div className="border-t border-black/[0.06] pt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-400">
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700 transition-colors">
            Open-Meteo
          </a>
          <a href="https://cds.climate.copernicus.eu" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700 transition-colors">
            Copernicus / ERA5
          </a>
          <a href="https://www.ipcc.ch/report/ar6/wg1/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700 transition-colors">
            GIEC AR6
          </a>
          <a href="https://firms.modaps.eosdis.nasa.gov" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700 transition-colors">
            NASA FIRMS
          </a>
          <a href="https://www.inrae.fr" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700 transition-colors">
            INRAE
          </a>
          <a href="https://www.onf.fr" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700 transition-colors">
            ONF
          </a>
          <a href="https://www.ifremer.fr" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700 transition-colors">
            IFREMER
          </a>
          <a href="https://www.hautconseilclimat.fr" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700 transition-colors">
            Haut Conseil pour le Climat
          </a>
        </div>

      </div>

      <div className="max-w-4xl mx-auto px-5 pb-8 w-full">
        <PageFooter />
      </div>
    </div>
  )
}
