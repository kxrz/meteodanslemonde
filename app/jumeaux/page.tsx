import type { Metadata } from "next"
import Link from "next/link"
import PageShell from "@/components/ui/PageShell"
import Section from "@/components/ui/Section"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Num from "@/components/ui/Num"
import Card from "@/components/ui/Card"
import Stat from "@/components/ui/Stat"
import Eyebrow from "@/components/ui/Eyebrow"
import Explain from "@/components/ui/Explain"
import { ButtonLink, Arrow } from "@/components/ui/Button"
import ShareButton from "@/components/ShareButton"
import CityPicker from "@/components/twins/CityPicker"
import TwinReveal from "@/components/twins/TwinReveal"
import TwinMap from "@/components/twins/TwinMap"
import TwinCurve from "@/components/twins/TwinCurve"
import { getWeatherData } from "@/lib/weather-data"
import { cityFromSlug, CLIMATE, FR_CITIES, inSeason, twinsOf, WORLD_CITIES } from "@/lib/twins-data"
import { sameWeatherToday, TWIN_MAX_RMSE } from "@/lib/twins"
import { annualMean, deMonth, MONTHS, seasonalMean } from "@/lib/season"
import { fmt } from "@/lib/format"

const BASE = "https://www.cestchaud.fr"

type SearchParams = Promise<{ ville?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const city = cityFromSlug((await searchParams).ville)
  const res = twinsOf(city)
  const twin = res?.hasCloseTwin ? res.top[0] : null
  const title = twin ? `${city.name} en 2050 = ${twin.name} aujourd'hui · cestchaud.fr` : "Jumeaux 2050 : votre ville en 2050 existe déjà · cestchaud.fr"
  const description = "Le climat de votre ville en 2050 existe déjà ailleurs. On compare mois par mois la projection 2050 de 62 villes françaises aux normales de 67 villes du monde."
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/jumeaux` },
    openGraph: { title, description, url: `${BASE}/jumeaux?ville=${city.slug}`, siteName: "cestchaud.fr", locale: "fr_FR", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function JumeauxPage({ searchParams }: { searchParams: SearchParams }) {
  const city = cityFromSlug((await searchParams).ville)
  const { citiesFR, citiesWorld, fetchedAt } = await getWeatherData()
  const month = new Date(fetchedAt).getMonth()
  const res = twinsOf(city)
  const climate = CLIMATE[city.id]
  const pickerCities = [...FR_CITIES].sort((a, b) => a.name.localeCompare(b.name, "fr")).map((c) => ({ slug: c.slug, name: c.name }))

  if (!res || !climate) {
    return (
      <PageShell crumbs={[{ label: "Jumeaux 2050" }]}>
        <Title as="h1" size="xl">Votre ville en 2050 <Hl>existe déjà</Hl>.</Title>
        <p className="mt-6 rounded-2xl bg-signal p-4 font-display text-xl font-bold">Les données climatiques de {city.name} sont indisponibles pour le moment.</p>
      </PageShell>
    )
  }

  const twin = res.hasCloseTwin ? res.top[0] : null
  const geo = (id: string) => WORLD_CITIES.find((w) => w.id === id)!
  const twinsGeo = res.top.map((t) => ({ id: t.id, name: t.name, lat: geo(t.id).lat, lon: geo(t.id).lon }))
  const ref = twin ?? res.top[0]

  const nowYear = annualMean(climate.normal)!
  const futureYear = annualMean(res.target)!
  const refYear = annualMean(ref.normal)!
  const pageUrl = `${BASE}/jumeaux?ville=${city.slug}`
  const storyUrl = `/jumeaux/story?ville=${city.slug}`
  const shareText = twin
    ? `${city.name} en 2050 = ${twin.name} aujourd'hui. Et votre ville ?`
    : `${city.name} en 2050 n'a aucun jumeau dans 67 villes du monde. Et votre ville ?`

  // Météo du jour (l'ancien calcul), si les relevés sont arrivés
  const hasData = citiesFR.some((c) => c.apparent_temp_max !== 0 || c.temp_min !== 0)
  const today = citiesFR.find((c) => c.id === city.id)
  const sameToday = hasData && today ? sameWeatherToday(today.apparent_temp_max, citiesWorld) : []

  const cityCard = (label: string, values: number[], tone: "white" | "chaud" | "ink", from?: number) => {
    const invert = tone !== "white"
    return (
      <Card tone={tone}>
        <Stat
          invert={invert}
          label={label}
          value={<Num value={annualMean(values)} from={from} decimals={1} unit="&#8239;°C" />}
          sub={<>Moyenne annuelle du ressenti max. Été {fmt(seasonalMean(values, "ete"))}&#8239;°C, hiver {fmt(seasonalMean(values, "hiver"))}&#8239;°C.</>}
        />
      </Card>
    )
  }

  return (
    <PageShell crumbs={[{ label: "Jumeaux 2050" }]}>
      <div className="flex flex-col gap-14 sm:gap-20">
        <header className="flex flex-col gap-5 pt-2 sm:pt-8">
          <Eyebrow>Jumeaux 2050 · 62 villes françaises, 67 villes du monde</Eyebrow>
          <Title as="h1" size="xl" animate className="max-w-4xl">
            Votre ville en 2050 <Hl>existe déjà</Hl>.
          </Title>
          <CityPicker cities={pickerCities} current={city.slug} />
        </header>

        <TwinReveal
          cityId={city.id}
          cityName={city.name}
          twinName={twin?.name ?? null}
          map={<TwinMap origin={city} twins={twinsGeo} world={WORLD_CITIES} close={!!twin} />}
          caption={twin ? (
            <>
              Même climat à <strong className="text-signal">{fmt(twin.rmse)}&#8239;°C près</strong>, mois par mois ({twin.country}).
              Ressemblance la plus forte {inSeason(twin.best.season)}, la plus faible {inSeason(twin.worst.season)}.
            </>
          ) : (
            <>La ville la plus proche, {res.top[0].name}, reste à {fmt(res.top[0].rmse)}&#8239;°C d&apos;écart moyen : trop loin pour parler de jumeau (seuil : {fmt(TWIN_MAX_RMSE)}&#8239;°C).</>
          )}
          actions={
            <>
              <a href={storyUrl} download={`cestchaud-${city.slug}-2050.png`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-signal px-5 font-display text-[15px] font-bold text-ink transition-colors hover:bg-paper">
                Télécharger l&apos;image story
              </a>
              <span className="rounded-full bg-paper"><ShareButton text={shareText} url={pageUrl} /></span>
            </>
          }
        />

        <Section
          id="mois-par-mois"
          eyebrow="Mois par mois"
          title={<>{city.name} en 2050, <Hl tone="chaud">{ref.name}</Hl> aujourd&apos;hui.</>}
          intro={
            <>
              La courbe rouge, c&apos;est la normale de {city.name} plus le réchauffement projeté pour 2050 <Explain term="projection" />. La courbe pointillée, la normale actuelle de {ref.name} <Explain term="normale" />.
              {ref.worst.abs >= 1 && <> Le plus grand écart tombe {inSeason(ref.worst.season)} : {ref.name} y est {ref.worst.diff > 0 ? "plus chaud" : "plus frais"} de {fmt(Math.abs(ref.worst.diff))}&#8239;°C.</>}
            </>
          }
        >
          <TwinCurve city={city.name} twin={ref.name} normal={climate.normal} target={res.target} twinNormal={ref.normal} month={month} />
          <div className="grid gap-3 md:grid-cols-3">
            {cityCard(`${city.name} aujourd'hui`, climate.normal, "white")}
            {cityCard(`${city.name} en 2050`, res.target, "chaud", nowYear)}
            {cityCard(`${ref.name} aujourd'hui`, ref.normal, "ink")}
          </div>
          <p className="text-[15px] text-ink-soft">
            En moyenne sur l&apos;année, {city.name} gagne <strong>{fmt(futureYear - nowYear)}&#8239;°C</strong> de ressenti maximal d&apos;ici 2050 ; {ref.name} est aujourd&apos;hui à {fmt(refYear)}&#8239;°C.
            {res.top.length > 1 && <> Suivants : {res.top.slice(1).map((t) => `${t.name} (${fmt(t.rmse)} °C d'écart)`).join(", ")}.</>}
          </p>
        </Section>

        <Section id="honnete" eyebrow="À lire avant de partager" title={<>Même température, <Hl tone="froid">pas même vie</Hl>.</>}>
          <div className="grid gap-3 md:grid-cols-2">
            <Card tone="signal" className="flex flex-col gap-3">
              <h3 className="font-display text-2xl font-extrabold">Ce que ça veut dire</h3>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-[16px] leading-snug">
                <li>Mois par mois, le ressenti maximal moyen attendu à {city.name} vers 2050 ressemble à celui qu&apos;on mesure aujourd&apos;hui à {ref.name}.</li>
                <li>Le réchauffement n&apos;est pas un chiffre abstrait : c&apos;est un déplacement de climat de plusieurs centaines de kilomètres, en une génération.</li>
                <li>C&apos;est une estimation prudente : scénario SSP2-4.5 <Explain term="ssp" />, celui des politiques actuelles.</li>
              </ul>
            </Card>
            <Card tone="outline" className="flex flex-col gap-3">
              <h3 className="font-display text-2xl font-extrabold">Ce que ça ne veut pas dire</h3>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-[16px] leading-snug">
                <li>Pas la même pluie, ni le même ensoleillement, ni les mêmes vents : on ne compare que le ressenti maximal <Explain term="ressenti" />.</li>
                <li>Pas les mêmes paysages : les arbres, les sols et les rivières de {city.name} n&apos;auront pas eu le temps de s&apos;adapter.</li>
                <li>Pas la même société : bâtiments, habitudes, horaires et système de santé ne changent pas d&apos;eux-mêmes.</li>
                <li>Pas une prévision au degré près : nos 67 villes ne couvrent pas le monde, et deux modèles seulement fournissent la projection.</li>
              </ul>
            </Card>
          </div>
          <p className="flex flex-wrap items-center gap-1 text-[13px] text-mute">
            <span>Méthode : normale ERA5 1991-2020 du ressenti maximal + projection CMIP6 SSP2-4.5 (2041-2050 vs 2000-2020), lissée sur trois mois et jamais inférieure à la tendance déjà observée ; comparaison aux normales actuelles par écart quadratique moyen sur 12 mois. Au-delà de {fmt(TWIN_MAX_RMSE)}&#8239;°C, on ne parle plus de jumeau.</span>
            <Explain term="jumeau" />
            <Link href="/a-propos" className="underline underline-offset-2">Méthode détaillée</Link>
          </p>
        </Section>

        <Section
          id="aujourdhui"
          eyebrow={`Météo du jour · ${MONTHS[month]}`}
          title={<>Aujourd&apos;hui, il fait <Hl>pareil à</Hl>…</>}
          intro={<>Ça, c&apos;est de la météo, pas du climat <Explain term="meteoClimat" /> : les villes du monde dont le ressenti maximal du jour est à ±4&#8239;°C de celui de {city.name}. Demain, la liste aura changé.</>}
        >
          {!hasData || !today ? (
            <p className="rounded-2xl bg-paper-deep p-4 font-display text-lg font-bold">Relevé du jour indisponible : les jumeaux 2050 ci-dessus, eux, ne dépendent pas de la météo du jour.</p>
          ) : sameToday.length === 0 ? (
            <p className="rounded-2xl bg-paper-deep p-4 text-[16px]">À {city.name}, {fmt(today.apparent_temp_max, 0)}&#8239;°C ressentis aujourd&apos;hui : aucune ville de notre liste n&apos;est à ±4&#8239;°C.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[16px]">À {city.name}, <strong>{fmt(today.apparent_temp_max, 0)}&#8239;°C</strong> ressentis au plus chaud de la journée.</p>
              <ul className="flex flex-wrap gap-2">
                {sameToday.map((w) => (
                  <li key={w.id} className="rounded-full bg-white px-4 py-2 text-[15px]">
                    <strong>{w.name}</strong> <span className="text-mute">{w.country} · {fmt(w.apparent_temp_max, 0)}&#8239;°C</span>
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-mute">Comparer une journée {deMonth(month).replace(/^d'|^de /, "")} à une autre ne dit rien du climat : c&apos;est la comparaison des normales, plus haut, qui compte.</p>
            </div>
          )}
        </Section>

        <Card tone="ink" href="/jumeaux/jeu" className="flex flex-col gap-3 p-6 sm:p-10">
          <Eyebrow className="text-paper/70">Le jeu</Eyebrow>
          <p className="font-display text-[clamp(1.8rem,5vw,3rem)] font-extrabold leading-tight">Cinq questions, une minute. <span className="text-signal">Vous trouvez les jumeaux&#8239;?</span></p>
          <span className="inline-flex items-center gap-1 font-display font-bold text-signal">Jouer <Arrow /></span>
        </Card>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/a/${city.slug}`} variant="ghost">Fiche {city.name} <Arrow /></ButtonLink>
        </div>
        <p className="text-[13px] text-mute">
          Sources : normales et tendances Copernicus ERA5 (1991-2020), projections GIEC CMIP6 via Open-Meteo, ressenti du jour Open-Meteo. Fond de carte en points : contours du projet Liner (LesWWW, MIT).
        </p>
      </div>
    </PageShell>
  )
}
