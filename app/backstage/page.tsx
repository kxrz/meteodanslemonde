import Link from "next/link"
import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

export const revalidate = 604800

const BASE = "https://www.cestchaud.fr"
const TITLE = "Backstage · Comment cestchaud.fr a été construit"
const DESCRIPTION =
  "REX technique : APIs gratuites, stack Next.js, données climatiques open source, coût inférieur à 10 € par an. Tout le monde peut le faire."

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

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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

/* ── Composants de mise en page ─────────────────────────────────────────── */

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
    <pre className="bg-[#111111] text-orange-300 text-xs font-mono rounded-2xl p-4 overflow-x-auto leading-relaxed mt-3">
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
        <div className="max-w-4xl mx-auto px-5 py-16 lg:py-20">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-orange-400 mb-5">
            Backstage
          </p>
          <h1 className="text-4xl lg:text-5xl font-black leading-[1.08] tracking-tight mb-5 max-w-2xl"
            style={{ textWrap: "balance" } as React.CSSProperties}>
            Comment cestchaud.fr a été construit,{" "}
            <span className="text-orange-400">avec des APIs gratuites.</span>
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed max-w-xl">
            Un side project weekend devenu un service avec des cartes interactives,
            des données satellite, un email quotidien personnalisé et des projections
            GIEC à l'échelle locale. Coût mensuel d'infrastructure : moins de 10 €.
            APIs payantes : zéro.
          </p>
        </div>
      </section>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-5 py-12 w-full space-y-12">

        {/* Contexte */}
        <section>
          <SectionLabel>Contexte</SectionLabel>
          <div className="bg-white rounded-3xl p-6 lg:p-8">
            <h2 className="text-xl font-black text-neutral-900 mb-4">
              Né d'une frustration
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed mb-3">
              L'été 2022, la France brûlait. L'été 2023, rebelote. Impossible d'avoir
              accès aux <strong className="text-neutral-900">vrais chiffres</strong> pour
              sa ville : de combien la température a-t-elle augmenté depuis 30 ans ?
              Est-ce vraiment exceptionnel, ou c'est la nouvelle normale ?
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Les données climatiques publiques sont d'une richesse incroyable, quasi
              inconnue du grand public. ERA5, CMIP6, FIRMS, Copernicus — tout ça est
              libre, gratuit, et d'une qualité scientifique sérieuse. Le manque,
              c'est l'interface.
            </p>
          </div>
        </section>

        {/* Stack */}
        <section>
          <SectionLabel>Stack technique</SectionLabel>
          <div className="space-y-4">

            {/* Next.js */}
            <div className="bg-[#111111] text-white rounded-3xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <IconZap className="text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 mb-0.5">Hosting & framework</p>
                  <h3 className="text-base font-black text-white">Next.js App Router sur Vercel</h3>
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                Le choix central, c'est l'<strong className="text-white">ISR (Incremental Static Regeneration)</strong> :
                les pages de villes sont générées statiquement mais se rafraîchissent
                automatiquement toutes les heures. La 500e ville chargée est aussi rapide
                que la première, sans payer un serveur qui tourne en permanence.
              </p>
              <CodeBlock>{`// app/a/[slug]/page.tsx
export const revalidate = 3600 // regénère toutes les heures`}</CodeBlock>
              <p className="text-sm text-white/70 leading-relaxed mt-4 mb-3">
                Vercel gère aussi les <strong className="text-white">Cron Jobs</strong> nativement.
                Le briefing email part chaque matin via une route API protégée par un secret :
              </p>
              <CodeBlock>{`// vercel.json
{
  "crons": [{ "path": "/api/cron/daily-email", "schedule": "0 7 * * *" }]
}`}</CodeBlock>
            </div>

            {/* Open-Meteo */}
            <div className="bg-[#dbeafe] rounded-3xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-900/10 flex items-center justify-center">
                  <IconCloud className="text-blue-800" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/40 mb-0.5">Météo & archive</p>
                  <h3 className="text-base font-black text-blue-900">Open-Meteo</h3>
                </div>
              </div>
              <p className="text-sm text-blue-900/70 leading-relaxed mb-3">
                La vraie révélation du projet. API météo open source, entièrement gratuite,
                sans clé API, avec des données d'une qualité professionnelle :
              </p>
              <ul className="text-sm text-blue-900/70 leading-relaxed space-y-1.5 mb-4 ml-1">
                {[
                  "Prévisions en temps réel (modèles ECMWF, GFS, Météo-France)",
                  "Archive ERA5 depuis 1940 — calcul des normales climatiques sur 30 ans",
                  "Indice UTCI (température ressentie réelle, pas l'approximation vent + humidité)",
                  "Jusqu'à 10 000 requêtes par jour gratuitement, batch multi-villes en une seule requête",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5 shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
              <CodeBlock>{`// Batch de 10 villes en une requête
const url = \`https://api.open-meteo.com/v1/forecast
  ?latitude=\${lats}&longitude=\${lons}
  &daily=apparent_temperature_max,weathercode
  &forecast_days=1\`

// Données historiques pour les anomalies
const archive = \`https://archive-api.open-meteo.com/v1/archive
  ?latitude=\${lat}&longitude=\${lon}
  &daily=apparent_temperature_max
  &start_date=2024-06-01&end_date=2024-06-30\``}</CodeBlock>
            </div>

            {/* NASA FIRMS */}
            <div className="bg-[#431407] rounded-3xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <IconSatellite className="text-orange-300" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-200/40 mb-0.5">Incendies</p>
                  <h3 className="text-base font-black text-white">NASA FIRMS</h3>
                </div>
              </div>
              <p className="text-sm text-orange-100/70 leading-relaxed mb-4">
                Pour la carte des feux en temps réel,{" "}
                <strong className="text-white">NASA FIRMS</strong>{" "}
                (Fire Information for Resource Management System) fournit des détections
                satellite VIIRS mises à jour toutes les heures. Accès gratuit avec une
                clé API obtenue en quelques secondes. Les données reviennent en CSV,
                transformées en heatmap avec <strong className="text-white">Leaflet + leaflet.heat</strong>.
              </p>
              <CodeBlock>{`const url = \`https://firms.modaps.eosdis.nasa.gov/api/area/csv/
  \${process.env.NASA_FIRMS_KEY}/VIIRS_SNPP_NRT/world/1\``}</CodeBlock>
            </div>

            {/* ERA5 + CMIP6 */}
            <div className="bg-[#b8d4b0] rounded-3xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-green-900/10 flex items-center justify-center">
                  <IconTrend className="text-green-900" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-900/40 mb-0.5">Climatologie</p>
                  <h3 className="text-base font-black text-green-900">ERA5 + GIEC CMIP6</h3>
                </div>
              </div>
              <p className="text-sm text-green-900/70 leading-relaxed">
                Les normales de saison (référence 1981–2010) et les projections 2050 viennent
                de données pré-calculées stockées en JSON dans le projet. Le modèle CMIP6
                sous scénario <strong className="text-green-900">SSP2-4.5</strong> (trajectoire
                intermédiaire) donne une valeur de réchauffement supplémentaire par mois et
                par ville. Pas d'API ici : du post-traitement de données publiques
                Copernicus/IPCC transformées en fichiers légers embarqués dans le build.
              </p>
            </div>

          </div>
        </section>

        {/* Services tiers */}
        <section>
          <SectionLabel>Services tiers</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="bg-white rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <IconDatabase className="text-neutral-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-0.5">Base de données</p>
                  <h3 className="text-sm font-black text-neutral-900">Neon · Postgres serverless</h3>
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed mb-3">
                Pour les abonnés, villes et tokens de confirmation. Tier gratuit généreux,
                fonctionne directement dans les edge functions sans pool de connexions.
                Pattern lazy init pour éviter les crashs au build :
              </p>
              <pre className="bg-neutral-50 text-neutral-700 text-[11px] font-mono rounded-xl p-3 overflow-x-auto leading-relaxed">
{`let _sql = null
export function getSql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!)
  return _sql
}`}
              </pre>
            </div>

            <div className="bg-white rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <IconMail className="text-neutral-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-0.5">Emails transactionnels</p>
                  <h3 className="text-sm font-black text-neutral-900">Resend · 3 000 emails/mois gratuits</h3>
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                API propre, SDK TypeScript bien typé. Les briefings sont envoyés en batch
                de 100 via <Code>resend.batch.send()</Code>. Flow complet : inscription →
                confirmation (double opt-in RGPD) → briefings quotidiens. Désabonnement
                en un clic, depuis chaque email, par ville ou total.
              </p>
            </div>

          </div>
        </section>

        {/* Ce qui a pris plus de temps */}
        <section>
          <SectionLabel>Ce qui a pris plus de temps que prévu</SectionLabel>
          <div className="space-y-4">

            {[
              {
                icon: <IconTrend className="text-orange-500" />,
                title: "Les données d'anomalie",
                body: "La température ressentie (UTCI) n'est pas la même chose que la température de l'air. Et comparer à la \"normale\" demande de choisir une période de référence (1981–2010, standard OMM), de calculer par mois, et de distinguer normal vs anomalie de façon lisible. Beaucoup de travail éditorial autour des chiffres.",
              },
              {
                icon: <IconServer className="text-orange-500" />,
                title: "Leaflet en Next.js App Router",
                body: "Leaflet est pensé pour le DOM du navigateur. En App Router avec SSR, il faut charger la carte côté client uniquement, gérer les dimensions du conteneur (un conteneur à 0px de hauteur au moment du montage donne une heatmap invisible), et enchaîner les imports dans le bon ordre pour les plugins.",
                code: `// L doit être défini globalement avant le plugin
window.L = L
await import("leaflet.heat")`,
              },
              {
                icon: <IconZap className="text-orange-500" />,
                title: "Le build Next.js et les variables d'env",
                body: "Next.js évalue les modules à la compilation pour générer le sitemap et les metadata. Si votre DB est initialisée au niveau module avec throw new Error, le build échoue. Solution : lazy initialization.",
                code: `// ❌ Fail au build
const sql = neon(process.env.DATABASE_URL!)

// ✅ Lazy : ne lance qu'à l'exécution
let _sql = null
export function getSql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!)
  return _sql
}`,
              },
            ].map(({ icon, title, body, code }) => (
              <div key={title} className="bg-white rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <h3 className="text-sm font-black text-neutral-900">{title}</h3>
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
                {code && <CodeBlock>{code}</CodeBlock>}
              </div>
            ))}
          </div>
        </section>

        {/* Coûts */}
        <section>
          <SectionLabel>Coûts</SectionLabel>
          <div className="bg-[#111111] rounded-3xl p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <IconEuro className="text-orange-400" />
              </div>
              <h2 className="text-lg font-black text-white">Environ 10 € <span className="font-normal text-white/40">par an</span></h2>
            </div>
            <div className="space-y-2">
              {[
                { composant: "Hosting + Cron", service: "Vercel Hobby", cost: "Gratuit" },
                { composant: "Météo + Archive", service: "Open-Meteo", cost: "Gratuit" },
                { composant: "Incendies satellite", service: "NASA FIRMS", cost: "Gratuit" },
                { composant: "Base de données", service: "Neon (free tier)", cost: "Gratuit" },
                { composant: "Emails (< 3 000/mois)", service: "Resend", cost: "Gratuit" },
                { composant: "Domaine", service: "OVH", cost: "~10 €/an" },
              ].map(({ composant, service, cost }) => (
                <div key={composant} className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.06] last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{composant}</p>
                    <p className="text-xs text-white/40 mt-0.5">{service}</p>
                  </div>
                  <span className={`text-sm font-black shrink-0 ${cost === "Gratuit" ? "text-green-400" : "text-orange-400"}`}>
                    {cost}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ce qu'on aurait fait différemment */}
        <section>
          <SectionLabel>Rétrospective</SectionLabel>
          <div className="bg-white rounded-3xl p-6 lg:p-8">
            <h2 className="text-xl font-black text-neutral-900 mb-5">Ce que j'aurais fait différemment</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Générer les normales climatiques automatiquement",
                  body: "Plutôt que les embarquer en JSON statique. Ça rend l'ajout de nouvelles villes laborieux.",
                },
                {
                  title: "Ne pas mixer monde et France dans le même batch",
                  body: "500 villes françaises + 67 villes mondiales dans une seule requête Open-Meteo, c'est jouable mais fragile si l'API est lente.",
                },
                {
                  title: "Prévoir le multi-villes dès le début",
                  body: "Le schéma initial était un abonné = une ville. Migrer vers une table subscriptions séparée en cours de route a pris du temps.",
                },
              ].map(({ title, body }, i) => (
                <div key={title} className="flex gap-4">
                  <span className="text-3xl font-black text-orange-100 leading-none shrink-0 w-6 text-right">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-black text-neutral-900 mb-1">{title}</p>
                    <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leçon */}
        <section className="pb-4">
          <SectionLabel>Leçon principale</SectionLabel>
          <div className="bg-[#111111] rounded-3xl p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0 mt-1">
                <IconBulb className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-4 leading-tight"
                  style={{ textWrap: "balance" } as React.CSSProperties}>
                  La technique est accessible. L'enjeu, c'est la traduction.
                </h2>
                <p className="text-sm text-white/70 leading-relaxed mb-3">
                  Quelqu'un qui cherche "est-ce que les étés à Lyon sont plus chauds
                  qu'avant ?" ne va pas télécharger un fichier NetCDF de 2 Go depuis
                  le site de Copernicus.
                </p>
                <p className="text-sm text-white/70 leading-relaxed">
                  L'enjeu de ce genre de projet, c'est de transformer des données
                  brutes en quelque chose qu'un humain peut lire dans son email à 7h du
                  matin, comprendre en 10 secondes, et qui l'aide à prendre de
                  meilleures décisions. La technique est accessible à n'importe quel
                  développeur web. C'est vraiment juste une question d'idée.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="border-t border-black/[0.06] pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-neutral-900">cestchaud.fr</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Données ERA5 & GIEC CMIP6 · Open source APIs · Vercel
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/a-propos"
              className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
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
