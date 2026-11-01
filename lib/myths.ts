// Idées reçues : contenu partagé par l'accueil (idée reçue du jour), /idees-recues et /atelier.
// Règle éditoriale : une affirmation entendue, une réponse courte et nette, une explication,
// un module interactif quand on a les données, et des sources publiques vérifiables.

import type { Season } from "@/lib/season"

export type MythModule = "breakdown" | "curve" | "frost" | "extremes" | "map" | "twins" | "none"

export interface Myth {
  slug: string
  seasons: Season[]
  claim: string
  /** réponse en une phrase, affichée en très gras */
  answer: string
  /** mot(s) de `answer` à surligner */
  highlight: string
  explanation: string[]
  module: MythModule
  sources: { label: string; url: string }[]
}

const COPERNICUS = { label: "Copernicus, état du climat en Europe", url: "https://climate.copernicus.eu/esotc" }
const METEOFRANCE = { label: "Météo-France, le changement climatique en France", url: "https://meteofrance.com/changement-climatique" }
const GIEC = { label: "GIEC, AR6 groupe 1, résumé pour décideurs", url: "https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/" }
const DRIAS = { label: "DRIAS, les futurs du climat en France", url: "https://www.drias-climat.fr/" }

export const MYTHS: Myth[] = [
  {
    slug: "il-gele-donc",
    seasons: ["hiver", "automne", "printemps"],
    claim: "Il gèle ce matin. Le réchauffement, c'est du flan.",
    answer: "Une journée froide, c'est de la météo. Le climat, c'est la moyenne sur 30 ans.",
    highlight: "c'est de la météo",
    explanation: [
      "Le réchauffement ne supprime pas les journées froides : il décale la moyenne autour de laquelle elles tombent. Une matinée à −2 °C peut très bien arriver dans un mois de janvier plus doux que la normale.",
      "Sur cestchaud.fr, chaque valeur du jour est comparée à la normale 1991-2020 du même mois. Et on montre à part ce que la tendance de fond a déjà ajouté à cette normale.",
    ],
    module: "breakdown",
    sources: [GIEC, METEOFRANCE],
  },
  {
    slug: "hivers-doux-toujours",
    seasons: ["hiver"],
    claim: "Des hivers doux, il y en a toujours eu.",
    answer: "Oui. Mais ils sont devenus la règle, pas l'exception.",
    highlight: "la règle",
    explanation: [
      "Un hiver doux isolé ne prouve rien. Ce qui compte, c'est la fréquence : en France, la plupart des hivers récents se situent au-dessus de la moyenne 1991-2020, elle-même plus chaude que celle des décennies précédentes.",
      "La courbe des normales de votre ville montre de combien chaque mois s'est déplacé en 30 ans.",
    ],
    module: "curve",
    sources: [METEOFRANCE, COPERNICUS],
  },
  {
    slug: "pas-de-gel-tant-mieux",
    seasons: ["hiver", "printemps"],
    claim: "Il n'a pas gelé cet hiver. Tant mieux.",
    answer: "Le gel qui manque est un signal, pas une bonne nouvelle.",
    highlight: "un signal",
    explanation: [
      "Le gel régule les insectes ravageurs et certains pathogènes, il ameublit les sols et il cale le calendrier des plantes. Sans lui, les bourgeons démarrent plus tôt… et deviennent vulnérables aux gelées tardives d'avril.",
      "Le nombre de jours de gel a nettement diminué en France depuis les années 1960, selon Météo-France. Le site compare les nuits de gel du mois à celles qu'on attendait.",
    ],
    module: "frost",
    sources: [METEOFRANCE, DRIAS],
  },
  {
    slug: "il-a-neige",
    seasons: ["hiver"],
    claim: "Il a neigé à la montagne, donc tout va bien.",
    answer: "Un épisode de neige ne dit rien de l'enneigement moyen.",
    highlight: "l'enneigement moyen",
    explanation: [
      "On peut avoir de belles chutes de neige une semaine et un enneigement faible sur la saison. Sous 1 800 m, la durée d'enneigement a reculé de plusieurs semaines en 60 ans dans les Pyrénées et les Alpes.",
      "C'est la tendance sur des décennies qui compte, pas la photo d'un week-end.",
    ],
    module: "none",
    sources: [{ label: "Observatoire pyrénéen du changement climatique", url: "https://www.opcc-ctp.org/" }, METEOFRANCE],
  },
  {
    slug: "vague-de-froid-preuve",
    seasons: ["hiver"],
    claim: "Une vague de froid, c'est bien la preuve que ça ne se réchauffe pas.",
    answer: "Les vagues de froid existent encore. Elles sont plus rares et moins intenses.",
    highlight: "plus rares et moins intenses",
    explanation: [
      "Le GIEC constate que les extrêmes froids sont devenus moins fréquents et moins sévères sur la plupart des régions du globe, tandis que les extrêmes chauds augmentent.",
      "La journée la plus froide de l'année d'une ville se lit à côté de sa tendance : un coup de froid ne renverse pas trente ans de mesures.",
    ],
    module: "extremes",
    sources: [GIEC],
  },
  {
    slug: "un-degre-cest-rien",
    seasons: ["hiver", "printemps", "ete", "automne"],
    claim: "+1,5 °C, ce n'est rien. Je ne sens même pas la différence.",
    answer: "Une moyenne qui monte un peu, ce sont des saisons qui glissent de plusieurs jours.",
    highlight: "glissent de plusieurs jours",
    explanation: [
      "Une moyenne annuelle cache beaucoup de choses. Décaler toute la courbe des saisons d'1,5 °C, c'est faire arriver le printemps plus tôt et repousser l'automne de plusieurs jours.",
      "Surtout, une petite hausse de la moyenne rend beaucoup plus fréquents les jours extrêmes, ceux qu'on ressent vraiment.",
    ],
    module: "curve",
    sources: [GIEC, DRIAS],
  },
  {
    slug: "canicules-toujours",
    seasons: ["ete"],
    claim: "Des canicules, il y en a toujours eu. Souvenez-vous de 1976.",
    answer: "1976 était une exception. Aujourd'hui, ces étés reviennent bien plus souvent.",
    highlight: "bien plus souvent",
    explanation: [
      "L'été 1976 est resté dans les mémoires parce qu'il était rare. Depuis 2000, les vagues de chaleur sont nettement plus fréquentes en France que sur les décennies précédentes, et plusieurs ont dépassé 1976 en intensité (2003, 2019, 2022).",
    ],
    module: "map",
    sources: [METEOFRANCE],
  },
  {
    slug: "clim-suffit",
    seasons: ["ete"],
    claim: "Avec la clim, la chaleur, ce n'est pas un problème.",
    answer: "La nuit, c'est là que le corps récupère. Et les nuits ne rafraîchissent plus.",
    highlight: "les nuits ne rafraîchissent plus",
    explanation: [
      "Les nuits tropicales (au-dessus de 20 °C) empêchent l'organisme de récupérer. Elles deviennent plus nombreuses, surtout en ville, et la climatisation rejette sa chaleur dehors.",
    ],
    module: "none",
    sources: [METEOFRANCE, DRIAS],
  },
  {
    slug: "jumeau-2050",
    seasons: ["hiver", "printemps", "ete", "automne"],
    claim: "2050, c'est loin, on verra bien.",
    answer: "Le climat de votre ville en 2050 existe déjà. Quelque part plus au sud.",
    highlight: "existe déjà",
    explanation: [
      "En comparant la normale projetée de votre ville en 2050 aux normales actuelles de 67 villes du monde, on trouve son « jumeau climatique ». Un enfant né cette année aura 25 ans en 2050.",
    ],
    module: "twins",
    sources: [GIEC, { label: "Copernicus ERA5", url: "https://cds.climate.copernicus.eu/" }],
  },
]

export function mythsFor(season: Season): Myth[] {
  return MYTHS.filter((m) => m.seasons.includes(season))
}

/** Idée reçue du jour, stable sur 24 h. */
export function mythOfTheDay(season: Season, date = new Date()): Myth {
  const list = mythsFor(season)
  const day = Math.floor(date.getTime() / 86_400_000)
  return list[day % list.length]
}
