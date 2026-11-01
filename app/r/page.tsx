import Link from "next/link"
import type { Metadata } from "next"
import CitySearch from "@/components/CitySearch"
import GeolocateButton from "@/components/GeolocateButton"
import PageShell from "@/components/ui/PageShell"
import Section from "@/components/ui/Section"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Card from "@/components/ui/Card"
import Eyebrow from "@/components/ui/Eyebrow"
import Explain from "@/components/ui/Explain"
import AnomalyChip from "@/components/ui/AnomalyChip"
import ScaleLegend from "@/components/ui/ScaleLegend"
import { Arrow } from "@/components/ui/Button"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateFull } from "@/lib/climate-season"
import { deMonth, seasonOf, seasonalMean } from "@/lib/season"
import { hasLiveData, mean1, theSeason } from "@/lib/city-page"
import { REGIONS } from "@/lib/regions"
import { fmtDeltaTemp } from "@/lib/format"
import { slugify } from "@/lib/slugify"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Ma ville : l'écart à la normale de 129 villes · cestchaud.fr",
  description: "Trouvez votre ville : l'écart du jour à la normale, la tendance sur 30 ans et les projections GIEC, pour 62 villes françaises par région et 67 villes du monde.",
  alternates: { canonical: "https://www.cestchaud.fr/r" },
  openGraph: {
    title: "Ma ville · cestchaud.fr",
    description: "L'écart du jour à la normale, ville par ville, région par région.",
    url: "https://www.cestchaud.fr/r",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
}

function anomalyOf(temp: number | undefined, normal: number | undefined) {
  return temp != null && normal != null ? Math.round((temp - normal) * 10) / 10 : null
}

export default async function MaVillePage() {
  const { citiesFR, citiesWorld, fetchedAt } = await getWeatherData()
  const live = hasLiveData(citiesFR)
  const refDate = live ? new Date(fetchedAt) : new Date()
  const month = refDate.getMonth()
  const season = seasonOf(month)
  const full = loadClimateFull()

  const regions = Object.entries(REGIONS).map(([slug, r]) => {
    const cities = citiesFR
      .filter((c) => c.region === r.label)
      .map((c) => ({ id: c.id, name: c.name, slug: slugify(c.name), anomaly: live ? anomalyOf(c.apparent_temp_max, full[c.id]?.normal?.[month]) : null }))
    return { slug, label: r.label, cities, trend: mean1(cities.map((c) => seasonalMean(full[c.id]?.trend, season))) }
  })

  const world = [...citiesWorld]
    .sort((a, b) => a.country.localeCompare(b.country, "fr") || a.name.localeCompare(b.name, "fr"))
    .map((c) => ({ id: c.id, name: c.name, country: c.country, slug: slugify(c.name), anomaly: live ? anomalyOf(c.apparent_temp_max, full[c.id]?.normal?.[month]) : null }))

  const searchCities = citiesFR.map((c) => ({ id: c.id, name: c.name, lat: c.lat, lon: c.lon, region: c.region }))

  return (
    <PageShell crumbs={[{ label: "Ma ville" }]}>
      <div className="flex flex-col gap-16 sm:gap-20">
        <header className="flex flex-col gap-6 pt-4 sm:pt-8">
          <Eyebrow>Ma ville · {citiesFR.length + citiesWorld.length} villes suivies</Eyebrow>
          <Title as="h1" size="hero" animate className="max-w-5xl">
            Votre ville, <Hl tone="chaud">à l&apos;écart</Hl> près.
          </Title>
          <p className="max-w-[62ch] text-[17px] leading-relaxed text-ink-soft">
            Chaque ville est comparée à sa propre normale {deMonth(month)} <Explain term="normale" /> : 10&#8239;°C, c&apos;est doux à Lille en janvier et froid à Nice en juillet.
          </p>
          <div className="flex max-w-xl flex-col gap-2">
            <label htmlFor="city-search" className="font-display text-[17px] font-bold">Chercher une commune</label>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <div className="w-full sm:flex-1"><CitySearch cities={searchCities} /></div>
              <GeolocateButton cities={searchCities} />
            </div>
          </div>
          {live ? (
            <ScaleLegend className="max-w-xl" />
          ) : (
            <p className="max-w-3xl rounded-2xl bg-signal p-4 font-display text-lg font-bold" role="status">
              Relevés du jour indisponibles : les écarts ne sont pas affichés, les fiches restent consultables.
            </p>
          )}
        </header>

        <Section
          id="regions"
          eyebrow="France · 13 régions"
          title={<>Toutes les villes, <Hl>région par région</Hl>.</>}
          intro={<>Sous chaque région : la tendance moyenne de {theSeason(season)} sur 30 ans <Explain term="tendance" />. À côté de chaque ville : son écart du jour.</>}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((r) => (
              <div key={r.slug} className="flex flex-col gap-2">
                <Card href={`/r/${r.slug}`} tone="ink" className="p-4 sm:p-5">
                  <span className="flex items-end justify-between gap-3">
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-display text-[1.35rem] font-extrabold leading-tight">{r.label}</span>
                    <span className="text-[13px] text-paper/80">
                      {r.trend != null ? <>{theSeason(season).replace(/^./, (m) => m.toUpperCase())} : {fmtDeltaTemp(r.trend)} en 30 ans</> : "Tendance indisponible"}
                    </span>
                  </span>
                  <span className="shrink-0 text-signal"><Arrow /></span>
                  </span>
                </Card>
                <ul className="flex flex-col">
                  {r.cities.map((c) => (
                    <li key={c.id}>
                      <Link href={`/a/${c.slug}`} className="flex min-h-11 items-center justify-between gap-3 border-b border-line px-1 text-[16px] font-semibold hover:bg-paper-deep">
                        <span>{c.name}</span>
                        {c.anomaly != null && <AnomalyChip value={c.anomaly} />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="monde"
          eyebrow={`Monde · ${world.length} villes`}
          title={<>Et <Hl tone="froid">ailleurs</Hl>&#8239;?</>}
          intro="Les mêmes chiffres pour des villes du monde entier, chacune comparée à sa propre normale."
        >
          <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {world.map((c) => (
              <li key={c.id}>
                <Link href={`/a/${c.slug}`} className="flex min-h-11 items-center justify-between gap-3 border-b border-line px-1 hover:bg-paper-deep">
                  <span className="min-w-0 truncate text-[16px] font-semibold">
                    {c.name} <span className="text-[13px] font-normal text-mute">{c.country}</span>
                  </span>
                  {c.anomaly != null && <AnomalyChip value={c.anomaly} />}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-mute">Sources : ressenti maximal du jour Open-Meteo ; normales et tendances Copernicus ERA5 (1991-2020).</p>
        </Section>
      </div>
    </PageShell>
  )
}
