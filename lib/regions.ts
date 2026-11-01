// Les 13 régions métropolitaines : libellé et description saisonnière (une phrase été, une phrase hiver).
// La phrase affichée est choisie par `isColdHalf` : jamais de « canicule » en novembre.

import { isColdHalf } from "@/lib/season"

export interface RegionInfo {
  label: string
  /** phrase pour la moitié chaude de l'année */
  summer: string
  /** phrase pour la moitié froide de l'année (nov → mars) */
  winter: string
}

export const REGIONS: Record<string, RegionInfo> = {
  "bretagne": {
    label: "Bretagne",
    summer: "Longtemps l'une des régions les plus tempérées de France, la Bretagne voit pourtant ses étés se réchauffer : Rennes, Brest et Quimper comptent davantage de journées chaudes qu'il y a trente ans.",
    winter: "L'hiver breton, déjà doux grâce à l'océan, gèle de moins en moins : les nuits sous zéro se raréfient de Rennes à Brest, et la douceur n'est plus l'exception.",
  },
  "occitanie": {
    label: "Occitanie",
    summer: "L'Occitanie est l'une des régions françaises les plus exposées aux vagues de chaleur : Toulouse, Montpellier, Perpignan et Nîmes connaissent des étés parmi les plus chauds de métropole.",
    winter: "Entre Pyrénées et Méditerranée, l'hiver occitan se raccourcit : moins de gel en plaine, moins de neige en montagne, et des épisodes de douceur hors saison plus fréquents.",
  },
  "provence-alpes-cote-d-azur": {
    label: "Provence-Alpes-Côte d'Azur",
    summer: "Marseille, Nice, Toulon et Avignon vivent des étés de plus en plus longs et chauds : le pourtour méditerranéen se réchauffe plus vite que la moyenne mondiale.",
    winter: "L'hiver méditerranéen, déjà clément, devient plus doux encore ; dans les Alpes du Sud, l'enneigement recule et les gelées arrivent plus tard.",
  },
  "auvergne-rhone-alpes": {
    label: "Auvergne-Rhône-Alpes",
    summer: "Entre vallée du Rhône et massifs, la région connaît de forts contrastes : Lyon, Grenoble et Valence subissent des pics de chaleur de plus en plus fréquents.",
    winter: "En montagne, l'hiver se raccourcit et la limite pluie-neige remonte ; en plaine, de Lyon à Clermont-Ferrand, les jours de gel diminuent.",
  },
  "nouvelle-aquitaine": {
    label: "Nouvelle-Aquitaine",
    summer: "Bordeaux, Bayonne, La Rochelle et Pau voient leurs étés se transformer : chaleur plus intense, sécheresses plus longues, forêts plus exposées au feu.",
    winter: "L'hiver aquitain s'adoucit : les gelées se font plus rares de Bordeaux à Poitiers, et la végétation redémarre plus tôt au printemps.",
  },
  "hauts-de-france": {
    label: "Hauts-de-France",
    summer: "Lille, Amiens, Dunkerque et Arras comptent parmi les villes du nord qui se réchauffent le plus : les vagues de chaleur, jadis rares, y deviennent régulières.",
    winter: "L'hiver du Nord n'est plus ce qu'il était : moins de jours de gel, moins de neige, et des hivers doux et humides qui se succèdent.",
  },
  "ile-de-france": {
    label: "Île-de-France",
    summer: "Paris cumule l'îlot de chaleur urbain et le réchauffement régional : la capitale a dépassé 42 °C lors de la canicule de juillet 2019.",
    winter: "L'hiver francilien gèle de moins en moins, surtout en ville où le béton restitue la chaleur la nuit : la neige tient rarement plus de quelques heures à Paris.",
  },
  "grand-est": {
    label: "Grand Est",
    summer: "Strasbourg, Reims, Metz et Nancy vivent sous un climat continental qui amplifie les extrêmes : les étés y sont de plus en plus chauds et secs.",
    winter: "Le Grand Est garde les hivers les plus froids de plaine, mais ils s'adoucissent : les vagues de froid durables y sont devenues plus rares.",
  },
  "pays-de-la-loire": {
    label: "Pays de la Loire",
    summer: "Nantes, Angers, Le Mans et La Roche-sur-Yon, au carrefour des influences atlantiques et continentales, voient leurs étés se réchauffer nettement.",
    winter: "Les hivers ligériens, doux et humides, comptent de moins en moins de gelées : le calendrier des cultures et des vignes s'en trouve décalé.",
  },
  "bourgogne-franche-comte": {
    label: "Bourgogne-Franche-Comté",
    summer: "De Dijon à Besançon, entre plaines bourguignonnes et massif jurassien, les étés plus chauds pèsent sur la vigne, les forêts et les rivières.",
    winter: "Dans le Jura comme en Bourgogne, l'hiver se raccourcit : moins de jours de gel, et des débourrements de vigne plus précoces, donc plus exposés aux gelées tardives.",
  },
  "normandie": {
    label: "Normandie",
    summer: "Caen, Rouen, Le Havre et Cherbourg profitent encore du frein océanique, mais les vagues de chaleur atteignent désormais la côte normande.",
    winter: "L'hiver normand, tempéré par la Manche, devient plus doux et plus pluvieux : le gel s'y fait rare, surtout sur le littoral.",
  },
  "centre-val-de-loire": {
    label: "Centre-Val de Loire",
    summer: "Tours, Orléans, Chartres et Bourges forment souvent un couloir de chaleur entre le Sud et le Nord : les étés secs y font baisser la Loire.",
    winter: "Dans le Centre, les hivers s'adoucissent : moins de gelées en plaine, des cultures qui redémarrent plus tôt et restent exposées aux coups de froid tardifs.",
  },
  "corse": {
    label: "Corse",
    summer: "Ajaccio et Bastia vivent un réchauffement méditerranéen accéléré : étés plus longs, mer plus chaude, maquis plus sec.",
    winter: "L'hiver corse est doux sur le littoral et se raccourcit en montagne : l'enneigement des sommets devient plus irrégulier.",
  },
}

/** La phrase de saison d'une région pour le mois donné (0-11). */
export function regionDescription(slug: string, month: number): string | null {
  const r = REGIONS[slug]
  if (!r) return null
  return isColdHalf(month) ? r.winter : r.summer
}
