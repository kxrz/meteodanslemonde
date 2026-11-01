import Link from "next/link"
import { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Num from "@/components/ui/Num"
import Eyebrow from "@/components/ui/Eyebrow"
import Card from "@/components/ui/Card"
import Explain from "@/components/ui/Explain"
import { ButtonLink, Arrow } from "@/components/ui/Button"
import { anomalyWords } from "@/lib/anomaly"
import { fmt, fmtDelta } from "@/lib/format"
import { loadClimateFull } from "@/lib/climate-season"
import type { GlossaryKey } from "@/lib/glossary"

export const revalidate = 604800

export const metadata: Metadata = {
  title: "Méthode et sources · cestchaud.fr",
  description: "D'où viennent les chiffres de cestchaud.fr et comment ils sont calculés : ressenti Open-Meteo, normales ERA5 1991-2020, projections CMIP6, avec un exemple pas à pas.",
  alternates: { canonical: "https://www.cestchaud.fr/a-propos" },
  openGraph: {
    title: "Méthode et sources · cestchaud.fr",
    description: "D'où viennent les chiffres de cestchaud.fr et comment ils sont calculés.",
    url: "https://www.cestchaud.fr/a-propos",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
}

const TOC = [
  { id: "exemple", label: "Un exemple pas à pas" },
  { id: "ressenti", label: "Le ressenti" },
  { id: "normales", label: "Les normales" },
  { id: "tendance", label: "La tendance sur 30 ans" },
  { id: "projections", label: "Les projections" },
  { id: "chaleur", label: "Chaleur : notre seuil, pas une vigilance" },
  { id: "jumeau", label: "Le jumeau du jour" },
  { id: "impacts", label: "Les faits d'impact" },
  { id: "limites", label: "Limites" },
  { id: "site", label: "Le site lui-même" },
  { id: "projet", label: "Le projet" },
]

function G({ k, children }: { k: GlossaryKey; children: React.ReactNode }) {
  return <Link href={`/atelier/glossaire#${k}`} className="font-semibold text-ink underline decoration-signal decoration-[3px] underline-offset-2">{children}</Link>
}

function Part({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-24 flex flex-col gap-4 border-t-2 border-ink pt-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <Title id={`${id}-t`} size="lg">{title}</Title>
      <div className="flex max-w-[68ch] flex-col gap-3 text-[17px] leading-relaxed text-ink-soft [&_strong]:text-ink">{children}</div>
    </section>
  )
}

export default function AProposPage() {
  // Exemple pas à pas avec une vraie normale : Bordeaux en novembre (12 °C, ERA5 1991-2020).
  const bordeaux = loadClimateFull().bordeaux
  const normal = bordeaux?.normal?.[10] ?? 12
  const forecast = Math.round((normal + 4.1) * 10) / 10
  const delta = Math.round((forecast - normal) * 10) / 10

  return (
    <PageShell crumbs={[{ label: "Méthode et sources" }]}>
      <div className="flex flex-col gap-12">
        <header className="flex max-w-4xl flex-col gap-5 pt-2 sm:pt-6">
          <Eyebrow>Méthode et sources</Eyebrow>
          <Title as="h1" size="hero" animate>
            Chaque chiffre a <Hl tone="chaud">une source</Hl>.
          </Title>
          <p className="max-w-2xl text-[18px] leading-snug text-ink-soft">
            Données publiques uniquement, calculs simples, et on vous montre lesquels. Aucun texte n&apos;est rédigé par une IA à partir des données : les phrases sont écrites à la main et remplies avec les chiffres.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-anim="stagger">
            <Card tone="ink" className="p-4"><p className="font-display text-4xl font-extrabold"><Num value={129} /></p><p className="text-[14px] text-paper/80">villes : 62 en France, 67 dans le monde</p></Card>
            <Card className="p-4"><p className="font-display text-4xl font-extrabold">1991-2020</p><p className="text-[14px] text-ink-soft">période des normales</p></Card>
            <Card className="p-4"><p className="font-display text-4xl font-extrabold"><Num value={2050} /></p><p className="text-[14px] text-ink-soft">horizon des projections</p></Card>
            <Card tone="signal" className="p-4"><p className="font-display text-4xl font-extrabold"><Num value={63} /></p><p className="text-[14px] text-ink-soft">faits d&apos;impact sourcés</p></Card>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-labelledby="sommaire" className="lg:sticky lg:top-20 lg:self-start">
            <h2 id="sommaire" className="mb-3 font-display text-lg font-extrabold">Sommaire</h2>
            <ol className="flex flex-col gap-0.5 text-[15px]">
              {TOC.map((t, i) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="flex min-h-11 items-center gap-2 rounded-lg px-2 hover:bg-paper-deep">
                    <span className="w-5 font-mono text-[12px] text-mute">{i + 1}</span>{t.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex min-w-0 flex-col gap-12">
            <Part id="exemple" eyebrow="Le chiffre central" title={<>De {fmt(normal, 0)}&#8239;°C à <Hl tone="chaud">{fmtDelta(delta)}&#8239;°C</Hl>, pas à pas.</>}>
              <p>Le chiffre que vous voyez partout sur le site, c&apos;est l&apos;<G k="anomalie">écart à la normale</G>. Exemple à Bordeaux, un jour de novembre :</p>
              <ol className="flex flex-col gap-3">
                <li className="rounded-2xl bg-white p-4"><strong>1. Ce qu&apos;on attend.</strong> La <G k="normale">normale</G> de novembre à Bordeaux, c&apos;est un ressenti maximal de <strong>{fmt(normal, 0)}&#8239;°C</strong> en moyenne sur 1991-2020.</li>
                <li className="rounded-2xl bg-white p-4"><strong>2. Ce qui est prévu.</strong> Ce matin, Open-Meteo prévoit un <G k="ressenti">ressenti</G> maximal de <strong>{fmt(forecast)}&#8239;°C</strong>.</li>
                <li className="rounded-2xl bg-white p-4"><strong>3. La soustraction.</strong> {fmt(forecast)} − {fmt(normal, 0)} = <strong>{fmtDelta(delta)}&#8239;°C</strong>.</li>
                <li className="rounded-2xl bg-signal p-4"><strong>4. Ce que ça veut dire.</strong> Une journée « {anomalyWords(delta)} ». Ce n&apos;est pas une preuve de réchauffement à elle seule : une journée, c&apos;est de la <G k="meteoClimat">météo</G>. C&apos;est l&apos;accumulation de ces écarts, année après année, qui dessine le climat.</li>
              </ol>
              <p>L&apos;écart se lit pareil en janvier et en juillet. C&apos;est pour ça qu&apos;on l&apos;affiche avant la température : 8&#8239;°C peut être doux en janvier à Lille et froid en mai à Marseille.</p>
            </Part>

            <Part id="ressenti" eyebrow="Open-Meteo" title={<>Le ressenti, c&apos;est la <Hl>température apparente</Hl>.</>}>
              <p>
                Nous utilisons la température apparente maximale du jour (<code className="font-mono text-[15px]">apparent_temperature_max</code>) fournie par <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">Open-Meteo</a>. Elle part de la température de l&apos;air et la corrige avec l&apos;humidité, le vent et le rayonnement solaire : par vent fort, elle descend sous le thermomètre ; par temps lourd et ensoleillé, elle monte au-dessus. <Explain term="ressenti" />
              </p>
              <p>Ce n&apos;est pas un indice de confort thermique, ni la température officielle sous abri de Météo-France. C&apos;est la même grandeur pour les prévisions du jour, les normales et les projections, ce qui rend les comparaisons cohérentes.</p>
            </Part>

            <Part id="normales" eyebrow="Copernicus ERA5" title={<>La normale : <Hl>30 ans</Hl> de mesures, 1991-2020.</>}>
              <p>
                Pour chaque ville et chaque mois, la normale est la moyenne du ressenti maximal quotidien entre <strong>1991 et 2020</strong>, la période de référence recommandée par l&apos;Organisation météorologique mondiale. Les valeurs viennent de <G k="era5">ERA5</G>, la réanalyse du service européen Copernicus (ECMWF), qui reconstitue l&apos;atmosphère heure par heure depuis 1940 à partir de millions d&apos;observations.
              </p>
              <p>Ces normales sont calculées une fois, par un script, et embarquées dans le site : elles ne changent pas d&apos;un jour à l&apos;autre.</p>
            </Part>

            <Part id="tendance" eyebrow="Ce qui a déjà changé" title={<>La tendance compare <Hl>les années 1990</Hl> à 2015-2024.</>}>
              <p>
                La <G k="tendance">tendance sur 30 ans</G>{" "}est l&apos;écart entre la moyenne d&apos;un mois sur 1991-2000 et sur 2015-2024, toujours avec ERA5. C&apos;est du réchauffement déjà mesuré, pas une projection.
              </p>
              <p>Mois par mois, ce chiffre est bruité (une décennie, c&apos;est peu d&apos;années). Le site le lisse donc sur trois mois, ou l&apos;affiche par saison.</p>
            </Part>

            <Part id="projections" eyebrow="Modèles CMIP6" title={<>Les projections partent de <Hl>2000-2020</Hl>.</>}>
              <p>
                Les <G k="projection">projections</G> viennent de l&apos;API climat d&apos;Open-Meteo, qui diffuse des modèles <G k="cmip6">CMIP6</G> à haute résolution (EC-Earth3P-HR, MPI-ESM1-2-XR, MRI-AGCM3-2-S). Pour chaque mois, on calcule l&apos;écart entre la moyenne des modèles sur une période future et leur moyenne sur <strong>2000-2020</strong> :
              </p>
              <ul className="list-disc pl-5">
                <li>« 2030 » = moyenne 2021-2039 ;</li>
                <li>« 2040 » = moyenne 2031-2050 ;</li>
                <li>« 2050 » = moyenne 2041-2050.</li>
              </ul>
              <p>
                Le site les montre <strong>par saison</strong>, avec une valeur centrale et une fourchette entre les séries disponibles, jamais un mois isolé : les valeurs mensuelles brutes sont trop bruitées. Une projection n&apos;est pas une prévision, c&apos;est « si les émissions suivent cette trajectoire, voici le climat moyen attendu ». <Explain term="ssp" />
              </p>
            </Part>

            <Part id="chaleur" eyebrow="Mise au point" title={<>35&#8239;°C ressentis : <Hl tone="chaud">notre repère</Hl>, pas une vigilance.</>}>
              <p>
                Le site compte les jours où le ressenti maximal atteint 35&#8239;°C et parle de « chaleur qui dure » au-delà de 3 jours. C&apos;est un <strong>repère propre à cestchaud.fr</strong>.
              </p>
              <p>
                La vigilance canicule de Météo-France fonctionne autrement : elle compare la moyenne sur trois jours des températures minimales et maximales <strong>de l&apos;air</strong> à des seuils fixés <strong>département par département</strong>. Pour savoir s&apos;il y a canicule chez vous, la référence reste <a href="https://vigilance.meteofrance.fr" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">vigilance.meteofrance.fr</a>.
              </p>
            </Part>

            <Part id="jumeau" eyebrow="Pour se représenter" title={<>Le jumeau du jour, à <Hl>4&#8239;°C près</Hl>.</>}>
              <p>
                Chaque jour, on cherche parmi 67 villes du monde celle dont le ressenti maximal prévu est le plus proche de celui de votre ville, à 4&#8239;°C près au plus. C&apos;est une image du jour, pas une comparaison de climats. Le <G k="jumeau">jumeau climatique 2050</G>, lui, compare des normales projetées à des normales actuelles.
              </p>
            </Part>

            <Part id="impacts" eyebrow="En vrai, ça fait quoi ?" title={<><Hl>63 faits</Hl> observés, chacun avec sa source.</>}>
              <p>
                Sur les fiches ville et région, un bloc décrit une conséquence déjà observée du réchauffement (vigne, forêts, littoral, moustique tigre, glaciers…), avec sa cause et sa source : INRAE, ONF, IFREMER, LPO, ANSES, GLACIOCLIM, CNRS, Météo-France, Haut Conseil pour le climat. Sans source pour une zone, rien ne s&apos;affiche.
              </p>
            </Part>

            <Part id="limites" eyebrow="Honnêtement" title={<>Ce que ces chiffres <Hl>ne disent pas</Hl>.</>}>
              <ul className="flex list-disc flex-col gap-2 pl-5">
                <li>Une ville = un point de grille ERA5 (environ 30 km) : ce n&apos;est pas la station de votre quartier.</li>
                <li>Le ressenti du jour est une <strong>prévision</strong> du matin, pas une mesure.</li>
                <li>Les projections viennent des simulations climatiques haute résolution du CMIP6 (protocole HighResMIP) servies par Open-Meteo. Notre requête ne choisit pas de scénario d&apos;émissions : elle combine plusieurs modèles. Le protocole HighResMIP suit une trajectoire d&apos;émissions élevées (SSP5-8.5) ; jusqu&apos;en 2050 les trajectoires divergent encore peu, mais nos chiffres sont plutôt dans le haut de la fourchette. On affiche donc la <strong>médiane des modèles</strong> et la <strong>fourchette entre modèles</strong>, sans nom de scénario. Pour quelques villes, faute de ressenti dans les modèles, la projection porte sur la température de l&apos;air.</li>
                <li>Normales, tendances et projections sont recalculées à la main, lors des mises à jour des données sources.</li>
              </ul>
            </Part>

            <Part id="site" eyebrow="Technique" title={<>Un site <Hl>sobre</Hl>, sans traceur publicitaire.</>}>
              <p>
                Les polices (Bricolage Grotesque, DM Sans, JetBrains Mono) sont <strong>hébergées sur nos serveurs</strong> : aucun appel à Google Fonts. La mesure d&apos;audience utilise <strong>Vercel Analytics</strong>, sans cookie ni profil. Les fonds de carte viennent de CARTO, la recherche de commune de geo.api.gouv.fr. Détails dans la <Link href="/confidentialite" className="font-semibold text-ink underline underline-offset-2">politique de confidentialité</Link>, et les coulisses techniques dans <Link href="/backstage" className="font-semibold text-ink underline underline-offset-2">Backstage</Link>.
              </p>
            </Part>

            <Part id="projet" eyebrow="Qui fait ça" title={<>Un projet <Hl>indépendant</Hl>.</>}>
              <p>
                cestchaud.fr est conçu par <strong>Florent Bertiaux</strong>{" "}et édité par LesWWW. Pas de publicité, pas d&apos;investisseur. Une erreur, une question, une demande presse : écrivez-nous.
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/contact" variant="chaud" className="group">Nous écrire <Arrow /></ButtonLink>
              </div>
              <p className="text-[15px]">
                Sources :{" "}
                {[
                  ["Open-Meteo", "https://open-meteo.com"],
                  ["Copernicus ERA5", "https://cds.climate.copernicus.eu"],
                  ["GIEC AR6", "https://www.ipcc.ch/report/ar6/wg1/"],
                  ["NASA FIRMS", "https://firms.modaps.eosdis.nasa.gov"],
                  ["Météo-France vigilance", "https://vigilance.meteofrance.fr"],
                  ["Haut Conseil pour le climat", "https://www.hautconseilclimat.fr"],
                ].map(([label, href], i, arr) => (
                  <span key={href}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{label}</a>{i < arr.length - 1 ? " · " : ""}
                  </span>
                ))}
              </p>
            </Part>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
