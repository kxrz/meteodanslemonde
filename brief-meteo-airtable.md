# Brief exercice : comparateur météo mondial avec Airtable

**Niveau :** no-code / initiation data  
**Durée estimée :** 3 à 5 heures  
**Outils :** Airtable (gratuit), une API météo gratuite, un outil no-code au choix, Leaflet (visualisation)

---

## Le contexte

38 °C à Lille, c'est exceptionnel. Mais quelque part dans le monde, c'est un mardi ordinaire. L'objectif de cet exercice est de construire un comparateur qui réponde à une question simple : quand Lille atteint telle température, où dans le monde est-ce la norme ?

---

## Ce qu'on vous demande de livrer

Un système en trois couches :

**1. Une base de données Airtable structurée**  
Deux tables liées : une pour les **villes françaises** (30 villes), une pour les **villes de référence mondiale** (30 villes choisies pour leur intérêt climatique). Pour chaque ville, vous stockez au minimum : nom, pays/région, latitude, longitude, température actuelle, condition météo, et un lien vers son « jumeau climatique » dans l'autre table.

**2. Une alimentation automatique des données météo**  
Les données ne doivent pas être saisies à la main. Vous utilisez une API météo gratuite (piste : Open-Meteo, sans clé API, ou OpenWeatherMap avec un compte free tier) pour alimenter Airtable via un outil d'automatisation no-code (piste : Make.com, n8n, ou les automatisations natives Airtable).

**3. Une carte interactive Leaflet**  
Une page web simple affiche les villes sur une carte. Au clic sur une ville française, un trait relie cette ville à son ou ses jumeaux climatiques dans le monde. Une infobulle affiche les données clés (température, condition, pays).

---

## Les contraintes

- Tous les outils utilisés doivent avoir un niveau gratuit suffisant pour l'exercice.
- Les coordonnées GPS ne sont **pas saisies manuellement** : elles sont soit issues de l'API météo, soit générées via une table de correspondance ou un géocodeur gratuit (piste : Nominatim/OpenStreetMap).
- Le lien entre une ville française et ses jumeaux climatiques doit être **une relation Airtable** (champ « Linked record »), pas une simple colonne texte.
- La carte Leaflet est hébergée quelque part (Glitch, Vercel, GitHub Pages ou même un simple fichier HTML ouvert dans le navigateur).

---

## Les pièges à éviter

- **Ne pas commencer par la carte.** Commencer par la structure Airtable. Si les données ne sont pas propres, la visualisation sera inexploitable.
- **Ne pas choisir 30 villes au hasard.** Les villes mondiales doivent couvrir des profils climatiques variés et représentatifs (aride, tropical, continental, équatorial, polaire). Documentez vos choix.
- **Ne pas négliger les fuseaux horaires.** Les températures récupérées doivent être à un instant comparable (heure UTC ou heure locale explicitée).
- **Ne pas hardcoder les coordonnées GPS** si vous pouvez les récupérer via l'API.

---

## Les livrables attendus

1. Un lien vers votre base Airtable (partagée en lecture).
2. La carte Leaflet fonctionnelle (URL publique ou fichier HTML).
3. Un court document (½ page max) qui explique : quelle API vous avez utilisée, comment l'automatisation fonctionne, et quel a été le principal obstacle rencontré.

---

## Critères de réussite

| Critère | Attendu |
|---|---|
| Structure Airtable | Tables liées, champs typés correctement, GPS automatisé |
| Alimentation des données | Automatisée, pas saisie manuellement |
| Carte Leaflet | Villes affichées, clic fonctionnel, liaisons visibles |
| Qualité des choix | Diversité climatique justifiée, cohérence des comparaisons |
| Documentation | Courte, honnête, incluant les limites rencontrées |

---

> Le but n'est pas d'avoir une app parfaite. C'est de comprendre comment des outils simples, bien connectés, produisent quelque chose qu'on ne pouvait pas faire seul avec un tableur Excel.
