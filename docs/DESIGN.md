# cestchaud.fr — système de design v2

Référence pour toute page. La page publique `/brand` en est la vitrine.

## Posture

Bold, ludique, assumé. On ne fait pas un tableau de bord neutre : on prend position avec des chiffres sourcés.
Chaque page doit **enseigner une chose** et la dire **en gras**. Les titres affirment ; les mots-clés sont surlignés.

## Règles non négociables

1. **L'écart à la normale avant la température.** Toute couleur liée à une valeur du jour vient de `lib/anomaly.ts` (`anomalyHex`, `anomalyInk`, `ANOMALY_STEPS`). Jamais de nouvelle échelle locale. Si on montre l'absolu, on le dit (`absoluteHex`) et on propose la bascule vers l'écart.
2. **Saison-aware.** Pas de « chaleur », « canicule », « chaud » codé en dur dans un texte qui s'affiche toute l'année. Utiliser `lib/season.ts` (`seasonOf`, `isColdHalf`, `isHotSeason`, `seasonCopy`, `deMonth`, `MONTHS`).
3. **Format français** via `lib/format.ts` : `fmt`, `fmtDelta`, `fmtTemp`, `fmtDeltaTemp` (virgule, vrai signe moins, pas de « +- »). Jamais `toFixed` dans le JSX, jamais de « + » écrit en dur devant une valeur.
4. **Projections** : par saison avec fourchette (`lib/climate-season.ts` → `seasonalProjections`, `smoothedAt`). Jamais une valeur mensuelle brute de projection ou de tendance isolée.
5. **Jargon** : chaque terme technique (ERA5, SSP, anomalie, normale, ressenti…) a une bulle `<Explain term="…" />` (clés dans `lib/glossary.ts`).
6. **Données absentes** : afficher un état explicite (« relevé indisponible »), jamais 0 ni un squelette infini.
7. **Accessibilité** : texte ≥ 12 px (13 px pour tout ce qui se lit), gris le plus clair = `text-mute` (#5f5e58) ; zones de clic ≥ 44 px (`min-h-11`) ; un seul `h1` par page puis `h2` par section (le composant `Section` le fait) ; `aria-pressed` sur les boutons-bascule ; rien qui ne marche qu'au survol.
8. **Accents** partout. Vouvoiement.

## Jetons (app/globals.css, `@theme inline`)

| Rôle | Classe Tailwind | Valeur |
|---|---|---|
| Papier (fond) | `bg-paper` / `bg-paper-deep` | #f5f4f0 / #ebe9e2 |
| Encre | `text-ink`, `bg-ink`, `text-ink-soft` | #111111 / #3d3d3a |
| Texte secondaire | `text-mute` | #5f5e58 |
| Filets | `border-line` | #dcdad2 |
| Chaud | `bg-chaud`, `text-chaud`, `-deep` | #e3261b |
| Froid | `bg-froid`, `text-froid`, `-deep` | #1d4ed8 |
| Signal (jaune) | `bg-signal`, `text-signal` | #ffe14d |
| Surligneurs | `bg-hl-chaud`, `bg-hl-froid`, `bg-hl-signal` | pastels |
| Échelle d'anomalie | `bg-a-m4` … `bg-a-0` … `bg-a-p4` | 9 pas |

Typo : `font-display` (Bricolage Grotesque, 700-800, titres et chiffres), `font-sans` (DM Sans, texte), `font-mono` (JetBrains Mono, sur-titres et données).
Rayon des blocs : `rounded-[var(--radius-card)]` (20 px). Boutons : `rounded-full`.

## Composants (components/ui, components/brand, components/pedago)

- `PageShell` : gabarit de page (en-tête, fil d'Ariane `crumbs`, contenu `max-w-7xl` ou `width="text"`, pied de page). **Toute page l'utilise.**
- `Section` : `eyebrow`, `title` (ReactNode, avec `<Hl>` dedans), `intro`, `action`.
- `Title` : `as`, `size` (hero | xl | lg | md), `animate` (mots qui montent, SplitText).
- `Hl` : mot surligné et gras. `tone` = chaud | froid | signal | ink. Le surligneur se trace à l'apparition.
- `Num` : nombre formaté, compte depuis `from` à l'apparition (`signed`, `decimals`, `unit`). Astuce pédagogique : `from={normale}` pour que le chiffre parte de la normale.
- `Delta` : écart signé coloré.
- `Card` : `tone` = white | paper | ink | chaud | froid | signal | outline ; `href` rend toute la carte cliquable.
- `Stat` : étiquette + gros chiffre + phrase + `explain`.
- `Button`, `ButtonLink`, `Arrow` : variantes ink | chaud | froid | ghost | paper.
- `Eyebrow`, `AnomalyChip`, `ScaleLegend`, `Explain`.
- Marque : `Logo`, `Mark` (l'anneau de l'écart : un « ° » moitié chaud, moitié froid).
- Pédagogie : `AnomalyBreakdown` (météo vs climat), `SeasonCurve` (la courbe qui glisse), `FranceDotMap` (thermomètre ↔ écart), `CityRanking` (tri animé par Flip).

## Mouvement (GSAP 3.15, plugins gratuits)

- Moteur global `components/motion/MotionEngine.tsx` monté dans le layout. Dans un composant serveur, on pose des attributs :
  `data-anim="split" | "hl" | "count" | "scramble" | "stagger"`. Rien d'autre à écrire.
- Animation spécifique : composant client avec `useGSAP` (`@gsap/react`), **toujours** dans `gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", …)`.
- L'état final est dans le HTML du serveur. Une animation part d'un état visible ou se déclenche à l'entrée à l'écran (`ScrollTrigger`, `once: true`).
- Une animation = une idée à comprendre (passer de l'absolu à l'écart, de la journée au climat, d'aujourd'hui à 2050). Pas d'effet décoratif gratuit.
- Pilotable au clavier et au tap (boutons d'étape avec `aria-pressed`), jamais seulement au défilement.

## Ton éditorial

Titres courts et affirmatifs, un mot surligné : « Le thermomètre **ment par omission**. »
Phrases simples, actives. On cite la source sous chaque bloc de données.
