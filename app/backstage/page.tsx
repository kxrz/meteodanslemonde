import Link from "next/link"
import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

export const revalidate = 604800

const BASE = "https://www.cestchaud.fr"
const TITLE = "Backstage · Les coulisses d'un site pédagogique sur le climat"
const DESCRIPTION =
  "Comment un développeur solo construit un service de données climatiques avec des APIs gratuites, pour moins de 10 € par an. Tout le monde peut le faire."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/backstage` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/backstage`,
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "article",
  },
}

/* ── SVG icons ─────────────────────────────────────────────────────────── */

function IconServer({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  )
}

function IconCloud({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  )
}

function IconDatabase({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function IconSatellite({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7 9 3 3 9l4 4" />
      <path d="m13 7 7 7-6 6-7-7" />
      <path d="m14.5 6.5 3-3" />
      <circle cx="19" cy="5" r="2" />
      <path d="M3 21h4" />
      <path d="M5 19v4" />
    </svg>
  )
}

function IconTrend({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

function IconZap({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconEuro({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12" />
      <path d="M4 14h9" />
      <path d="M19 6a7 7 0 1 0 0 12" />
    </svg>
  )
}

function IconBulb({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  )
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

/* ── Composants utilitaires ─────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-3">
      {children}
    </p>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-xs bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded font-mono">
      {children}
    </code>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-[#0d1117] text-orange-300 text-xs font-mono rounded-2xl p-4 overflow-x-auto leading-relaxed mt-3">
      {children.trim()}
    </pre>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function BackstagePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f4f0]">
      <SiteHeader asLink />

      {/* Hero */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-4xl mx-auto px-5 py-16 lg:py-24">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-orange-400 mb-6">
            Backstage
          </p>
          <h1
            className="text-4xl lg:text-[56px] font-black leading-[1.06] tracking-tight mb-6 max-w-3xl"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Les coulisses d&apos;un site pédagogique{" "}
            <span className="text-orange-400">sur le climat.</span>
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed max-w-xl mb-8">
            Cartes interactives, données satellite, email quotidien personnalisé, projections
            GIEC à l'échelle locale. Un développeur, un weekend de départ, des APIs gratuites.
            Coût total : moins de 10 € par an.
          </p>
          {/* Thèse en évidence */}
          <div className="inline-flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-5 py-3">
            <span className="text-2xl font-black text-orange-400">→</span>
            <p className="text-sm font-semibold text-orange-200">
              Tout le monde peut le faire. Il faut juste l'idée.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-12 w-full space-y-16">

        {/* Le vrai problème */}
        <section>
          <SectionLabel>Le point de départ</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 lg:p-8">
              <h2 className="text-xl font-black text-neutral-900 mb-4 leading-tight">
                Les données existent. L'interface, non.
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-3">
                ERA5, CMIP6, NASA FIRMS, Copernicus — des décennies de données climatiques
                libres, gratuites, de qualité scientifique sérieuse. Inaccessibles au
                commun des mortels parce que personne n'a fait la traduction.
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Quelqu'un qui cherche <em>"est-ce que les étés à Lyon sont plus chauds
                qu'avant ?"</em> ne va pas télécharger un fichier NetCDF de 2 Go depuis
                le site de Copernicus. cestchaud.fr fait ce pont-là.
              </p>
            </div>
            <div className="bg-[#111111] rounded-3xl p-6 lg:p-8 flex flex-col justify-between">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-4">
                Le vrai enjeu
              </p>
              <blockquote className="text-lg font-black text-white leading-snug mb-6">
                "La technique est accessible à n'importe quel développeur web.
                C'est une question d'idée, pas de moyens."
              </blockquote>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <p className="text-xs text-neutral-500">Florent Bertiaux · cestchaud.fr</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stack */}
        <section>
          <SectionLabel>Les outils</SectionLabel>
          <div className="space-y-4">

            {/* Next.js */}
            <div className="bg-[#111111] text-white rounded-3xl p-6 lg:p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <IconZap className="text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-1">
                    Framework & hosting
                  </p>
                  <h3 className="text-lg font-black text-white">Next.js + Vercel</h3>
                  <p className="text-sm text-white/50 mt-1">
                    500 pages de villes. Chargement instantané. Zéro serveur à gérer.
                  </p>
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                La clé, c'est l'<strong className="text-white">ISR — Incremental Static Regeneration</strong>.
                Les pages de villes sont générées statiquement et rafraîchies automatiquement
                toutes les heures. La 500e ville chargée est aussi rapide que la première,
                sans payer un serveur allumé en permanence. Les cron jobs pour l'email
                quotidien sont natifs dans Vercel : une ligne de config.
              </p>
              <CodeBlock>{`// Regénération automatique toutes les heures
export const revalidate = 3600

// Email quotidien via cron Vercel — vercel.json
{ "crons": [{ "path": "/api/cron/daily-email", "schedule": "0 7 * * *" }] }`}</CodeBlock>
            </div>

            {/* Open-Meteo */}
            <div className="bg-[#dbeafe] rounded-3xl p-6 lg:p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-900/10 flex items-center justify-center shrink-0 mt-0.5">
                  <IconCloud className="text-blue-800" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/40 mb-1">
                    Météo & données historiques
                  </p>
                  <h3 className="text-lg font-black text-blue-900">Open-Meteo</h3>
                  <p className="text-sm text-blue-900/50 mt-1">
                    Gratuit. Sans clé API. Qualité professionnelle.
                  </p>
                </div>
              </div>
              <p className="text-sm text-blue-900/70 leading-relaxed mb-4">
                La révélation du projet. Open-Meteo, c'est une API météo open source qui
                donne accès aux modèles ECMWF et Météo-France, mais surtout aux{" "}
                <strong className="text-blue-900">archives ERA5 depuis 1940</strong> — ce
                qui permet de calculer les normales climatiques sur 30 ans et de détecter
                les anomalies en temps réel. Jusqu'à 10 000 requêtes gratuites par jour,
                avec batch multi-villes en une seule requête.
              </p>
              <CodeBlock>{`// 10 villes en une requête, batch gratuit
const url = \`https://api.open-meteo.com/v1/forecast
  ?latitude=\${lats}&longitude=\${lons}
  &daily=apparent_temperature_max
  &forecast_days=1\`

// Anomalie : archive ERA5 pour calculer la normale du mois
const archive = \`https://archive-api.open-meteo.com/v1/archive
  ?latitude=\${lat}&longitude=\${lon}
  &daily=apparent_temperature_max
  &start_date=1991-06-01&end_date=2020-06-30\``}</CodeBlock>
            </div>

            {/* NASA FIRMS */}
            <div className="bg-[#431407] rounded-3xl p-6 lg:p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <IconSatellite className="text-orange-300" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-200/30 mb-1">
                    Incendies en temps réel
                  </p>
                  <h3 className="text-lg font-black text-white">NASA FIRMS</h3>
                  <p className="text-sm text-orange-200/50 mt-1">
                    Détections satellite VIIRS · mis à jour toutes les heures.
                  </p>
                </div>
              </div>
              <p className="text-sm text-orange-100/70 leading-relaxed mb-4">
                Pour la carte des feux, la NASA met à disposition ses données satellite
                VIIRS gratuitement, avec une clé obtenue en 30 secondes d'inscription.
                Les détections reviennent en CSV avec latitude, longitude et puissance
                radiative. Transformées en heatmap avec Leaflet côté client — quelques
                lignes de code pour un résultat qui s'appuie sur l'infrastructure spatiale
                de la NASA.
              </p>
              <CodeBlock>{`const url = \`https://firms.modaps.eosdis.nasa.gov/api/area/csv/
  \${process.env.NASA_FIRMS_KEY}/VIIRS_SNPP_NRT/world/1\``}</CodeBlock>
            </div>

            {/* ERA5 + CMIP6 embarqués */}
            <div className="bg-[#b8d4b0] rounded-3xl p-6 lg:p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-green-900/10 flex items-center justify-center shrink-0 mt-0.5">
                  <IconTrend className="text-green-900" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/40 mb-1">
                    Projections climatiques
                  </p>
                  <h3 className="text-lg font-black text-green-900">ERA5 + GIEC CMIP6</h3>
                  <p className="text-sm text-green-900/50 mt-1">
                    Données Copernicus · embarquées dans le build · zéro API.
                  </p>
                </div>
              </div>
              <p className="text-sm text-green-900/70 leading-relaxed">
                Les normales historiques (1981–2010) et les projections 2050 sous scénario{" "}
                <strong className="text-green-900">SSP2-4.5</strong> sont pré-calculées
                et stockées en JSON dans le projet. Pas d'API à appeler, pas de latence,
                pas de dépendance externe. Un seul travail éditorial en amont —
                post-traitement de données publiques Copernicus — et le résultat tient
                dans quelques kilooctets embarqués dans le build.
              </p>
            </div>

          </div>
        </section>

        {/* Services tiers */}
        <section>
          <SectionLabel>Les services</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <IconDatabase className="text-neutral-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-400">Base de données</p>
                  <h3 className="text-sm font-black text-neutral-900 mt-0.5">Neon · Postgres serverless</h3>
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                Abonnés, villes suivies, tokens de confirmation. Tier gratuit généreux,
                compatible edge functions sans pool de connexions à gérer. Un piège classique
                à éviter : le client doit s'initialiser à la demande, pas au chargement
                du module — sinon le build Next.js échoue.
              </p>
              <CodeBlock>{`// Lazy init : ne se lance qu'à l'exécution
let _sql = null
export function getSql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!)
  return _sql
}`}</CodeBlock>
            </div>

            <div className="bg-white rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <IconMail className="text-neutral-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-400">Email</p>
                  <h3 className="text-sm font-black text-neutral-900 mt-0.5">Resend · 3 000 emails/mois</h3>
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                API propre, SDK TypeScript bien typé. Les briefings partent en batch de
                100 via <Code>resend.batch.send()</Code>. Flow complet : inscription →
                double opt-in RGPD → confirmation → briefings quotidiens. Désabonnement
                en un clic depuis chaque email, par ville ou total. Tout ça dans le
                tier gratuit.
              </p>
            </div>
          </div>
        </section>

        {/* Ce que ça coûte */}
        <section>
          <SectionLabel>Ce que ça coûte</SectionLabel>
          <div className="bg-[#111111] rounded-3xl p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <IconEuro className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">10 € par an.</h2>
                <p className="text-sm text-white/40 mt-0.5">
                  Le prix d'un café de qualité. Pour un service de données climatiques.
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {[
                { composant: "Hosting + Cron jobs", service: "Vercel Hobby", cost: "Gratuit" },
                { composant: "Météo temps réel + Archive ERA5", service: "Open-Meteo", cost: "Gratuit" },
                { composant: "Détections satellite incendies", service: "NASA FIRMS", cost: "Gratuit" },
                { composant: "Base de données Postgres", service: "Neon (free tier)", cost: "Gratuit" },
                { composant: "Emails transactionnels (< 3 000/mois)", service: "Resend", cost: "Gratuit" },
                { composant: "Nom de domaine", service: "OVH", cost: "~10 €/an" },
              ].map(({ composant, service, cost }) => (
                <div key={composant}
                  className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.06] last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{composant}</p>
                    <p className="text-xs text-white/30 mt-0.5">{service}</p>
                  </div>
                  <span className={`text-sm font-black shrink-0 ${cost === "Gratuit" ? "text-green-400" : "text-orange-400"}`}>
                    {cost}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ce qu'on referait différemment */}
        <section>
          <SectionLabel>Rétrospective honnête</SectionLabel>
          <div className="bg-white rounded-3xl p-6 lg:p-8">
            <h2 className="text-xl font-black text-neutral-900 mb-6">
              Trois décisions à rependre dès le départ
            </h2>
            <div className="space-y-6">
              {[
                {
                  num: "1",
                  title: "Générer les normales climatiques à la volée",
                  body: "Elles sont actuellement embarquées en JSON statique. Ça marche, mais ajouter une nouvelle ville demande de relancer un script manuellement. Une génération automatique depuis Open-Meteo archive aurait été plus propre dès le début.",
                },
                {
                  num: "2",
                  title: "Séparer les batchs France et monde",
                  body: "500 villes françaises + 67 villes mondiales dans une seule requête Open-Meteo : techniquement possible, mais fragile. Une timeout de l'API et c'est la page entière qui plante. Deux requêtes distinctes, deux points de défaillance isolés.",
                },
                {
                  num: "3",
                  title: "Prévoir le multi-villes dès le schéma initial",
                  body: "Le modèle de départ : un abonné = une ville. Migrer vers une table subscriptions séparée — pour permettre de suivre plusieurs villes — a coûté plusieurs heures de migration et de réécriture. Un vrai coût d'une mauvaise intuition initiale.",
                },
              ].map(({ num, title, body }) => (
                <div key={num} className="flex gap-5">
                  <span className="text-4xl font-black text-orange-100 leading-none shrink-0 w-7 text-right tabular-nums">
                    {num}
                  </span>
                  <div>
                    <p className="text-sm font-black text-neutral-900 mb-1.5">{title}</p>
                    <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RGPD mention */}
        <section>
          <SectionLabel>Responsabilités</SectionLabel>
          <div className="bg-white rounded-3xl p-6 lg:p-8 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
              <IconLock className="text-neutral-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900 mb-2">
                RGPD, double opt-in, hébergement EU
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                La collecte d'adresses email implique de faire les choses correctement.
                Confirmation par lien avant tout envoi, désabonnement en un clic dans
                chaque email, données conservées uniquement le temps de l'abonnement,
                hébergement EU via Resend et Neon. La conformité n'est pas un obstacle —
                c'est une contrainte de design qui force la clarté.
              </p>
              <Link
                href="/confidentialite"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-700 mt-3 transition-colors"
              >
                Politique de confidentialité →
              </Link>
            </div>
          </div>
        </section>

        {/* Leçon */}
        <section>
          <SectionLabel>La leçon</SectionLabel>
          <div className="bg-[#111111] rounded-3xl p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0 mt-1">
                <IconBulb className="text-orange-400" />
              </div>
              <div>
                <h2
                  className="text-2xl font-black text-white mb-5 leading-tight"
                  style={{ textWrap: "balance" } as React.CSSProperties}
                >
                  Les données climatiques publiques sont une mine. Le manque,
                  c'est l'interface.
                </h2>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                  L'enjeu de ce genre de projet n'est pas technique. C'est éditorial :
                  transformer des données brutes en quelque chose qu'un humain peut lire
                  dans son email le matin, comprendre en dix secondes, et qui l'aide à
                  prendre de meilleures décisions.
                </p>
                <p className="text-sm text-white/60 leading-relaxed">
                  La technique, n'importe quel développeur web peut la maîtriser en un
                  weekend. Ce qui est rare, c'est l'idée de faire le pont. Et la volonté
                  de le faire simplement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA footer */}
        <div className="border-t border-black/[0.06] pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-sm font-black text-neutral-900">cestchaud.fr</p>
            <p className="text-xs text-neutral-400 mt-1">
              Open-Meteo · ERA5 · CMIP6 · NASA FIRMS · Neon · Resend · Vercel
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/a-propos"
              className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Méthodologie →
            </Link>
            <Link
              href="/notifications"
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
            >
              S'abonner au briefing
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

      </div>

      <div className="max-w-4xl mx-auto px-5 pb-8 w-full">
        <PageFooter />
      </div>
    </div>
  )
}
