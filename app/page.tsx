import type { Metadata } from "next"
import Link from "next/link"
import CitySearch from "@/components/CitySearch"
import GeolocateButton from "@/components/GeolocateButton"
import ShareButton from "@/components/ShareButton"
import PageShell from "@/components/ui/PageShell"
import Section from "@/components/ui/Section"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Num from "@/components/ui/Num"
import Card from "@/components/ui/Card"
import Stat from "@/components/ui/Stat"
import Eyebrow from "@/components/ui/Eyebrow"
import { ButtonLink, Arrow } from "@/components/ui/Button"
import FranceDotMap, { type DotCity } from "@/components/pedago/FranceDotMap"
import CityRanking from "@/components/pedago/CityRanking"
import AnomalyBreakdown from "@/components/pedago/AnomalyBreakdown"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { smoothedAt, loadClimateFull } from "@/lib/climate-season"
import { MONTHS, deMonth, isColdHalf, isHotSeason, seasonCopy, seasonOf } from "@/lib/season"
import { mythOfTheDay } from "@/lib/myths"
import { fmt, fmtDelta } from "@/lib/format"
import { slugify } from "@/lib/slugify"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "En vrai, c'est chaud · cestchaud.fr",
  description: "L'écart à la normale du jour dans 62 villes françaises, en toute saison. Météo ou climat ? Les chiffres ERA5 et GIEC, expliqués simplement.",
  alternates: { canonical: "https://www.cestchaud.fr" },
  openGraph: {
    title: "En vrai, c'est chaud · cestchaud.fr",
    description: "L'écart à la normale du jour, les idées reçues démontées, et votre ville en 2050.",
    url: "https://www.cestchaud.fr",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "https://www.cestchaud.fr/og/home.png", width: 1200, height: 630, alt: "En vrai, c'est chaud · cestchaud.fr" }],
  },
}

function daySeed() {
  return Math.floor(Date.now() / 86_400_000)
}

export default async function Home() {
  const { citiesFR, fetchedAt } = await getWeatherData()
  const climate = loadClimateMap()
  const full = loadClimateFull()

  const dataDate = new Date(fetchedAt)
  const month = dataDate.getMonth()
  const monthName = MONTHS[month]
  const season = seasonOf(month)
  const copy = seasonCopy(month)
  const myth = mythOfTheDay(season, dataDate)

  // Données absentes (échec du relevé) : on le dit au lieu d'afficher des zéros.
  const hasData = citiesFR.some((c) => c.apparent_temp_max !== 0 || c.temp_min !== 0)

  const cities: DotCity[] = citiesFR.map((c) => {
    const normal = climate[c.id]?.normal?.[month] ?? null
    const anomaly = hasData && normal != null ? Math.round((c.apparent_temp_max - normal) * 10) / 10 : null
    return { id: c.id, name: c.name, slug: slugify(c.name), region: c.region, lat: c.lat, lon: c.lon, temp: c.apparent_temp_max, normal, anomaly }
  })

  const withA = cities.filter((c) => c.anomaly != null)
  const avgAnomaly = withA.length ? Math.round((withA.reduce((s, c) => s + c.anomaly!, 0) / withA.length) * 10) / 10 : null
  const byAnomaly = [...withA].sort((a, b) => b.anomaly! - a.anomaly!)
  const topWarm = byAnomaly[0]
  const topCold = byAnomaly[byAnomaly.length - 1]
  const coldestThermo = [...cities].sort((a, b) => a.temp - b.temp)[0]
  const aboveCount = withA.filter((c) => c.anomaly! >= 0.5).length

  // Signaux du jour, selon la saison
  const frostNight = citiesFR.filter((c) => c.temp_min < 0)
  const veryMild = withA.filter((c) => c.anomaly! >= 3)
  const tropicalNight = citiesFR.filter((c) => c.temp_min >= 20)
  const heatwave = citiesFR.filter((c) => c.apparent_temp_max >= 35)

  // Ville du jour : décomposition météo / climat
  const spot = cities[daySeed() % cities.length]
  const spotTrend = smoothedAt(full[spot.id]?.trend ?? (climate[spot.id]?.trend as number[] | undefined), month)

  const searchCities = citiesFR.map((c) => ({ id: c.id, name: c.name, lat: c.lat, lon: c.lon, region: c.region }))
  const dataLabel = dataDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })

  const shareText = avgAnomaly != null
    ? `Aujourd'hui, la France est en moyenne à ${fmtDelta(avgAnomaly)} °C de la normale ${deMonth(month)}. ${aboveCount} villes sur ${cities.length} au-dessus. Météo ou climat ? cestchaud.fr`
    : "L'écart à la normale du jour, ville par ville : cestchaud.fr"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: "https://www.cestchaud.fr",
    name: "cestchaud.fr",
    inLanguage: "fr-FR",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: "https://www.cestchaud.fr/a/{slug}" },
      "query-input": "required name=slug",
    },
  }

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex flex-col gap-16 sm:gap-20">
        {/* ── Accroche ── */}
        <header className="flex flex-col gap-6 pt-6 sm:pt-10">
          <Eyebrow>
            Aujourd&apos;hui · <span className="first-letter:uppercase">{dataLabel}</span> · {cities.length} villes
          </Eyebrow>
          <Title as="h1" size="hero" animate className="max-w-5xl">
            En vrai, c&apos;est <Hl tone="chaud">chaud</Hl>. <span className="text-froid">{copy.tagline}</span>
          </Title>

          {hasData && avgAnomaly != null ? (
            <p className="max-w-3xl font-display text-[clamp(1.35rem,3vw,2rem)] font-bold leading-snug tracking-tight text-ink">
              <span className="text-mute line-through decoration-chaud decoration-[3px]">{copy.question}</span>{" "}
              En moyenne, la France est à{" "}
              <Hl tone={avgAnomaly >= 0 ? "chaud" : "froid"}><Num value={avgAnomaly} signed decimals={1} unit="&#8239;°C" /></Hl>{" "}
              de la normale {deMonth(month)}.
            </p>
          ) : (
            <p className="max-w-3xl rounded-2xl bg-signal p-4 font-display text-xl font-bold">
              Les relevés du jour ne sont pas encore arrivés. Les normales, tendances et projections restent consultables ville par ville.
            </p>
          )}

          <div className="flex max-w-xl flex-col gap-2">
            <label htmlFor="city-search" className="font-display text-[17px] font-bold">Et chez vous&#8239;?</label>
            <div className="flex items-center gap-2">
              <div className="flex-1"><CitySearch cities={searchCities} /></div>
              <GeolocateButton cities={searchCities} />
            </div>
          </div>
        </header>

        {/* ── Les chiffres du jour ── */}
        {hasData && topWarm && topCold && (
          <section aria-label="Les chiffres du jour" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-anim="stagger">
            <Card tone="ink">
              <Stat
                invert
                label="Villes au-dessus de la normale"
                value={<><Num value={aboveCount} /><span className="text-paper/50">/{cities.length}</span></>}
                sub={`Comparées chacune à un ${monthName} normal (1991-2020).`}
                explain="normale"
              />
            </Card>
            <Card href={`/a/${topWarm.slug}`} tone="chaud">
              <Stat invert label="Le plus grand écart" value={<Num value={topWarm.anomaly} signed decimals={1} unit="°" />} sub={<>{topWarm.name} · {fmt(topWarm.temp, 0)}° ressentis</>} explain="anomalie" />
            </Card>
            <Card href={`/a/${coldestThermo.slug}`} tone="white">
              <Stat
                label="Le plus froid au thermomètre"
                value={<Num value={coldestThermo.temp} unit="°" />}
                sub={<>{coldestThermo.name}, pourtant à <strong>{fmtDelta(coldestThermo.anomaly)}&#8239;°C</strong> de sa normale.</>}
                explain="ressenti"
              />
            </Card>
            <Card href={`/a/${topCold.slug}`} tone="froid">
              <Stat invert label={topCold.anomaly! < -0.5 ? "Le plus sous la normale" : "Le plus proche de la normale"} value={<Num value={topCold.anomaly} signed decimals={1} unit="°" />} sub={<>{topCold.name} · {fmt(topCold.temp, 0)}° ressentis</>} />
            </Card>
          </section>
        )}

        {/* ── Carte : thermomètre vs écart ── */}
        {hasData && (
          <Section
            id="carte"
            eyebrow="La carte du jour"
            title={<>Le thermomètre <Hl tone="froid">ment par omission</Hl>.</>}
            intro={<>8&#8239;°C en {monthName}, c&apos;est froid ou doux&#8239;? Ça dépend de ce qui est normal ici, à cette période. Basculez la carte pour voir la différence.</>}
          >
            <FranceDotMap cities={cities} monthLabel={monthName} />
          </Section>
        )}

        {/* ── Météo ou climat ── */}
        {hasData && spot.normal != null && spotTrend != null && (
          <Section
            id="meteo-climat"
            eyebrow={`Ville du jour · ${spot.name}`}
            title={<>Météo du jour ou <Hl tone="chaud">climat qui change</Hl>&#8239;?</>}
            intro="L'écart du jour mélange deux choses : ce que le climat a déjà ajouté à la normale en 30 ans, et ce que la journée ajoute par-dessus. On les sépare."
            action={<ButtonLink href={`/a/${spot.slug}`} variant="ghost">Fiche {spot.name} <Arrow /></ButtonLink>}
          >
            <AnomalyBreakdown city={spot.name} monthLabel={monthName} normal={spot.normal} trend={spotTrend} today={spot.temp} />
          </Section>
        )}

        {/* ── Idée reçue du jour ── */}
        <Section id="idee-recue" eyebrow="Idée reçue du jour">
          <Card tone="signal" className="flex flex-col gap-5 p-6 sm:p-10">
            <p className="font-display text-[clamp(1.4rem,3.4vw,2.4rem)] font-bold leading-tight text-ink/60">
              « {myth.claim} »
            </p>
            <p className="max-w-4xl font-display text-[clamp(1.8rem,4.6vw,3.4rem)] font-extrabold leading-[1.02] tracking-tight" data-anim="split">
              {myth.answer.split(myth.highlight).flatMap((part, i, arr) =>
                i < arr.length - 1 ? [part, <Hl key={i} tone="ink">{myth.highlight}</Hl>] : [part],
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/idees-recues#${myth.slug}`}>Comprendre en 1 minute <Arrow /></ButtonLink>
              <ButtonLink href="/idees-recues" variant="ghost">Toutes les idées reçues</ButtonLink>
            </div>
          </Card>
        </Section>

        {/* ── Classement ── */}
        {hasData && (
          <Section
            id="classement"
            eyebrow="Classement"
            title={<>Qui s&apos;écarte <Hl>le plus</Hl> aujourd&apos;hui&#8239;?</>}
            intro="Changez le tri : une ville froide au thermomètre peut être en tête des écarts."
          >
            <CityRanking cities={cities} />
          </Section>
        )}

        {/* ── Signaux du mois ── */}
        {hasData && (
          <Section
            id="signaux"
            eyebrow={`Signaux de ${monthName}`}
            title={isColdHalf(month) ? <>Ce que l&apos;hiver <Hl tone="froid">ne fait plus</Hl>.</> : isHotSeason(month) ? <>Quand la chaleur <Hl tone="chaud">ne redescend plus</Hl>.</> : <>Les signaux de <Hl>saison</Hl>.</>}
            action={<ButtonLink href="/signaux" variant="ghost">Tous les signaux <Arrow /></ButtonLink>}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {isHotSeason(month) ? (
                <>
                  <Card tone="ink"><Stat invert label="Nuits tropicales cette nuit" value={<Num value={tropicalNight.length} />} sub="villes où la nuit n'est pas descendue sous 20 °C" explain="nuitTropicale" /></Card>
                  <Card tone="chaud"><Stat invert label="Ressenti ≥ 35 °C" value={<Num value={heatwave.length} />} sub="villes en chaleur forte aujourd'hui" /></Card>
                </>
              ) : (
                <>
                  <Card tone="froid"><Stat invert label="Nuits de gel cette nuit" value={<Num value={frostNight.length} />} sub={`villes sur ${cities.length} sont passées sous 0 °C`} explain="nuitGel" /></Card>
                  <Card tone="chaud"><Stat invert label="Journées très douces" value={<Num value={veryMild.length} />} sub={`villes à +3 °C ou plus au-dessus de la normale ${deMonth(month)}`} explain="anomalie" /></Card>
                </>
              )}
            </div>
          </Section>
        )}

        {/* ── Aller plus loin ── */}
        <Section eyebrow="Aller plus loin" title={<>Comprendre, montrer, <Hl tone="chaud">agir</Hl>.</>}>
          <div className="grid gap-3 md:grid-cols-3">
            <Card href="/jumeaux" tone="white" className="flex flex-col gap-3">
              <Eyebrow>Jumeaux 2050</Eyebrow>
              <p className="font-display text-2xl font-extrabold leading-tight">Le climat de votre ville en 2050 existe déjà ailleurs.</p>
              <span className="mt-auto inline-flex items-center gap-1 font-display font-bold">Trouver son jumeau <Arrow /></span>
            </Card>
            <Card href="/atelier" tone="ink" className="flex flex-col gap-3">
              <Eyebrow className="text-paper/70">Atelier</Eyebrow>
              <p className="font-display text-2xl font-extrabold leading-tight">Animer une séance en classe ou en atelier, sur grand écran.</p>
              <span className="mt-auto inline-flex items-center gap-1 font-display font-bold text-signal">Lancer l&apos;atelier <Arrow /></span>
            </Card>
            <Card href="/citoyens" tone="outline" className="flex flex-col gap-3">
              <Eyebrow>Agir</Eyebrow>
              <p className="font-display text-2xl font-extrabold leading-tight">Écrire à vos élus avec les chiffres de votre territoire.</p>
              <span className="mt-auto inline-flex items-center gap-1 font-display font-bold">Préparer mon message <Arrow /></span>
            </Card>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 rounded-[var(--radius-card)] bg-paper-deep p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-xl font-extrabold">L&apos;écart de votre ville, chaque matin.</p>
              <p className="text-[15px] text-ink-soft">Un email court, factuel, sans publicité. Désinscription en un clic.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/notifications" variant="chaud">Recevoir le briefing</ButtonLink>
              <ShareButton text={shareText} url="https://www.cestchaud.fr" />
            </div>
          </div>
          <p className="text-[13px] text-mute">
            Sources : ressenti maximal du jour Open-Meteo, normales et tendances Copernicus ERA5 (1991-2020), projections GIEC CMIP6.{" "}
            <Link href="/a-propos" className="underline underline-offset-2">Méthode détaillée</Link>.
          </p>
        </Section>
      </div>
    </PageShell>
  )
}
