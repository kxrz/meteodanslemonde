# Lancement de la v2 : aide-mémoire

## Juste après la fusion dans `main`

1. **Calculer les normales de nuits de gel** (une seule fois, ~20 min)
   GitHub → onglet *Actions* → workflow « Frost normals » → *Run workflow* sur `main`.
   Il écrit `data/frost-normals.json` et le commite. Tant qu'il n'a pas tourné, `/signaux`, les fiches ville et les idées reçues affichent les nuits de gel observées avec la mention « normale en cours de calcul ».
2. **Relancer le relevé des extrêmes** pour obtenir le vrai minimum de l'année (`minTempLow`) : workflow « Daily year extremes » → *Run workflow* (sinon il tournera seul le lendemain à 5 h 30 UTC).
3. Vérifier la page d'accueil, une fiche ville, `/signaux`, `/idees-recues`, `/jumeaux` sur téléphone.

## Si Open-Meteo devient payant (usage commercial ou quota dépassé)

L'API gratuite d'Open-Meteo est réservée à un usage non commercial (~10 000 appels par jour). Avec un abonnement, tout le site bascule sans modification de code :

| Où | Quoi |
|---|---|
| Vercel → Project → Settings → Environment Variables | `OPEN_METEO_API_KEY` = la clé (Production et Preview), puis redéployer |
| GitHub → Settings → Secrets and variables → Actions | secret `OPEN_METEO_API_KEY` (workflows de données) |

Ce qui se passe alors :
- `lib/open-meteo.ts` passe sur les hôtes `customer-*.open-meteo.com` et ajoute `apikey` ; tout le code serveur passe par lui.
- Le script du build Vercel (`scripts/fetch-weather.mjs`) et les scripts de données (`scripts/fetch-*.ts`) lisent la même variable.
- La clé ne part jamais dans le navigateur : les composants client passent par le relais `/api/meteo/[service]` (mis en cache 1 h par le CDN).

Pour vérifier : `npx vitest run __tests__/open-meteo.test.ts`.

## Autres services

| Service | Clé | Remarque |
|---|---|---|
| NASA FIRMS (anomalies thermiques) | aucune | fichier CSV public. Si un jour il faut passer par l'API FIRMS : clé « MAP_KEY » gratuite, à mettre dans `NASA_FIRMS_KEY` et à brancher dans `lib/fire-data.ts`. |
| geo.api.gouv.fr (recherche de commune) | aucune | si le service ne répond pas, la recherche se replie sur les 62 villes suivies. |
| Resend (emails) | `RESEND_API_KEY` | déjà en place. |
| Neon (abonnés) | `DATABASE_URL` | déjà en place. |
