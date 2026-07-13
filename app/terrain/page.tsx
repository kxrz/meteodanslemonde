import { Metadata } from "next"
import Link from "next/link"
import * as fs from "fs"
import * as path from "path"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"
import BeforeAfterSlider from "@/components/BeforeAfterSlider"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Terrain — Ce que le satellite confirme · cestchaud.fr",
  description: "Incendies, lacs asséchés, glaciers en recul, fleuves à l'étiage et îlots de chaleur urbains : les preuves visuelles du réchauffement en France.",
  alternates: { canonical: "https://www.cestchaud.fr/terrain" },
  openGraph: {
    title: "Terrain — Ce que le satellite confirme · cestchaud.fr",
    description: "Images satellite avant/après : incendies, sécheresse, glaciers et chaleur urbaine en France.",
    url: "https://www.cestchaud.fr/terrain",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
}

type Manifest = Record<string, {
  before: boolean
  after: boolean
  beforeDate?: string
  afterDate?: string
  label: string
}>

function loadManifest(): Manifest {
  try {
    const p = path.join(process.cwd(), "public/satellite/manifest.json")
    return JSON.parse(fs.readFileSync(p, "utf8"))
  } catch { return {} }
}

const ZONE_CONTENT = {
  landes: {
    tag: "Gironde · Incendies 2022",
    title: "60 000 hectares en cendres",
    body: `L'été 2022 a été le plus chaud jamais enregistré en France. Dans les Landes, deux incendies successifs ont consumé 60 000 hectares de forêt de pins, soit la surface de Paris et sa petite couronne réunies. La vague de chaleur exceptionnelle (Bordeaux a affiché +8°C vs sa normale) combinée à une sécheresse record a créé des conditions de combustion inédites depuis 1949. Les cicatrices sont encore visibles depuis l'espace.`,
    stats: [
      { val: "60 000", label: "hectares brûlés" },
      { val: "+8°C", label: "anomalie Bordeaux été 2022" },
      { val: "2", label: "incendies distincts" },
    ],
    link: { href: "/a/bordeaux", label: "Données climatiques de Bordeaux" },
  },
  montbel: {
    tag: "Ariège · Sécheresse 2022",
    title: "Le lac de Montbel à sec",
    body: `Le lac de Montbel, réservoir artificiel de l'Ariège qui alimente en eau potable plus de 100 000 habitants, a atteint en 2022 son niveau le plus bas depuis sa création. La sécheresse historique de cet été a réduit sa superficie de moitié : les berges argileuses habituellement immergées sont apparues à nu, révélant une vaste étendue de boue craquelée. Ce lac est un cas d'école : construit précisément pour sécuriser l'approvisionnement en eau, il illustre que les infrastructures conçues pour le climat du XXe siècle ne suffisent plus.`,
    stats: [
      { val: "-50%", label: "de superficie en août 2022" },
      { val: "100 000", label: "habitants dépendants de ce réservoir" },
      { val: "2022", label: "niveau le plus bas depuis la création du lac" },
    ],
    link: { href: "/a/toulouse", label: "Données climatiques de Toulouse" },
  },
  camargue: {
    tag: "Bouches-du-Rhône · Assèchement",
    title: "La Camargue se dessèche",
    body: `La Camargue, plus grand delta d'Europe occidentale et réserve de biosphère UNESCO, subit un assèchement progressif accéléré par les étés de plus en plus chauds. Entre 2016 et 2022, les étangs temporaires ont reculé, les roselières se sont réduites et les zones humides vitales pour les flamants roses et les oiseaux migrateurs ont perdu en superficie. La hausse du niveau de la mer aggrave par ailleurs l'intrusion saline, menaçant les marais d'eau douce qui font l'identité de ce territoire.`,
    stats: [
      { val: "+1.5°C", label: "réchauffement local depuis 1950" },
      { val: "400", label: "espèces d'oiseaux recensées, menacées par l'assèchement" },
      { val: "2050", label: "scénario de submersion partielle si RCP8.5" },
    ],
    link: { href: "/a/arles", label: "Données climatiques d'Arles" },
  },
  "serre-poncon": {
    tag: "Hautes-Alpes · Sécheresse 2022",
    title: "30 mètres d'eau disparus",
    body: `Serre-Ponçon est le plus grand lac artificiel de France. En 2022, son niveau a chuté de 30 mètres sous l'effet d'une sécheresse historique : les berges argileuses, d'habitude immergées, sont apparues comme une "marque de baignoire" visible depuis l'espace. Sa vidange partielle a révélé l'ampleur de la dépendance aux précipitations neigeuses, elles-mêmes en forte baisse.`,
    stats: [
      { val: "-30m", label: "chute du niveau d'eau" },
      { val: "180", label: "millions de m³ manquants" },
      { val: "600 000", label: "habitants dépendants" },
    ],
    link: { href: "/a/gap", label: "Données climatiques de Gap" },
  },
  "mer-de-glace": {
    tag: "Chamonix · Recul glaciaire",
    title: "Le glacier qui rétrécit à vue d'oeil",
    body: `La Mer de Glace, plus grand glacier de France, a perdu plus de 150 mètres d'épaisseur depuis le début du XXe siècle. Entre 2016 et aujourd'hui, le recul est mesurable en quelques années sur Sentinel-2 : la langue glaciaire se rétracte, les moraines latérales s'élargissent, la roche nue prend la place de la glace. Leur recul confirme une hausse de température moyenne de +2°C depuis 1850 dans les Alpes.`,
    stats: [
      { val: "-150m", label: "d'épaisseur depuis 1850" },
      { val: "+2°C", label: "réchauffement alpin moyen" },
      { val: "2100", label: "disparition probable si SSP5-8.5" },
    ],
    link: { href: "/a/chamonix", label: "Données climatiques de Chamonix" },
  },
  loire: {
    tag: "Nièvre · Étiage 2022",
    title: "Un fleuve devenu banc de sable",
    body: `En août 2022, la Loire a atteint son débit le plus bas jamais mesuré. À Nevers, Blois, Tours : des bancs de sable s'étiraient sur la largeur entière du lit, les îles se rejoignaient, on traversait à pied. Le fleuve royal est un révélateur sensible du réchauffement : il dépend des précipitations, de la fonte des neiges et de l'évaporation, tous trois dégradés simultanément par les vagues de chaleur à répétition.`,
    stats: [
      { val: "-80%", label: "débit vs normale à l'étiage 2022" },
      { val: "3", label: "étés records consécutifs (2019, 2020, 2022)" },
      { val: "11", label: "départements en restriction d'eau cet été-là" },
    ],
    link: { href: "/a/tours", label: "Données climatiques de Tours" },
  },
}

const URBAN_CONTENT = {
  title: "La même ville. Le même jour. 8°C d'écart.",
  body: `Un parc arboré et un quartier en béton voisins peuvent afficher jusqu'à 8°C d'écart de température de surface le même après-midi d'été. Ce phénomène (l'îlot de chaleur urbain) explique une partie de l'écart entre la température officielle (mesurée en abri météo, souvent en périphérie) et le ressenti réel en ville. Le satellite Sentinel-2 en fausses couleurs infrarouges rend visible cet écart : la végétation apparaît en rouge vif, le béton et l'asphalte en bleu-gris. Plus la surface est sombre et dense, plus elle absorbe et restitue la chaleur.`,
  points: [
    "Un arbre adulte refroidit l'équivalent de 10 climatiseurs par évapotranspiration",
    "L'asphalte peut atteindre 70°C en surface lors d'une canicule (vs 30°C sous les arbres)",
    "Paris intra-muros est en moyenne 2°C plus chaud que sa couronne verte",
    "Les nuits tropicales (>20°C) durent 3 fois plus longtemps dans les quartiers denses",
  ],
}

export default function TerrainPage() {
  const manifest = loadManifest()

  const zoneIds = ["landes", "montbel", "camargue", "serre-poncon", "mer-de-glace", "loire"] as const
  const availableZones = zoneIds.filter(
    (id) => manifest[id]?.before && manifest[id]?.after
  )

  const hasUrban = manifest["paris-bois"]?.before && manifest["paris-dalle"]?.before

  return (
    <div className="bg-[#f5f4f0] min-h-screen">
      <SiteHeader asLink subtitle="Ce que le satellite confirme." />
      <Breadcrumb crumbs={[{ label: "Terrain" }]} />

      {/* Hero */}
      <div className="bg-neutral-900 px-5 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/30 mb-4">Images satellite</p>
        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5 max-w-2xl">
          Ce que les chiffres<br />annoncent, les images<br />le confirment.
        </h1>
        <p className="text-white/50 text-base leading-relaxed max-w-xl mb-12">
          Incendies, lacs asséchés, glaciers en recul, fleuves à sec. Ces images satellite avant/après montrent ce que les données ERA5 et les projections GIEC 2050 décrivent en degrés.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl">
          {[
            { val: "60 000", unit: "ha", label: "brûlés dans les Landes" },
            { val: "−30", unit: "m", label: "lac de Serre-Ponçon 2022" },
            { val: "−150", unit: "m", label: "Mer de Glace depuis 1850" },
            { val: "−80", unit: "%", label: "débit Loire août 2022" },
          ].map(({ val, unit, label }) => (
            <div key={label}>
              <p className="text-3xl font-black text-red-400 leading-none">
                {val}<span className="text-xl">{unit}</span>
              </p>
              <p className="text-xs text-white/40 mt-1 leading-snug">{label}</p>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Zones avant/après */}
      <div className="max-w-3xl mx-auto px-5 py-14 space-y-20">

        {availableZones.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center">
            <p className="text-neutral-400 text-sm">Les images satellite sont en cours de génération.</p>
            <p className="text-neutral-300 text-xs mt-1">Lance <code>npm run fetch-satellite</code> puis commite <code>public/satellite/</code>.</p>
          </div>
        )}

        {availableZones.map((id) => {
          const content = ZONE_CONTENT[id]
          const entry = manifest[id]
          return (
            <section key={id} className="border-b border-neutral-200 pb-20 last:border-0">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-red-400 mb-3">{content.tag}</p>
              <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-4 leading-tight">{content.title}</h2>
              <p className="text-neutral-600 leading-relaxed text-base mb-8 max-w-2xl">{content.body}</p>

              <BeforeAfterSlider
                before={`/satellite/${id}-before.jpg`}
                after={`/satellite/${id}-after.jpg`}
                labelBefore={entry.beforeDate ? `Avant · ${entry.beforeDate}` : "Avant"}
                labelAfter={entry.afterDate ? `Après · ${entry.afterDate}` : "Après"}
                alt={content.title}
              />

              <div className="mt-6 flex flex-wrap gap-8">
                {content.stats.map(({ val, label }) => (
                  <div key={label} className="min-w-[80px]">
                    <p className="text-2xl font-black text-neutral-900 leading-none">{val}</p>
                    <p className="text-xs text-neutral-400 mt-1 leading-snug">{label}</p>
                  </div>
                ))}
                <div className="ml-auto flex items-end">
                  <Link
                    href={content.link.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors bg-white rounded-xl px-4 py-2 border border-neutral-200 hover:border-neutral-400"
                  >
                    {content.link.label} &rarr;
                  </Link>
                </div>
              </div>
            </section>
          )
        })}

        {/* Section îlot de chaleur */}
        <section>
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-500 mb-2">Îlot de chaleur urbain</p>
            <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-4">{URBAN_CONTENT.title}</h2>
            <p className="text-neutral-600 leading-relaxed text-base mb-6">{URBAN_CONTENT.body}</p>
          </div>

          {hasUrban ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Canopée · Bois de Vincennes</p>
                <img src="/satellite/paris-bois-before.jpg" alt="Paris, Bois de Vincennes en infrarouge" className="w-full rounded-2xl" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Béton · La Défense</p>
                <img src="/satellite/paris-dalle-before.jpg" alt="La Défense en infrarouge" className="w-full rounded-2xl" />
              </div>
              <p className="md:col-span-2 text-xs text-neutral-400 text-center">
                Fausses couleurs infrarouges (Sentinel-2) · Même période · Rouge vif = végétation dense · Gris-bleu = béton / asphalte
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8">
              <div className="flex flex-wrap gap-4">
                {URBAN_CONTENT.points.map((pt) => (
                  <div key={pt} className="flex gap-3 items-start w-full">
                    <span className="text-orange-400 font-black mt-0.5 shrink-0">·</span>
                    <p className="text-sm text-neutral-600 leading-relaxed">{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Conclusion / lien site */}
        <section className="bg-neutral-900 rounded-3xl p-8 md:p-10">
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-3">Et maintenant ?</p>
          <h2 className="text-2xl font-black text-white mb-4">Ces images ont un pendant chiffré.</h2>
          <p className="text-white/60 leading-relaxed mb-8">
            Chacun des phénomènes visibles ici (sécheresse, canicule, recul glaciaire) est mesuré dans les données ERA5 que le site affiche pour chaque ville. Le ressenti du jour, l'anomalie vs la normale, les projections GIEC 2030-2050 : c'est le même réchauffement, sous une autre forme.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/carte" className="bg-white text-neutral-900 font-semibold text-sm rounded-2xl px-5 py-3 hover:bg-neutral-100 transition-colors">
              Carte de chaleur &rarr;
            </Link>
            <Link href="/en/france" className="bg-white/10 text-white font-semibold text-sm rounded-2xl px-5 py-3 hover:bg-white/20 transition-colors">
              France en chiffres &rarr;
            </Link>
          </div>
        </section>

      </div>

      <PageFooter className="px-5" />
    </div>
  )
}
