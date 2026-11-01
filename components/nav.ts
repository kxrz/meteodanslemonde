export interface NavItem {
  href: string
  label: string
  desc: string
}

/** Les six entrées principales du site. */
export const NAV_MAIN: NavItem[] = [
  { href: "/", label: "Aujourd'hui", desc: "L'écart à la normale, partout en France" },
  { href: "/r", label: "Ma ville", desc: "62 villes, région par région" },
  { href: "/signaux", label: "Signaux du mois", desc: "Ce qui se dérègle en ce moment" },
  { href: "/idees-recues", label: "Idées reçues", desc: "« Il fait froid, donc… » et les autres" },
  { href: "/jumeaux", label: "Jumeaux 2050", desc: "Votre ville en 2050 existe déjà ailleurs" },
  { href: "/atelier", label: "Atelier", desc: "Mode projection pour animer une séance" },
]

export const NAV_MORE: NavItem[] = [
  { href: "/terrain", label: "Vues d'en haut", desc: "Avant / après par satellite" },
  { href: "/notifications", label: "Briefing quotidien", desc: "L'écart de votre ville chaque matin" },
  { href: "/citoyens", label: "Écrire à mes élus", desc: "Un modèle de lettre sourcé" },
  { href: "/a-propos", label: "Méthode et sources", desc: "D'où viennent les chiffres" },
  { href: "/brand", label: "Marque", desc: "Logo, couleurs, composants" },
  { href: "/contact", label: "Contact", desc: "Signaler une erreur" },
]
