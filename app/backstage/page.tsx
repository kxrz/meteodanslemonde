import Link from "next/link"
import { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import Card from "@/components/ui/Card"
import Section from "@/components/ui/Section"
import { ButtonLink, Arrow } from "@/components/ui/Button"

export const revalidate = 604800

const BASE = "https://www.cestchaud.fr"
const TITLE = "Backstage · Les coulisses d'un site pédagogique sur le climat"
const DESCRIPTION =
  "Comment un développeur solo construit un service de données climatiques avec des API gratuites, pour moins de 10 € par an. Tout le monde peut le faire."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/backstage` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}/backstage`, siteName: "cestchaud.fr", locale: "fr_FR", type: "article" },
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-paper-deep px-1.5 py-0.5 font-mono text-[14px] text-ink">{children}</code>
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-2xl bg-ink p-4 font-mono text-[13px] leading-relaxed text-signal">
      {children.trim()}
    </pre>
  )
}

const TOOLS = [
  {
    eyebrow: "Framework et hébergement",
    name: "Next.js + Vercel",
    tagline: "129 pages de villes. Chargement rapide. Zéro serveur à gérer.",
    body: (
      <>
        La clé, c&apos;est l&apos;<strong>ISR (Incremental Static Regeneration)</strong>. Les pages de villes sont générées à l&apos;avance et rafraîchies automatiquement. La dernière ville chargée est aussi rapide que la première, sans payer un serveur allumé en permanence. Les tâches planifiées de l&apos;email quotidien sont natives dans Vercel : une ligne de configuration.
      </>
    ),
    code: `// Regénération automatique
export const revalidate = 3600

// Email quotidien via cron Vercel — vercel.json
{ "crons": [{ "path": "/api/cron/daily-email", "schedule": "0 7 * * *" }] }`,
  },
  {
    eyebrow: "Météo et données historiques",
    name: "Open-Meteo",
    tagline: "Gratuit. Sans clé API. Qualité professionnelle.",
    body: (
      <>
        La révélation du projet. Open-Meteo est une API météo open source qui donne accès aux modèles ECMWF et Météo-France, mais surtout aux <strong>archives ERA5 depuis 1940</strong> : de quoi calculer les normales sur 30 ans et repérer les écarts du jour. Jusqu&apos;à 10 000 requêtes gratuites par jour, avec plusieurs villes par requête.
      </>
    ),
    code: `// Plusieurs villes en une requête
const url = \`https://api.open-meteo.com/v1/forecast
  ?latitude=\${lats}&longitude=\${lons}
  &daily=apparent_temperature_max
  &forecast_days=1\`

// Normales : archive ERA5, 1991-2020
const archive = \`https://archive-api.open-meteo.com/v1/archive
  ?latitude=\${lat}&longitude=\${lon}
  &daily=apparent_temperature_max
  &start_date=1991-01-01&end_date=2024-12-31\``,
  },
  {
    eyebrow: "Incendies en temps réel",
    name: "NASA FIRMS",
    tagline: "Détections satellite VIIRS, mises à jour en continu.",
    body: (
      <>
        Pour la carte des feux, la NASA met à disposition ses données satellite VIIRS gratuitement, avec une clé obtenue en 30 secondes. Les détections arrivent en CSV avec latitude, longitude et puissance radiative, puis deviennent une carte avec Leaflet. Quelques lignes de code pour s&apos;appuyer sur l&apos;infrastructure spatiale de la NASA.
      </>
    ),
    code: `const url = \`https://firms.modaps.eosdis.nasa.gov/api/area/csv/
  \${process.env.NASA_FIRMS_KEY}/VIIRS_SNPP_NRT/world/1\``,
  },
  {
    eyebrow: "Projections climatiques",
    name: "ERA5 + GIEC CMIP6",
    tagline: "Pré-calculés, embarqués dans le site, zéro appel à l'affichage.",
    body: (
      <>
        Les normales (1991-2020) et les projections 2030-2050 sont pré-calculées par un script et stockées en JSON dans le projet. Pas d&apos;API à appeler, pas de latence, pas de dépendance externe à l&apos;affichage. Un seul travail en amont, et le résultat tient dans quelques dizaines de kilo-octets.
      </>
    ),
    code: "",
  },
]

const COSTS = [
  { composant: "Hébergement + tâches planifiées", service: "Vercel Hobby", cost: "Gratuit" },
  { composant: "Météo du jour + archive ERA5", service: "Open-Meteo", cost: "Gratuit" },
  { composant: "Détections satellite des incendies", service: "NASA FIRMS", cost: "Gratuit" },
  { composant: "Base de données Postgres", service: "Neon (offre gratuite)", cost: "Gratuit" },
  { composant: "Emails (moins de 3 000 par mois)", service: "Resend", cost: "Gratuit" },
  { composant: "Nom de domaine", service: "OVH", cost: "~10 €/an" },
]

const RETRO = [
  {
    title: "Générer les normales climatiques à la volée",
    body: "Elles sont embarquées en JSON statique. Ça marche, mais ajouter une ville demande de relancer un script à la main. Une génération automatique depuis l'archive Open-Meteo aurait été plus propre dès le début.",
  },
  {
    title: "Séparer les lots France et monde",
    body: "62 villes françaises et 67 villes du monde dans une seule requête Open-Meteo : techniquement possible, mais fragile. Une API qui ne répond pas et c'est toute la page qui tombe. Deux requêtes distinctes, deux points de défaillance isolés.",
  },
  {
    title: "Prévoir plusieurs villes par abonné dès le départ",
    body: "Le modèle de départ : un abonné = une ville. Passer à une table d'abonnements séparée, pour suivre plusieurs villes, a coûté plusieurs heures de migration et de réécriture. Le vrai coût d'une mauvaise intuition initiale.",
  },
]

export default function BackstagePage() {
  return (
    <PageShell crumbs={[{ label: "Backstage" }]}>
      <div className="flex flex-col gap-16">
        <header className="flex max-w-4xl flex-col gap-5 pt-2 sm:pt-6">
          <Eyebrow>Backstage</Eyebrow>
          <Title as="h1" size="hero" animate>
            Les coulisses d&apos;un site <Hl tone="chaud">sur le climat</Hl>.
          </Title>
          <p className="max-w-2xl text-[18px] leading-snug text-ink-soft">
            Cartes interactives, données satellite, email quotidien personnalisé, projections du GIEC à l&apos;échelle locale. Un développeur, un week-end de départ, des API gratuites. Coût total : moins de 10 € par an.
          </p>
          <p className="w-fit rounded-full bg-signal px-5 py-2 font-display text-lg font-extrabold">Tout le monde peut le faire. Il faut juste l&apos;idée.</p>
        </header>

        <Section eyebrow="Le point de départ" title={<>Les données existent. <Hl>L&apos;interface, non.</Hl></>}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col gap-3 text-[16px] leading-relaxed text-ink-soft">
              <p>ERA5, CMIP6, NASA FIRMS, Copernicus : des décennies de données climatiques libres, gratuites, de qualité scientifique. Inaccessibles au commun des mortels, parce que personne n&apos;a fait la traduction.</p>
              <p>Quelqu&apos;un qui se demande <em>« est-ce que les étés à Lyon sont plus chauds qu&apos;avant ? »</em> ne va pas télécharger un fichier NetCDF de 2 Go sur le site de Copernicus. cestchaud.fr fait ce pont-là.</p>
            </Card>
            <Card tone="ink" className="flex flex-col justify-between gap-6">
              <blockquote className="font-display text-2xl font-extrabold leading-snug">
                « La technique est accessible à n&apos;importe quel développeur web. C&apos;est une question d&apos;idée, pas de moyens. »
              </blockquote>
              <p className="text-[14px] text-paper/75">Florent Bertiaux · cestchaud.fr</p>
            </Card>
          </div>
        </Section>

        <Section eyebrow="Les outils" title={<>Quatre briques, <Hl>toutes ouvertes</Hl>.</>}>
          <div className="flex flex-col gap-4">
            {TOOLS.map((t, i) => (
              <Card key={t.name} tone={i % 2 === 0 ? "white" : "paper"} className="flex flex-col gap-2">
                <Eyebrow>{t.eyebrow}</Eyebrow>
                <h3 className="font-display text-2xl font-extrabold">{t.name}</h3>
                <p className="font-display text-[17px] font-bold text-ink-soft">{t.tagline}</p>
                <p className="text-[16px] leading-relaxed text-ink-soft [&_strong]:text-ink">{t.body}</p>
                {t.code && <CodeBlock>{t.code}</CodeBlock>}
              </Card>
            ))}
          </div>
        </Section>

        <Section eyebrow="Les services" title={<>Une base, <Hl>un facteur</Hl>.</>}>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col gap-2">
              <Eyebrow>Base de données</Eyebrow>
              <h3 className="font-display text-xl font-extrabold">Neon · Postgres serverless</h3>
              <p className="text-[16px] leading-relaxed text-ink-soft">
                Abonnés, villes suivies, jetons de confirmation. Offre gratuite généreuse, compatible avec les fonctions serverless sans pool de connexions à gérer. Un piège classique : le client doit s&apos;initialiser à la demande, pas au chargement du module, sinon la compilation Next.js échoue.
              </p>
              <CodeBlock>{`// Initialisation paresseuse : seulement à l'exécution
let _sql = null
export function getSql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!)
  return _sql
}`}</CodeBlock>
            </Card>
            <Card className="flex flex-col gap-2">
              <Eyebrow>Email</Eyebrow>
              <h3 className="font-display text-xl font-extrabold">Resend · 3 000 emails par mois</h3>
              <p className="text-[16px] leading-relaxed text-ink-soft">
                API propre, SDK TypeScript bien typé. Les briefings partent par lots de 100 via <Code>resend.batch.send()</Code>. Parcours complet : inscription, double confirmation, briefings quotidiens, désabonnement depuis chaque email, par ville ou total. Le tout dans l&apos;offre gratuite.
              </p>
            </Card>
          </div>
        </Section>

        <Section eyebrow="Ce que ça coûte" title={<><Hl tone="chaud">10 €</Hl> par an.</>} intro="Le prix d'un bon café. Pour un service de données climatiques.">
          <Card tone="ink" className="p-2 sm:p-4">
            <ul className="divide-y divide-paper/15">
              {COSTS.map((c) => (
                <li key={c.composant} className="flex items-center justify-between gap-4 px-3 py-3">
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold">{c.composant}</span>
                    <span className="block text-[14px] text-paper/70">{c.service}</span>
                  </span>
                  <span className={`shrink-0 font-display text-[16px] font-extrabold ${c.cost === "Gratuit" ? "text-paper" : "text-signal"}`}>{c.cost}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>

        <Section eyebrow="Rétrospective honnête" title={<>Trois décisions <Hl>à reprendre</Hl> dès le départ.</>}>
          <ol className="grid gap-4 md:grid-cols-3">
            {RETRO.map((r, i) => (
              <Card as="li" key={r.title} className="flex flex-col gap-2">
                <span className="font-display text-5xl font-extrabold leading-none text-chaud" aria-hidden="true">{i + 1}</span>
                <h3 className="font-display text-xl font-extrabold">{r.title}</h3>
                <p className="text-[16px] leading-relaxed text-ink-soft">{r.body}</p>
              </Card>
            ))}
          </ol>
        </Section>

        <Section eyebrow="Responsabilités" title={<>RGPD : une contrainte <Hl>qui force la clarté</Hl>.</>}>
          <Card className="flex flex-col gap-3 text-[16px] leading-relaxed text-ink-soft">
            <p>
              Collecter des adresses email impose de bien faire les choses : confirmation par lien avant tout envoi, désabonnement depuis chaque email, export et suppression du compte en un clic depuis le profil. La conformité n&apos;est pas un obstacle, c&apos;est une contrainte de conception.
            </p>
            <Link href="/confidentialite" className="w-fit font-semibold text-ink underline underline-offset-2">Politique de confidentialité</Link>
          </Card>
        </Section>

        <Card tone="ink" className="flex flex-col gap-4 p-6 sm:p-10">
          <Eyebrow className="text-paper/70">La leçon</Eyebrow>
          <Title size="xl" className="text-paper">Les données publiques sont une mine. <span className="text-signal">Le manque, c&apos;est l&apos;interface.</span></Title>
          <p className="max-w-3xl text-[17px] leading-relaxed text-paper/85">
            L&apos;enjeu de ce genre de projet n&apos;est pas technique. Il est éditorial : transformer des données brutes en quelque chose qu&apos;on lit dans son email le matin, qu&apos;on comprend en dix secondes, et qui aide à mieux décider.
          </p>
          <p className="max-w-3xl text-[17px] leading-relaxed text-paper/85">
            La technique, n&apos;importe quel développeur web peut la maîtriser en un week-end. Ce qui est rare, c&apos;est l&apos;idée de faire le pont, et la volonté de le faire simplement.
          </p>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[14px] text-mute">Open-Meteo · ERA5 · CMIP6 · NASA FIRMS · Neon · Resend · Vercel</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/a-propos" variant="ghost">La méthode</ButtonLink>
            <ButtonLink href="/notifications" variant="chaud" className="group">Recevoir le briefing <Arrow /></ButtonLink>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
