import type { Metadata } from "next"
import Link from "next/link"
import * as fs from "fs"
import * as path from "path"
import PageShell from "@/components/ui/PageShell"
import Section from "@/components/ui/Section"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Card from "@/components/ui/Card"
import Eyebrow from "@/components/ui/Eyebrow"
import AnomalyChip from "@/components/ui/AnomalyChip"
import { ButtonLink, Arrow } from "@/components/ui/Button"
import BeforeAfterSlider from "@/components/BeforeAfterSlider"
import { loadClimateFull } from "@/lib/climate-season"
import { getWeatherData } from "@/lib/weather-data"
import { hasLiveData } from "@/lib/city-page"
import { fmt } from "@/lib/format"
import { slugify } from "@/lib/slugify"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Terrain · Ce que le satellite confirme · cestchaud.fr",
  description: "Images satellite avant/après : ce que le réchauffement change déjà sur le terrain en France.",
  alternates: { canonical: "https://www.cestchaud.fr/terrain" },
  openGraph: {
    title: "Terrain · Ce que le satellite confirme · cestchaud.fr",
    description: "Images satellite avant/après : ce que le réchauffement change déjà sur le terrain en France.",
    url: "https://www.cestchaud.fr/terrain",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
}

type Manifest = Record<string, { before: boolean; after: boolean; beforeDate?: string; afterDate?: string }>

function loadManifest(): Manifest {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/satellite/manifest.json"), "utf8"))
  } catch {
    return {}
  }
}

interface Zone {
  tag: string
  theme: string
  title: string
  body: string
  /** chiffre d'introduction (cité seulement si le site est présent dans le manifeste) */
  headline: { text: string; label: string }
  stats: { val: string; label: string }[]
  region: { slug: string; label: string; cities: string[] }
}

const ZONES: Record<string, Zone> = {
  landes: {
    tag: "Gironde · Incendies 2022",
    theme: "forêts brûlées",
    title: "60 000 hectares en cendres",
    body: "L'été 2022 a été le plus chaud jamais enregistré en France. En Gironde, deux incendies successifs ont consumé des dizaines de milliers d'hectares de forêt de pins. La vague de chaleur exceptionnelle (Bordeaux a affiché +8 °C par rapport à sa normale) combinée à une sécheresse record a créé des conditions de combustion inédites depuis 1949. Les cicatrices sont encore visibles depuis l'espace.",
    headline: { text: "60 000 ha", label: "brûlés en Gironde en 2022" },
    stats: [
      { val: "60 000", label: "hectares brûlés" },
      { val: "+8 °C", label: "écart à la normale à Bordeaux, été 2022" },
      { val: "2", label: "incendies distincts" },
    ],
    region: { slug: "nouvelle-aquitaine", label: "Nouvelle-Aquitaine", cities: ["bordeaux", "bayonne", "pau"] },
  },
  montbel: {
    tag: "Ariège · Sécheresse 2022",
    theme: "lacs asséchés",
    title: "Le lac de Montbel à sec",
    body: "Le lac de Montbel, réservoir de l'Ariège, a atteint en 2022 son niveau le plus bas depuis sa création. La sécheresse historique de cet été a réduit sa superficie de moitié : les berges argileuses habituellement immergées sont apparues à nu. Construit pour sécuriser l'eau, il montre que les infrastructures pensées pour le climat du XXe siècle ne suffisent plus.",
    headline: { text: "−50 %", label: "de surface pour le lac de Montbel, août 2022" },
    stats: [
      { val: "−50 %", label: "de superficie en août 2022" },
      { val: "100 000", label: "habitants dépendants de ce réservoir" },
      { val: "2022", label: "niveau le plus bas depuis la création du lac" },
    ],
    region: { slug: "occitanie", label: "Occitanie", cities: ["toulouse", "montpellier", "nimes"] },
  },
  camargue: {
    tag: "Bouches-du-Rhône · Assèchement",
    theme: "zones humides qui reculent",
    title: "La Camargue se dessèche",
    body: "La Camargue, plus grand delta d'Europe occidentale, subit un assèchement accéléré par des étés de plus en plus chauds. Entre 2016 et 2022, les étangs temporaires ont reculé et les roselières se sont réduites, au détriment des flamants roses et des oiseaux migrateurs. La hausse du niveau de la mer aggrave l'intrusion d'eau salée dans les marais d'eau douce.",
    headline: { text: "400", label: "espèces d'oiseaux en Camargue, menacées par l'assèchement" },
    stats: [
      { val: "+1,5 °C", label: "réchauffement local depuis 1950" },
      { val: "400", label: "espèces d'oiseaux recensées" },
      { val: "2050", label: "submersion partielle possible dans le scénario le plus émetteur" },
    ],
    region: { slug: "provence-alpes-cote-d-azur", label: "Provence-Alpes-Côte d'Azur", cities: ["marseille", "avignon", "toulon"] },
  },
  "serre-poncon": {
    tag: "Hautes-Alpes · Sécheresse 2022",
    theme: "lacs asséchés",
    title: "30 mètres d'eau disparus",
    body: "Serre-Ponçon est l'un des plus grands lacs artificiels de France. En 2022, son niveau a chuté d'une trentaine de mètres sous l'effet d'une sécheresse historique : une « marque de baignoire » visible depuis l'espace, et la preuve de la dépendance aux précipitations neigeuses, elles-mêmes en baisse.",
    headline: { text: "−30 m", label: "de niveau à Serre-Ponçon en 2022" },
    stats: [
      { val: "−30 m", label: "chute du niveau d'eau" },
      { val: "180", label: "millions de m³ manquants" },
      { val: "600 000", label: "habitants dépendants" },
    ],
    region: { slug: "provence-alpes-cote-d-azur", label: "Provence-Alpes-Côte d'Azur", cities: ["marseille", "avignon", "toulon"] },
  },
  "mer-de-glace": {
    tag: "Chamonix · Recul glaciaire",
    theme: "glaciers en recul",
    title: "Le glacier qui rétrécit à vue d'œil",
    body: "La Mer de Glace, plus grand glacier de France, a perdu plus de 150 mètres d'épaisseur depuis le milieu du XIXe siècle. Sur les images Sentinel-2, le recul se mesure en quelques années : la langue glaciaire se rétracte, la roche nue prend la place de la glace.",
    headline: { text: "−150 m", label: "d'épaisseur pour la Mer de Glace depuis 1850" },
    stats: [
      { val: "−150 m", label: "d'épaisseur depuis 1850" },
      { val: "+2 °C", label: "réchauffement alpin moyen" },
      { val: "2100", label: "disparition probable dans le scénario le plus émetteur" },
    ],
    region: { slug: "auvergne-rhone-alpes", label: "Auvergne-Rhône-Alpes", cities: ["lyon", "grenoble", "chamonix"] },
  },
  loire: {
    tag: "Nièvre · Étiage 2022",
    theme: "fleuves à l'étiage",
    title: "Un fleuve devenu banc de sable",
    body: "En août 2022, la Loire a atteint des débits parmi les plus bas jamais mesurés. À Nevers, Blois, Tours, des bancs de sable s'étiraient sur toute la largeur du lit. Le fleuve dépend des précipitations, de la fonte des neiges et de l'évaporation, trois facteurs dégradés en même temps par les vagues de chaleur.",
    headline: { text: "−80 %", label: "de débit pour la Loire à l'étiage 2022" },
    stats: [
      { val: "−80 %", label: "débit par rapport à la normale, étiage 2022" },
      { val: "3", label: "étés records (2019, 2020, 2022)" },
      { val: "11", label: "départements en restriction d'eau cet été-là" },
    ],
    region: { slug: "centre-val-de-loire", label: "Centre-Val de Loire", cities: ["tours", "orleans", "chartres"] },
  },
}

const URBAN = {
  title: "La même ville, le même jour : 8 °C d'écart.",
  body: "Un parc arboré et un quartier en béton voisins peuvent afficher jusqu'à 8 °C d'écart de température de surface le même après-midi d'été. C'est l'îlot de chaleur urbain : il explique une partie de l'écart entre la température officielle (mesurée sous abri, souvent en périphérie) et le ressenti en ville.",
  points: [
    "Un arbre adulte rafraîchit son voisinage par évapotranspiration, l'équivalent de plusieurs climatiseurs.",
    "L'asphalte peut dépasser 60 °C en surface lors d'une canicule, quand le sol reste vers 30 °C sous les arbres.",
    "Paris intra-muros est en moyenne plus chaud de quelques degrés que sa couronne verte, surtout la nuit.",
    "Les nuits tropicales (20 °C ou plus) sont nettement plus fréquentes dans les quartiers denses.",
  ],
}

function monthYear(s?: string) {
  if (!s) return null
  const [y, m] = s.split("-").map(Number)
  if (!y || !m) return s
  return new Date(y, m - 1, 15).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
}

export default async function TerrainPage() {
  const manifest = loadManifest()
  const full = loadClimateFull()
  const { citiesFR, fetchedAt } = await getWeatherData()
  const live = hasLiveData(citiesFR)
  const month = (live ? new Date(fetchedAt) : new Date()).getMonth()

  const available = Object.keys(ZONES).filter((id) => manifest[id]?.before && manifest[id]?.after)
  const hasUrban = manifest["paris-bois"]?.before && manifest["paris-dalle"]?.before
  const themes = [...new Set(available.map((id) => ZONES[id].theme))]

  return (
    <PageShell crumbs={[{ label: "Terrain" }]}>
      <div className="flex flex-col gap-16 sm:gap-20">
        <header className="flex flex-col gap-6 pt-4 sm:pt-8">
          <Eyebrow>Images satellite · avant / après</Eyebrow>
          <Title as="h1" size="hero" animate className="max-w-5xl">
            Ce que les chiffres annoncent, <Hl tone="chaud">le satellite le montre</Hl>.
          </Title>
          <p className="max-w-[62ch] text-[17px] leading-relaxed text-ink-soft">
            {themes.length > 0
              ? <>{themes.join(", ").replace(/^./, (m) => m.toUpperCase())} : ces images avant/après montrent ce que les données ERA5 et les projections du GIEC décrivent en degrés.</>
              : "Ces images avant/après montrent ce que les données ERA5 et les projections du GIEC décrivent en degrés."}
          </p>
          {available.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-3" data-anim="stagger">
              {available.map((id) => {
                const h = ZONES[id].headline
                return (
                  <li key={id}>
                    <Card tone="ink" className="flex h-full flex-col gap-2">
                      <span className="font-display text-[clamp(2.2rem,6vw,3.2rem)] font-extrabold leading-none text-signal">
                        {h.text}
                      </span>
                      <span className="text-[15px] text-paper/85">{h.label}</span>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </header>

        {available.length === 0 && (
          <Card tone="paper" className="flex flex-col items-start gap-3">
            <p className="font-display text-xl font-extrabold">Les images satellite arrivent bientôt.</p>
            <p className="text-[15px] text-ink-soft">En attendant, les chiffres de chaque ville (écart du jour, tendance, projections) sont déjà consultables.</p>
            <ButtonLink href="/r" variant="ghost">Voir ma ville <Arrow /></ButtonLink>
          </Card>
        )}

        {available.map((id) => {
          const z = ZONES[id]
          const entry = manifest[id]
          const today = z.region.cities.map((cid) => {
            const w = live ? citiesFR.find((c) => c.id === cid) : undefined
            const normal = full[cid]?.normal?.[month]
            const name = citiesFR.find((c) => c.id === cid)?.name
            if (!name) return null
            const anomaly = w && normal != null ? Math.round((w.apparent_temp_max - normal) * 10) / 10 : null
            return { cid, name, temp: w?.apparent_temp_max ?? null, anomaly }
          }).filter((x): x is NonNullable<typeof x> => x != null)

          return (
            <Section key={id} id={id} eyebrow={z.tag} title={z.title} intro={z.body}>
              <BeforeAfterSlider
                before={`/satellite/${id}-before.jpg`}
                after={`/satellite/${id}-after.jpg`}
                labelBefore={monthYear(entry.beforeDate) ? `Avant · ${monthYear(entry.beforeDate)}` : "Avant"}
                labelAfter={monthYear(entry.afterDate) ? `Après · ${monthYear(entry.afterDate)}` : "Après"}
                alt={z.title}
              />
              <p className="text-[13px] text-mute">Glissez le volet (ou utilisez les flèches du clavier). Images Copernicus Sentinel-2.</p>
              <div className="grid gap-3 md:grid-cols-[1fr_20rem]">
                <dl className="grid grid-cols-3 gap-2 sm:gap-3">
                  {z.stats.map(({ val, label }) => (
                    <div key={label} className="rounded-2xl bg-white p-3 sm:p-4">
                      <dt className="sr-only">{label}</dt>
                      <dd className="font-display text-[1.3rem] sm:text-[1.8rem] font-extrabold leading-none tabular">{val}</dd>
                      <dd className="mt-1 text-[13px] sm:text-[14px] leading-snug text-ink-soft">{label}</dd>
                    </div>
                  ))}
                </dl>
                <Card tone="paper" className="flex flex-col gap-2">
                  <Eyebrow>Aujourd&apos;hui · {z.region.label}</Eyebrow>
                  {today.length > 0 && today.some((c) => c.anomaly != null) ? (
                    <ul className="flex flex-col">
                      {today.map((c) => (
                        <li key={c.cid}>
                          <Link href={`/a/${slugify(c.name)}`} className="flex min-h-11 items-center justify-between gap-2 border-b border-line text-[15px] font-semibold hover:underline">
                            <span>{c.name}{c.temp != null && <span className="font-normal text-mute"> · {fmt(c.temp, 0)}&#8239;°C</span>}</span>
                            {c.anomaly != null && <AnomalyChip value={c.anomaly} />}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[15px] text-ink-soft" role="status">Relevés du jour indisponibles.</p>
                  )}
                  <Link href={`/r/${z.region.slug}`} className="inline-flex min-h-11 items-center gap-1 font-display font-bold">Voir la région <Arrow /></Link>
                </Card>
              </div>
            </Section>
          )
        })}

        <Section id="ilot" eyebrow="Îlot de chaleur urbain" title={URBAN.title} intro={URBAN.body}>
          {hasUrban ? (
            <div className="grid gap-4 md:grid-cols-2">
              <figure className="flex flex-col gap-2">
                <img src="/satellite/paris-bois-before.jpg" alt="Paris, bois de Vincennes en fausses couleurs infrarouges" className="w-full rounded-2xl" />
                <figcaption className="text-[13px] text-mute">Canopée · bois de Vincennes</figcaption>
              </figure>
              <figure className="flex flex-col gap-2">
                <img src="/satellite/paris-dalle-before.jpg" alt="La Défense en fausses couleurs infrarouges" className="w-full rounded-2xl" />
                <figcaption className="text-[13px] text-mute">Béton · La Défense</figcaption>
              </figure>
              <p className="text-[13px] text-mute md:col-span-2">Fausses couleurs infrarouges (Sentinel-2) · rouge vif = végétation dense · gris-bleu = béton et asphalte.</p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {URBAN.points.map((pt) => (
                <li key={pt}><Card tone="white" className="h-full text-[16px] leading-relaxed">{pt}</Card></li>
              ))}
            </ul>
          )}
        </Section>

        <Card tone="ink" className="flex flex-col gap-4 p-6 sm:p-10">
          <Eyebrow className="text-paper/70">Et maintenant&#8239;?</Eyebrow>
          <p className="max-w-3xl font-display text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold leading-tight">
            Ces images ont un <Hl tone="signal">pendant chiffré</Hl>, ville par ville.
          </p>
          <p className="max-w-[62ch] text-[16px] text-paper/85">
            Sécheresse, chaleur, recul des glaces : c&apos;est le même réchauffement que mesurent les données ERA5 de chaque ville, sous une autre forme.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/r" variant="paper">Ma ville <Arrow /></ButtonLink>
            <ButtonLink href="/" variant="chaud">La carte du jour</ButtonLink>
          </div>
        </Card>
      </div>
    </PageShell>
  )
}
