# cestchaud.fr

**En vrai, c'est chaud. Même en hiver.**

cestchaud.fr compare chaque jour le ressenti de 62 villes françaises (et 67 villes du monde) à ce qui est normal pour le mois, démonte les idées reçues sur le climat (« il fait froid, donc pas de réchauffement »…) et montre à quoi ressemblera votre ville en 2050. Pensé d'abord pour le téléphone, avec des images story prêtes à partager.

![Aperçu cestchaud.fr](public/og/home.png)

---

## Ce que fait le site

- **Aujourd'hui** (`/`) : l'écart moyen de la France à la normale, une carte qui bascule du thermomètre à l'écart, la décomposition « météo du jour ou climat qui change ? », l'idée reçue du jour, le classement des villes.
- **Ma ville** (`/r`, `/a/[ville]`) : la fiche de chaque ville, avec l'écart du jour, la courbe des saisons qui glisse, les projections 2030-2050 par saison avec leur fourchette, les extrêmes de l'année, les signaux de saison.
- **Signaux du mois** (`/signaux`) : en hiver, les nuits de gel qui manquent et les journées très douces ; en été, les nuits tropicales et les séries de chaleur. Anomalies thermiques satellite en sous-page.
- **Idées reçues** (`/idees-recues`) : des cartes plein écran à faire défiler, réponse révélée d'un geste, données réelles de la ville choisie, sources.
- **Jumeaux 2050** (`/jumeaux`) : la ville du monde dont le climat actuel ressemble à celui de votre ville en 2050, et un jeu quotidien.
- **Atelier** (`/atelier`) : un mode projection pour animer une séance ou tourner une vidéo.
- **Images story 1080×1920** pour le jour, chaque idée reçue et chaque jumeau.
- **Pas d'IA générative** : chaque chiffre vient d'une source scientifique ouverte.

## Sources de données

| Source | Usage |
|--------|-------|
| [Open-Meteo](https://open-meteo.com/) | Ressenti maximal du jour (température apparente), archives quotidiennes |
| [ERA5 / Copernicus](https://cds.climate.copernicus.eu/) | Normales 1991-2020, tendance 1991-2000 → 2015-2024 |
| [CMIP6 / GIEC AR6](https://www.ipcc.ch/report/ar6/wg1/) | Projections 2030, 2040, 2050 : médiane et fourchette de modèles haute résolution (HighResMIP, via Open-Meteo), par rapport à 2000-2020 |
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) | Anomalies thermiques détectées par satellite |
| [leswww-liner](https://github.com/kxrz/leswww-liner) | Contours des pays pour les fonds de carte en points (MIT) |

Les données climatiques sont précalculées dans `data/` ; la météo du jour est récupérée à chaque build (`npm run fetch-weather`).

## Identité et composants

- Page publique : [`/brand`](https://www.cestchaud.fr/brand) (logo, anneau de l'écart, couleurs, typographie, composants, fichiers SVG).
- Référence pour contribuer : [`docs/DESIGN.md`](docs/DESIGN.md) (règles, jetons, composants, animations).
- Animations : [GSAP](https://gsap.com/) 3.15, pilotées par un moteur unique (`components/motion/MotionEngine.tsx`) et respectueuses de `prefers-reduced-motion`.

## Stack technique

- **Next.js 16** (App Router, ISR), **React 19**, **TypeScript**
- **Tailwind CSS v4**, polices auto-hébergées (Bricolage Grotesque, DM Sans, JetBrains Mono)
- **GSAP** (ScrollTrigger, SplitText, Flip, MotionPath, ScrambleText)
- Cartes en SVG (style Liner) ; **Leaflet** pour la carte des anomalies thermiques
- **Resend** (emails), **Neon** (abonnés), **Vercel** (hébergement)

## Lancer en local

```bash
npm install
npm run fetch-weather   # météo du jour (requis avant le build)
npm run dev
npm test
```

### Variables d'environnement

| Variable | Usage |
|----------|-------|
| `RESEND_API_KEY` | Emails (contact, briefing) |
| `RESEND_WEBHOOK_SECRET` | Facultatif : active la vérification de signature des webhooks Resend (`whsec_…`) |
| `DATABASE_URL` | Base des abonnés (Neon) |
| `CRON_SECRET`, `PUSH_SECRET`, `VAPID_*` | Tâches planifiées et notifications |
| `OPEN_METEO_API_KEY` | Facultatif : clé Open-Meteo payante (usage commercial ou quota dépassé) |

## Déploiement et données

- Build Vercel : `npm run fetch-weather && next build --webpack`, relancé chaque matin par `.github/workflows/daily-build.yml`.
- `daily-year-extremes.yml` : extrêmes de l'année, chaque matin.
- `frost-normals.yml` : normales de nuits de gel 1991-2020, à lancer à la main une fois.
- Fonds de carte : `node scripts/build-geo.mjs <leswww-liner/lib/countries.json>`.
- Aide-mémoire de mise en production et passage à une clé payante : [`docs/LANCEMENT.md`](docs/LANCEMENT.md).

## Auteur

[Florent Bertiaux](https://leswww.com), LesWWW.

> Les données climatiques méritent d'être lues autrement : sans jargon, sans filtre, et en gras.
