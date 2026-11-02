import type { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import Section from "@/components/ui/Section"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Num from "@/components/ui/Num"
import Card from "@/components/ui/Card"
import Stat from "@/components/ui/Stat"
import Eyebrow from "@/components/ui/Eyebrow"
import Button, { ButtonLink, Arrow } from "@/components/ui/Button"
import AnomalyChip from "@/components/ui/AnomalyChip"
import ScaleLegend from "@/components/ui/ScaleLegend"
import Explain from "@/components/ui/Explain"
import Logo from "@/components/brand/Logo"
import Mark from "@/components/brand/Mark"
import MotionDemo from "@/components/brand/MotionDemo"
import LinerFrance from "@/components/brand/LinerFrance"
import DotWorld, { EURAFRICA_BOUNDS, makeProjection } from "@/components/brand/DotWorld"
import { project as projectFR } from "@/lib/france-shape"
import { ANOMALY_STEPS } from "@/lib/anomaly"
import { SLIDE_COUNT, SLIDE_FORMATS } from "@/lib/brand-slides"

export const metadata: Metadata = {
  title: "Marque · cestchaud.fr",
  description: "L'identité de cestchaud.fr : l'anneau de l'écart, les couleurs, la typographie, le ton, les composants et les fichiers à télécharger.",
  alternates: { canonical: "https://www.cestchaud.fr/brand" },
}

const COLORS = [
  { name: "Papier", token: "paper", hex: "#f5f4f0", role: "Le fond de toutes les pages. Chaud, calme, imprimable.", dark: false },
  { name: "Encre", token: "ink", hex: "#111111", role: "Texte, titres, blocs d'affirmation.", dark: true },
  { name: "Chaud", token: "chaud", hex: "#e3261b", role: "Au-dessus de la normale. Le soulignement d'origine du logo.", dark: true },
  { name: "Froid", token: "froid", hex: "#1d4ed8", role: "En dessous de la normale, et la saison froide.", dark: true },
  { name: "Signal", token: "signal", hex: "#ffe14d", role: "Ce qu'il faut voir en premier : idée reçue, mot clé.", dark: false },
  { name: "Gris lisible", token: "mute", hex: "#5f5e58", role: "Le gris le plus clair autorisé pour du texte (contraste ≥ 4,5:1).", dark: true },
]

const SLIDE_SETS = [
  { format: "16x9", title: "16:9", desc: "1920 × 1080 · présentation, écran, vidéo", w: SLIDE_FORMATS["16x9"].width, h: SLIDE_FORMATS["16x9"].height },
  { format: "linkedin", title: "LinkedIn 4:5", desc: "1080 × 1350 · carrousel LinkedIn (déposez le PDF), Instagram", w: SLIDE_FORMATS.linkedin.width, h: SLIDE_FORMATS.linkedin.height },
] as const

const FILES = [
  { file: "logo.svg", label: "Logotype couleur", bg: "bg-paper" },
  { file: "logo-paper.svg", label: "Logotype sur fond sombre", bg: "bg-ink" },
  { file: "logo-mono-ink.svg", label: "Logotype une couleur", bg: "bg-paper" },
  { file: "mark.svg", label: "Anneau couleur", bg: "bg-paper" },
  { file: "mark-app.svg", label: "Icône d'application", bg: "bg-paper-deep" },
  { file: "mark-mono-ink.svg", label: "Anneau encre", bg: "bg-paper" },
  { file: "mark-mono-paper.svg", label: "Anneau papier", bg: "bg-ink" },
]

export default function BrandPage() {
  return (
    <PageShell crumbs={[{ label: "Marque" }]}>
      <div className="flex flex-col gap-20">
        {/* ── Hero ── */}
        <header className="flex flex-col gap-8 pt-6">
          <Eyebrow>Identité · v2 · hiver 2026</Eyebrow>
          <Title as="h1" size="hero" animate className="max-w-5xl">
            Une marque qui <Hl tone="chaud">prend position</Hl>. Chiffres à l&apos;appui.
          </Title>
          <p className="max-w-[62ch] text-[18px] leading-relaxed text-ink-soft">
            cestchaud.fr ne fait pas un bulletin météo de plus. On compare chaque journée à ce qui est normal, on le dit en gras, et on montre d&apos;où vient chaque chiffre. L&apos;identité sert ce rôle : lisible de loin, joueuse sans être légère, la même partout.
          </p>
          <div className="flex flex-wrap items-center gap-6 rounded-[var(--radius-card)] bg-white p-6 sm:p-10">
            <Logo size="lg" />
          </div>
        </header>

        {/* ── Le concept en slides ── */}
        <Section
          id="slides"
          eyebrow="Le concept en 7 slides"
          title={<>Six idées, <Hl tone="chaud">une par slide</Hl>.</>}
          intro="Pour présenter cestchaud.fr en réunion, en atelier ou sur LinkedIn. Chaque slide défend une idée, avec les vrais chiffres du site. PNG haute définition, ou PDF complet (le format d'un carrousel LinkedIn)."
        >
          {SLIDE_SETS.map((set) => (
            <div key={set.format} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-extrabold">{set.title}</p>
                  <p className="text-[14px] text-mute">{set.desc}</p>
                </div>
                <a href={`/brand/slides/${set.format}/pdf`} download className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 font-display text-[15px] font-bold text-paper hover:bg-ink-soft">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
                  PDF des 7 slides
                </a>
              </div>
              <ul className={set.format === "16x9" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"}>
                {Array.from({ length: SLIDE_COUNT }, (_, i) => (
                  <li key={i} className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border-2 border-ink bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/brand/slides/${set.format}/${i + 1}.png`}
                      alt={`Slide ${i + 1} sur ${SLIDE_COUNT}, format ${set.title}`}
                      width={set.w}
                      height={set.h}
                      loading="lazy"
                      className="h-auto w-full border-b-2 border-ink bg-paper"
                    />
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="font-mono text-[13px] text-mute">{String(i + 1).padStart(2, "0")}/{String(SLIDE_COUNT).padStart(2, "0")}</span>
                      <a href={`/brand/slides/${set.format}/${i + 1}.png`} download={`cestchaud-${set.format}-${i + 1}.png`} className="inline-flex min-h-11 items-center rounded-full border-2 border-ink px-3 font-display text-[13px] font-bold hover:bg-ink hover:text-paper">
                        PNG
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        {/* ── L'anneau ── */}
        <Section
          id="anneau"
          eyebrow="Le signe"
          title={<>L&apos;anneau de <Hl>l&apos;écart</Hl>.</>}
          intro="Un « ° » épais, moitié chaud, moitié froid. Il dit l'idée du site en un signe : ce qui compte, ce n'est pas le thermomètre, c'est l'écart à la normale. Il remplace le point final du logo et sert seul en icône."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card tone="white" className="flex aspect-square items-center justify-center"><Mark size={140} title="Anneau couleur" /></Card>
            <Card tone="ink" className="flex aspect-square items-center justify-center"><Mark size={140} title="Anneau sur fond encre" /></Card>
            <Card tone="paper" className="flex aspect-square items-center justify-center"><Mark size={140} mono="#111111" title="Anneau encre" /></Card>
            <Card tone="signal" className="flex flex-col justify-between gap-4">
              <p className="font-display text-xl font-extrabold">Règles</p>
              <ul className="flex flex-col gap-2 text-[15px]">
                <li>Rouge en haut à gauche, bleu en bas à droite. Jamais l&apos;inverse.</li>
                <li>Taille minimale : 12 px à l&apos;écran.</li>
                <li>Espace libre autour : la moitié de son diamètre.</li>
                <li>Pas d&apos;ombre, pas de dégradé, pas de rotation.</li>
              </ul>
            </Card>
          </div>
        </Section>

        {/* ── Couleurs ── */}
        <Section
          id="couleurs"
          eyebrow="Couleurs"
          title={<>Papier, encre, et <Hl tone="froid">deux signaux</Hl>.</>}
          intro="Peu de couleurs, chacune avec un rôle. Le rouge et le bleu ne décorent jamais : ils veulent dire « au-dessus » et « en dessous » de la normale."
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COLORS.map((c) => (
              <li key={c.token} className="overflow-hidden rounded-[var(--radius-card)] border-2 border-ink bg-white">
                <div className="flex h-28 items-end p-4" style={{ background: c.hex, color: c.dark ? "#f5f4f0" : "#111111" }}>
                  <span className="font-display text-2xl font-extrabold">{c.name}</span>
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <p className="font-mono text-[13px] text-ink">{c.hex} · <span className="text-mute">{c.token}</span></p>
                  <p className="text-[15px] text-ink-soft">{c.role}</p>
                </div>
              </li>
            ))}
          </ul>

          <Card tone="white" className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <p className="font-display text-xl font-extrabold">L&apos;échelle d&apos;anomalie</p>
              <Explain term="anomalie" />
            </div>
            <p className="max-w-[62ch] text-[15px] text-ink-soft">
              Une seule échelle pour tout le site : cartes, classements, pastilles, graphiques. Neuf pas, centrés sur la normale. Elle se lit pareil en janvier et en juillet.
            </p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-9">
              {ANOMALY_STEPS.map((s) => (
                <li key={s.key} className="flex flex-col gap-1">
                  <span className="h-14 rounded-xl" style={{ background: s.hex }} />
                  <span className="font-mono text-[12px] text-ink">{s.hex}</span>
                  <span className="text-[13px] text-mute">{s.label}</span>
                </li>
              ))}
            </ul>
            <ScaleLegend />
          </Card>
        </Section>

        {/* ── Typographie ── */}
        <Section
          id="typo"
          eyebrow="Typographie"
          title={<>Des titres qui <Hl tone="chaud">se lisent de loin</Hl>.</>}
          intro="Trois familles libres, auto-hébergées (aucun appel à un service tiers)."
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <Card tone="white" className="flex flex-col gap-3">
              <Eyebrow>Titres et chiffres</Eyebrow>
              <p className="font-display text-6xl font-extrabold leading-none tracking-tight">+4,1&#8239;°</p>
              <p className="font-display text-2xl font-extrabold">Bricolage Grotesque 800</p>
              <p className="text-[15px] text-ink-soft">Large, un peu bancale, chaleureuse. Serrée (−2,5 %) et toujours en très gras.</p>
            </Card>
            <Card tone="white" className="flex flex-col gap-3">
              <Eyebrow>Texte courant</Eyebrow>
              <p className="text-[19px] leading-relaxed">La normale, c&apos;est la moyenne 1991-2020 pour ce mois et cette ville.</p>
              <p className="font-display text-2xl font-extrabold">DM Sans</p>
              <p className="text-[15px] text-ink-soft">Neutre, très lisible sur mobile. 16 à 18 px, interligne généreux.</p>
            </Card>
            <Card tone="white" className="flex flex-col gap-3">
              <Eyebrow>Sur-titres et données</Eyebrow>
              <p className="font-mono text-[15px] uppercase tracking-[0.14em]">Normale · 1991-2020 · ERA5</p>
              <p className="font-display text-2xl font-extrabold">JetBrains Mono</p>
              <p className="text-[15px] text-ink-soft">Pour l&apos;étiquetage, les sources et les tableaux. Chiffres à chasse fixe.</p>
            </Card>
          </div>
          <Card tone="paper" className="flex flex-col gap-3">
            <Eyebrow>Échelle</Eyebrow>
            <Title as="p" size="hero">Hero · 96</Title>
            <Title as="p" size="xl">Titre XL · 56</Title>
            <Title as="p" size="lg">Titre de section · 38</Title>
            <Title as="p" size="md">Titre de bloc · 22</Title>
            <p className="text-[17px]">Texte courant · 17</p>
            <p className="text-[13px] text-mute">Légende · 13 (minimum pour du texte à lire)</p>
          </Card>
        </Section>

        {/* ── Cartes ── */}
        <Section
          id="cartes"
          eyebrow="Fonds de carte"
          title={<>Des cartes <Hl>en points</Hl>, pas en tuiles.</>}
          intro="Hérités du projet Liner (LesWWW) : graticule en pointillés, voisins en trait fin, le pays en trait épais rempli d'une trame de points, les lieux en anneaux. Aucun fond de carte à charger : c'est du dessin vectoriel, léger, lisible sur un téléphone et animable."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <Card tone="white" className="flex flex-col gap-3">
              <LinerFrance id="brand-fr" className="h-auto w-full" label="France, style Liner">
                {([[48.85, 2.35, "#dc2626"], [43.3, 5.37, "#fb923c"], [50.63, 3.07, "#bfdbfe"]] as const).map(([lat, lon, fill]) => {
                  const [x, y] = projectFR(lat, lon)
                  return <circle key={`${lat}`} cx={x} cy={y} r="10" fill={fill} stroke="var(--color-ink)" strokeWidth="2.5" />
                })}
              </LinerFrance>
              <p className="text-[14px] text-mute">France métropolitaine · les villes prennent la couleur de leur écart.</p>
            </Card>
            <Card tone="ink" className="flex flex-col gap-3">
              {(() => {
                const { project } = makeProjection(EURAFRICA_BOUNDS, 720)
                const [px, py] = project(48.85, 2.35)
                const [sx, sy] = project(37.39, -5.98)
                return (
                  <DotWorld bounds={EURAFRICA_BOUNDS} className="h-auto w-full" dotColor="var(--color-paper)" dotOpacity={0.35} label="Planisphère en points">
                    <path d={`M${px} ${py} Q ${px - 60} ${(py + sy) / 2} ${sx} ${sy}`} fill="none" stroke="var(--color-signal)" strokeWidth="2.5" strokeDasharray="4 5" />
                    <circle cx={px} cy={py} r="7" fill="var(--color-chaud)" stroke="var(--color-paper)" strokeWidth="2.5" />
                    <circle cx={sx} cy={sy} r="7" fill="var(--color-signal)" stroke="var(--color-paper)" strokeWidth="2.5" />
                  </DotWorld>
                )
              })()}
              <p className="text-[14px] text-paper/75">Planisphère en points · exemple de trajet « jumeau 2050 ».</p>
            </Card>
          </div>
        </Section>

        {/* ── Ton ── */}
        <Section
          id="ton"
          eyebrow="Le ton"
          title={<>Affirmer, <Hl>surligner</Hl>, sourcer.</>}
          intro="Un titre dit une chose. Le mot qui compte est surligné. Sous chaque chiffre, la source."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Card tone="white" className="flex flex-col gap-4">
              <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-chaud">À faire</p>
              <ul className="flex flex-col gap-3 font-display text-xl font-bold leading-snug">
                <li>Le thermomètre <Hl tone="froid">ment par omission</Hl>.</li>
                <li>Il fait froid, donc… <Hl>non</Hl>.</li>
                <li>Le gel qui manque est <Hl tone="chaud">un signal</Hl>.</li>
              </ul>
            </Card>
            <Card tone="outline" className="flex flex-col gap-4">
              <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-mute">À éviter</p>
              <ul className="flex flex-col gap-3 text-[17px] text-ink-soft">
                <li>« Découvrez nos données climatiques » : ne dit rien.</li>
                <li>« Alerte canicule » en novembre : le texte doit suivre la saison.</li>
                <li>« +-0.3°C » : on écrit −0,3 °C, avec une virgule et un vrai signe moins.</li>
                <li>Un chiffre sans sa référence : « +4 °C » de quoi&#8239;? Par rapport à quoi&#8239;?</li>
              </ul>
            </Card>
          </div>
        </Section>

        {/* ── Composants ── */}
        <Section
          id="composants"
          eyebrow="Composants"
          title={<>Les mêmes briques, <Hl tone="froid">partout</Hl>.</>}
          intro="Chaque page est construite avec ces composants. Ils sont vivants ci-dessous : touchez, survolez, passez au clavier."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <Card tone="white" className="flex flex-col gap-4">
              <Eyebrow>Boutons</Eyebrow>
              <div className="flex flex-wrap gap-2">
                <Button>Encre</Button>
                <Button variant="chaud">Chaud</Button>
                <Button variant="froid">Froid</Button>
                <Button variant="ghost">Contour</Button>
                <ButtonLink href="/brand#composants" variant="ghost">Lien <Arrow /></ButtonLink>
              </div>
              <Eyebrow>Surligneurs</Eyebrow>
              <p className="font-display text-2xl font-bold">
                <Hl tone="signal">signal</Hl> · <Hl tone="chaud">chaud</Hl> · <Hl tone="froid">froid</Hl> · <Hl tone="ink">encre</Hl>
              </p>
              <Eyebrow>Pastilles d&apos;écart</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {[-6.5, -3.2, -0.8, 0, 0.7, 2.1, 4.1, 7.3].map((v) => <AnomalyChip key={v} value={v} />)}
              </div>
            </Card>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card tone="ink"><Stat invert label="Villes au-dessus" value={<><Num value={48} />/62</>} sub="Exemple de chiffre clé sur fond encre." explain="normale" /></Card>
              <Card tone="chaud"><Stat invert label="Le plus grand écart" value={<Num value={6.2} signed decimals={1} unit="°" />} sub="Carte cliquable, ton chaud." /></Card>
              <Card tone="froid"><Stat invert label="Nuits de gel" value={<Num value={3} />} sub="Ton froid." explain="nuitGel" /></Card>
              <Card tone="signal"><Stat label="Idée reçue" value="« Il gèle »" sub="Ton signal : ce qu'il faut lire d'abord." /></Card>
            </div>
          </div>
        </Section>

        {/* ── Mouvement ── */}
        <Section
          id="mouvement"
          eyebrow="Mouvement"
          title={<>Chaque animation <Hl tone="chaud">explique</Hl> quelque chose.</>}
          intro="GSAP, uniquement quand le mouvement fait comprendre une transformation : de l'absolu à l'écart, de la journée au climat, d'aujourd'hui à 2050. Le texte final est toujours là sans JavaScript, et rien ne bouge si vous avez demandé moins d'animations à votre système."
        >
          <MotionDemo />
          <div className="grid gap-3 md:grid-cols-3">
            <Card tone="white"><p className="font-display text-lg font-extrabold">Le compteur part de la normale</p><p className="mt-2 text-[15px] text-ink-soft">Un ressenti de 15 °C compte depuis 11 °C : l&apos;écart se voit pendant qu&apos;il se construit.</p></Card>
            <Card tone="white"><p className="font-display text-lg font-extrabold">La carte bascule</p><p className="mt-2 text-[15px] text-ink-soft">Du thermomètre à l&apos;écart, les couleurs balaient la France d&apos;ouest en est.</p></Card>
            <Card tone="white"><p className="font-display text-lg font-extrabold">Toujours pilotable</p><p className="mt-2 text-[15px] text-ink-soft">Boutons d&apos;étape, clavier, télécommande en atelier. Jamais seulement au défilement.</p></Card>
          </div>
        </Section>

        {/* ── Fichiers ── */}
        <Section
          id="fichiers"
          eyebrow="Fichiers"
          title={<>Prenez, utilisez, <Hl>citez</Hl>.</>}
          intro="Fichiers vectoriels (SVG), texte vectorisé. Pour un article, un atelier ou une présentation : citez « cestchaud.fr » et la source des données."
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FILES.map((f) => (
              <li key={f.file} className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border-2 border-ink bg-white">
                <div className={`flex h-32 items-center justify-center p-5 ${f.bg}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/brand/${f.file}`} alt={f.label} className="max-h-full max-w-full" />
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <span className="text-[15px] font-semibold">{f.label}</span>
                  <a href={`/brand/${f.file}`} download className="inline-flex min-h-11 items-center rounded-full border-2 border-ink px-4 font-display text-[14px] font-bold hover:bg-ink hover:text-paper">
                    SVG
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[14px] text-mute">
            Polices : Bricolage Grotesque, DM Sans et JetBrains Mono, sous licence SIL Open Font License. Référence technique pour les contributeurs : <code className="font-mono">docs/DESIGN.md</code> dans le dépôt.
          </p>
        </Section>
      </div>
    </PageShell>
  )
}
