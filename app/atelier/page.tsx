import type { Metadata } from "next"
import Link from "next/link"
import citiesFR from "@/data/cities-fr.json"
import PageShell from "@/components/ui/PageShell"
import Section from "@/components/ui/Section"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Card from "@/components/ui/Card"
import Eyebrow from "@/components/ui/Eyebrow"
import { ButtonLink, Arrow } from "@/components/ui/Button"
import { DEFAULT_CITY } from "@/lib/pedago"

export const metadata: Metadata = {
  title: "Atelier climat : animer une séance sur grand écran · cestchaud.fr",
  description: "Un diaporama plein écran avec les chiffres de votre ville : la météo du jour, la normale, trois idées reçues, 2050. En 15 ou 45 minutes. Pour une asso, une classe, un live, une vidéo.",
  alternates: { canonical: "https://www.cestchaud.fr/atelier" },
}

const DEROULES = [
  {
    id: "15",
    name: "Express",
    duration: "15 min",
    pitch: "Une pause, un stand, une vidéo courte.",
    steps: [
      ["2 min", "Quel temps fait-il chez nous ?", "Le ressenti du jour dans votre ville."],
      ["3 min", "C'est normal ?", "Vote à main levée, puis l'écart à la normale."],
      ["3 min", "Météo ou climat ?", "Ce que 30 ans ont déjà ajouté, ce que la journée ajoute."],
      ["4 min", "Une idée reçue", "Vrai ou faux ? On vote, on révèle."],
      ["2 min", "Et en 2050 ?", "Les projections par saison, avec leur fourchette."],
      ["1 min", "Et maintenant ?", "Trois façons d'agir."],
    ],
  },
  {
    id: "45",
    name: "Séance complète",
    duration: "45 min",
    pitch: "Une classe, un atelier d'asso, un live.",
    steps: [
      ["5 min", "Quel temps fait-il chez nous ?", "Chacun donne son chiffre avant la révélation."],
      ["5 min", "C'est normal ?", "Vote, puis la normale 1991-2020 et l'écart du jour."],
      ["6 min", "Météo ou climat ?", "La décomposition en trois étapes."],
      ["5 min", "La courbe qui glisse", "1991-2020, aujourd'hui, 2050 : toute l'année monte."],
      ["12 min", "Trois idées reçues", "Affirmation, vote, révélation, explication. 4 minutes chacune."],
      ["5 min", "Et en 2050 ?", "Par saison, avec la fourchette entre scénarios."],
      ["3 min", "Le jumeau climatique", "Devinez la ville du monde qui a déjà votre climat de 2050."],
      ["4 min", "Et maintenant ?", "Écrire à ses élus, recevoir le briefing, partager."],
    ],
  },
] as const

const TIPS = [
  ["Faites voter avant chaque révélation.", "Un avis donné à voix haute, c'est un avis qu'on vient vérifier."],
  ["Prenez la ville de la salle.", "Le chiffre de chez soi marque plus qu'une moyenne nationale."],
  ["Laissez le silence après la révélation.", "Trois secondes. Puis : « Qui est surpris ? »"],
  ["Une idée reçue n'est pas une bêtise.", "On l'a tous entendue. On la démonte, pas la personne qui la dit."],
  ["Un chiffre manque ? Dites-le.", "Si le relevé du jour n'est pas arrivé, la diapo l'affiche. On continue avec la normale."],
]

export default function AtelierPage() {
  const cities = [...(citiesFR as { id: string; name: string }[])].sort((a, b) => a.name.localeCompare(b.name, "fr"))
  return (
    <PageShell crumbs={[{ label: "Atelier" }]}>
      <div className="flex flex-col gap-14 sm:gap-20">
        <header className="flex flex-col gap-5 pt-4 sm:pt-8">
          <Eyebrow>Atelier · mode projection</Eyebrow>
          <Title as="h1" size="hero" animate className="max-w-5xl">Un écran. Quinze minutes. <Hl tone="chaud">Le climat devient concret</Hl>.</Title>
          <p className="max-w-[52ch] font-display text-[clamp(1.2rem,2.6vw,1.6rem)] font-bold leading-snug text-ink-soft">
            Un diaporama plein écran avec les chiffres de votre ville. Vous posez la question, la salle vote, l&apos;écran répond.
          </p>
        </header>

        <section id="lancer" aria-labelledby="lancer-titre" className="scroll-mt-24">
          <Card tone="ink" className="flex flex-col gap-6 p-6 sm:p-10">
            <Title id="lancer-titre" size="lg" className="text-paper">Lancer la séance</Title>
            <form method="get" action="/atelier/projection" className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="atelier-ville" className="font-display text-[17px] font-bold">Votre ville</label>
                <select id="atelier-ville" name="ville" defaultValue={DEFAULT_CITY} className="min-h-12 w-full max-w-sm rounded-full border-2 border-paper bg-ink px-5 font-display text-[17px] font-bold text-paper">
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 font-display text-[17px] font-bold">Déroulé</legend>
                <div className="flex flex-wrap gap-3">
                  {DEROULES.map((d) => (
                    <label key={d.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full border-2 border-paper/40 px-5 py-2 has-[:checked]:border-signal has-[:checked]:bg-signal has-[:checked]:text-ink">
                      <input type="radio" name="deroule" value={d.id} defaultChecked={d.id === "15"} className="h-5 w-5 accent-ink" />
                      <span className="font-display text-[17px] font-bold">{d.name} · {d.duration}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-signal px-6 font-display text-[17px] font-extrabold text-ink hover:bg-paper">
                  Lancer en plein écran <Arrow />
                </button>
                <p className="text-[15px] text-paper/80">Flèches, espace ou télécommande de présentation. Le plein écran se règle sur la première diapo.</p>
              </div>
            </form>
          </Card>
        </section>

        <Section id="pour-qui" eyebrow="Pour qui" title={<>Pour <Hl>tout le monde</Hl>. Vraiment.</>} intro="Aucun prérequis. Les chiffres viennent de la ville choisie, les mots compliqués sont dans le glossaire.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-anim="stagger">
            {[
              ["Associations et éducation populaire", "Un café-climat, une fête de quartier, une réunion publique."],
              ["Créateurs de contenu", "Un live, une vidéo face caméra : l'écran sert de fond et de script."],
              ["Classes et formations", "Du collège à la formation adulte. Une séance clé en main."],
              ["Entre amis", "Le repas où quelqu'un dit « il fait froid, donc… »."],
            ].map(([t, s]) => (
              <Card key={t} tone="white" className="flex flex-col gap-2">
                <p className="font-display text-xl font-extrabold leading-tight">{t}</p>
                <p className="text-[15px] text-ink-soft">{s}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="deroules" eyebrow="Deux déroulés" title={<>15 minutes ou <Hl tone="froid">45 minutes</Hl>.</>}>
          <div className="grid gap-4 lg:grid-cols-2">
            {DEROULES.map((d) => (
              <Card key={d.id} tone={d.id === "15" ? "signal" : "white"} as="article" className="flex flex-col gap-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-[1.8rem] font-extrabold leading-tight">{d.name}</h3>
                  <span className="font-mono text-[15px] font-semibold">{d.duration}</span>
                </div>
                <p className="text-[16px] text-ink-soft">{d.pitch}</p>
                <ol className="flex flex-col gap-3">
                  {d.steps.map(([t, title, s], i) => (
                    <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-3 border-t-2 border-ink/10 pt-3">
                      <span className="font-mono text-[13px] font-semibold text-ink-soft">{t}</span>
                      <span><strong className="font-display text-[17px] font-extrabold">{title}</strong><span className="block text-[15px] text-ink-soft">{s}</span></span>
                    </li>
                  ))}
                </ol>
                <ButtonLink href={`/atelier/projection?deroule=${d.id}`} className="mt-auto w-fit">Lancer · {d.duration} <Arrow /></ButtonLink>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="materiel" eyebrow="Matériel" title={<>Un écran. <Hl>C&apos;est tout</Hl>.</>} intro="Un ordinateur relié à un vidéoprojecteur, une télé ou un écran partagé. Une connexion internet au lancement. Pas de compte, pas d'inscription, pas d'impression.">
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/atelier/glossaire" variant="ghost">Le glossaire, à imprimer <Arrow /></ButtonLink>
            <ButtonLink href="/idees-recues" variant="ghost">Toutes les idées reçues <Arrow /></ButtonLink>
          </div>
        </Section>

        <Section id="conseils" eyebrow="Conseils d'animation" title={<>Faites <Hl tone="chaud">voter</Hl> avant de révéler.</>}>
          <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {TIPS.map(([t, s], i) => (
              <li key={t} className="flex gap-4 rounded-[var(--radius-card)] bg-paper-deep p-5">
                <span className="font-display text-3xl font-extrabold text-chaud">{i + 1}</span>
                <span><strong className="font-display text-[17px] font-extrabold">{t}</strong><span className="block text-[15px] text-ink-soft">{s}</span></span>
              </li>
            ))}
          </ol>
        </Section>

        <p className="text-[13px] text-mute">
          Chiffres : Copernicus ERA5 (normales 1991-2020 et tendances), GIEC CMIP6 (projections), Open-Meteo (relevé du jour).{" "}
          <Link href="/a-propos" className="underline underline-offset-2">Méthode détaillée</Link>.
        </p>
      </div>
    </PageShell>
  )
}
