// Glossaire partagé : alimente les bulles « Expliquer ce chiffre », la page /atelier/glossaire
// et le mode atelier. Définitions courtes, sans jargon, avec la source quand elle existe.

export interface GlossaryEntry {
  term: string
  short: string // une phrase, affichée dans la bulle
  long?: string // paragraphe pour le glossaire complet
}

export const GLOSSARY = {
  ressenti: {
    term: "Ressenti",
    short: "La température que le corps perçoit, calculée à partir de la température de l'air, de l'humidité, du vent et du soleil.",
    long: "Le site utilise la « température apparente » maximale du jour fournie par Open-Meteo. Par vent fort, le ressenti est plus bas que le thermomètre ; par temps lourd et ensoleillé, il est plus haut. C'est la même mesure toute l'année, ce qui permet de comparer un jour à sa normale.",
  },
  normale: {
    term: "Normale",
    short: "La valeur moyenne observée pour ce mois et cette ville entre 1991 et 2020.",
    long: "Calculée à partir de la réanalyse ERA5 sur 30 ans (1991-2020), la période de référence recommandée par l'Organisation météorologique mondiale. Une normale n'est pas une valeur « idéale » : c'est ce à quoi on s'attendait en moyenne avant le réchauffement récent.",
  },
  anomalie: {
    term: "Anomalie",
    short: "L'écart entre la valeur du jour et la normale du mois. +4 °C veut dire « 4 °C de plus que d'habitude à cette période ».",
    long: "C'est le chiffre central du site. Une anomalie se lit pareil en janvier et en juillet : 8 °C en janvier à Lille peut être une anomalie plus forte que 30 °C en juillet. Une anomalie d'un seul jour, c'est de la météo ; c'est leur accumulation sur des années qui dessine le climat.",
  },
  tendance: {
    term: "Tendance 30 ans",
    short: "L'évolution de la valeur moyenne de ce mois entre les années 1990 et les années 2015-2024, mesurée par ERA5.",
    long: "On compare la moyenne de 1991-2000 à celle de 2015-2024 pour le même mois et la même ville. Mois par mois, ce chiffre est bruité (une décennie compte peu d'années) : il se lit mieux à l'échelle d'une saison ou de l'année.",
  },
  projection: {
    term: "Projection",
    short: "Ce que les modèles climatiques du GIEC (CMIP6) calculent pour 2030, 2040 et 2050, par rapport à 2000-2020.",
    long: "Une projection n'est pas une prévision : elle dit « si les émissions suivent tel scénario, voici le climat moyen attendu ». Le site affiche des moyennes par saison et la fourchette entre scénarios, plus robustes qu'une valeur mensuelle isolée.",
  },
  ssp: {
    term: "Scénario SSP",
    short: "Une trajectoire d'émissions de gaz à effet de serre. SSP1-2.6 = fortes baisses, SSP2-4.5 = politiques actuelles, SSP5-8.5 = émissions en hausse.",
    long: "Les « Shared Socioeconomic Pathways » sont les scénarios du 6e rapport du GIEC (AR6). Le chiffre après le tiret (2.6, 4.5, 8.5) est le forçage radiatif en 2100, en W/m². Jusqu'en 2050, les scénarios divergent encore peu : c'est après que l'écart se creuse.",
  },
  era5: {
    term: "ERA5",
    short: "La base de données de référence du climat passé, produite par le service européen Copernicus.",
    long: "ERA5 combine des millions d'observations (stations, satellites, ballons) avec un modèle météo pour reconstituer, heure par heure depuis 1940, l'état de l'atmosphère partout sur le globe.",
  },
  cmip6: {
    term: "CMIP6",
    short: "L'ensemble des modèles climatiques utilisés par le GIEC pour son 6e rapport.",
  },
  jumeau: {
    term: "Jumeau climatique",
    short: "Une ville du monde dont le climat actuel ressemble à ce que votre ville vivra en 2050.",
    long: "On compare la normale projetée de votre ville en 2050 (normale + projection) aux normales actuelles des villes du monde, saison par saison. Le jumeau le plus proche montre concrètement le changement attendu.",
  },
  nuitTropicale: {
    term: "Nuit tropicale",
    short: "Une nuit où la température ne descend pas sous 20 °C. Le corps récupère mal.",
  },
  nuitGel: {
    term: "Nuit de gel",
    short: "Une nuit où la température minimale passe sous 0 °C.",
    long: "Le gel est utile : il régule les ravageurs, structure les sols et cale le calendrier des plantes. Quand il manque, ce n'est pas une bonne nouvelle, c'est un signal.",
  },
  meteoClimat: {
    term: "Météo ou climat ?",
    short: "La météo, c'est le temps qu'il fait aujourd'hui. Le climat, c'est la moyenne sur 30 ans. Une journée froide ne dit rien du climat.",
  },
  firms: {
    term: "NASA FIRMS",
    short: "Le système de la NASA qui repère par satellite les points anormalement chauds au sol (incendies, brûlages, sites industriels).",
  },
} satisfies Record<string, GlossaryEntry>

export type GlossaryKey = keyof typeof GLOSSARY
