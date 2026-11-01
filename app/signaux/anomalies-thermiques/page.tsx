import type { Metadata } from "next"
import Link from "next/link"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Num from "@/components/ui/Num"
import Card from "@/components/ui/Card"
import Eyebrow from "@/components/ui/Eyebrow"
import Explain from "@/components/ui/Explain"
import { ButtonLink, Arrow } from "@/components/ui/Button"
import FirePageClient from "@/components/FirePageClient"
import { fetchFirePointsResult, fetchFireZoneWeather, clusterFirePoints } from "@/lib/fire-data"
import { MONTHS, isHotSeason } from "@/lib/season"
import { parisISODate } from "@/lib/signals"

const META_TITLE = "Anomalies thermiques en France · lecture satellite 7 jours · cestchaud.fr"
const META_DESC = "Les points anormalement chauds repérés par le satellite NASA FIRMS / VIIRS en France métropolitaine et en Corse sur 7 jours : feux, brûlages, sites industriels. Comment les lire sans se tromper."
const URL = "https://www.cestchaud.fr/signaux/anomalies-thermiques"

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESC,
  alternates: { canonical: URL },
  openGraph: { title: META_TITLE, description: META_DESC, url: URL, siteName: "cestchaud.fr", locale: "fr_FR", type: "website" },
  twitter: { card: "summary_large_image", title: META_TITLE, description: META_DESC },
}

export const revalidate = 3600

const REGION_BOXES: Record<string, { label: string; slug: string; latMin: number; latMax: number; lonMin: number; lonMax: number }> = {
  paca:  { label: "Provence-Alpes-Côte d'Azur", slug: "provence-alpes-cote-d-azur", latMin: 43.1, latMax: 45.1, lonMin: 4.2, lonMax: 7.8 },
  occ:   { label: "Occitanie",                  slug: "occitanie",                  latMin: 42.3, latMax: 44.8, lonMin: -1.8, lonMax: 4.2 },
  na:    { label: "Nouvelle-Aquitaine",          slug: "nouvelle-aquitaine",          latMin: 43.4, latMax: 47.6, lonMin: -1.8, lonMax: 2.5 },
  ara:   { label: "Auvergne-Rhône-Alpes",        slug: "auvergne-rhone-alpes",        latMin: 44.1, latMax: 46.9, lonMin: 2.5, lonMax: 7.5 },
  corse: { label: "Corse",                       slug: "corse",                       latMin: 41.3, latMax: 43.1, lonMin: 8.4, lonMax: 9.6 },
  idf:   { label: "Île-de-France",               slug: "ile-de-france",               latMin: 48.0, latMax: 49.2, lonMin: 1.4, lonMax: 3.6 },
  cvdl:  { label: "Centre-Val de Loire",         slug: "centre-val-de-loire",         latMin: 46.5, latMax: 48.5, lonMin: 0.5, lonMax: 3.5 },
}

function assignRegion(lat: number, lon: number): string {
  for (const [key, b] of Object.entries(REGION_BOXES)) {
    if (lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax) return key
  }
  return "autres"
}

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; lat: number; lon: number; region: string
}>

const CRUMBS = [{ label: "Signaux du mois", href: "/signaux" }, { label: "Anomalies thermiques" }]

/** Le bloc d'explication unique de la page. */
function WhatPointsShow() {
  return (
    <Card tone="paper" as="section" className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-display text-[1.35rem] font-bold leading-tight">
        Ce que montrent ces points <Explain term="firms" />
      </h2>
      <ul className="flex max-w-3xl list-disc flex-col gap-2 pl-5 text-[15px] leading-snug text-ink-soft">
        <li><strong className="text-ink">Un point = un pixel de 375&#8239;m plus chaud que ses voisins</strong> au passage du satellite (deux fois par jour). Ce n&apos;est pas un incendie déclaré.</li>
        <li>Feu de végétation, brûlage agricole, torchère, site industriel ou reflet : le capteur ne fait pas la différence. Les sites industriels connus et les sources actives 5 jours sur 7 sont signalés à part.</li>
        <li>Les nuages créent des angles morts. Ce n&apos;est pas un outil d&apos;alerte : en cas de feu, appelez le 18 ou le 112.</li>
      </ul>
    </Card>
  )
}

export default async function AnomaliesThermiquesPage() {
  const month = Number(parisISODate(new Date()).slice(5, 7)) - 1
  const monthName = MONTHS[month]
  const hot = isHotSeason(month)
  const result = await fetchFirePointsResult()
  const points = result.ok ? result.points : []

  const offSeason = (
    <>En {monthName}, les détections sont surtout des <strong>brûlages agricoles</strong> et des <strong>sites industriels</strong> : la saison des feux de végétation, c&apos;est surtout de juin à septembre.</>
  )

  // ── Flux injoignable ou aucune détection : un vrai état éditorial ──
  if (points.length === 0) {
    return (
      <PageShell crumbs={CRUMBS}>
        <div className="flex flex-col gap-10 pt-4 sm:pt-8">
          <header className="flex flex-col gap-5">
            <Eyebrow>Satellite NASA · 7 derniers jours</Eyebrow>
            <Title as="h1" size="hero" animate className="max-w-5xl">
              {result.ok ? <>Aucun point chaud <Hl>vu de l&apos;espace</Hl>.</> : <>Le satellite <Hl>ne répond pas</Hl>.</>}
            </Title>
            <p className="max-w-3xl font-display text-[clamp(1.2rem,2.4vw,1.6rem)] font-bold leading-snug">
              {result.ok
                ? "Aucune anomalie thermique en France ces 7 derniers jours. Ni en métropole, ni en Corse."
                : "Le flux NASA FIRMS n'a pas répondu. Pas de carte vide trompeuse : on réessaie toutes les heures."}
            </p>
            {!hot && <p className="max-w-3xl text-[17px] leading-relaxed text-ink-soft">{offSeason}</p>}
          </header>
          <WhatPointsShow />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/signaux">Les signaux du mois <Arrow /></ButtonLink>
            <ButtonLink href="/r" variant="ghost">Toutes les régions</ButtonLink>
          </div>
        </div>
      </PageShell>
    )
  }

  // Centroïde des détections pour l'air et le vent
  const centroidLat = points.reduce((s, p) => s + p.lat, 0) / points.length
  const centroidLon = points.reduce((s, p) => s + p.lon, 0) / points.length
  const zoneWeather = await fetchFireZoneWeather(centroidLat, centroidLon)

  const byDay: Record<string, number> = {}
  for (const p of points) byDay[p.date] = (byDay[p.date] ?? 0) + 1
  const days = Object.keys(byDay).sort()

  const byRegion: Record<string, { count: number; frpTotal: number }> = {}
  for (const p of points) {
    const r = assignRegion(p.lat, p.lon)
    if (!byRegion[r]) byRegion[r] = { count: 0, frpTotal: 0 }
    byRegion[r].count++
    byRegion[r].frpTotal += p.frp
  }

  const highConf = points.filter((p) => p.confidence === "high").length
  const hasFrp = points.some((p) => p.frp > 0)
  const maxFrp = hasFrp ? points.reduce((m, p) => Math.max(m, p.frp), 0) : 0
  const peakDay = days.reduce((a, b) => ((byDay[a] ?? 0) >= (byDay[b] ?? 0) ? a : b), days[0] ?? "")
  const peakCount = byDay[peakDay] ?? 0

  const regionRanking = Object.entries(byRegion)
    .filter(([key]) => key !== "autres")
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, data]) => ({ key, ...REGION_BOXES[key], count: data.count, frpTotal: data.frpTotal }))
    .filter((r) => r.label)

  const autresCount = byRegion["autres"]?.count ?? 0
  const clusters = clusterFirePoints(points)

  const geojson = {
    type: "FeatureCollection" as const,
    features: points.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] as [number, number] },
      properties: { firedate: p.date, confidence: p.confidence, frp: p.frp },
    })),
  }

  return (
    <PageShell crumbs={CRUMBS}>
      <div className="flex flex-col gap-10 pt-4 sm:pt-8">
        <header className="flex flex-col gap-5">
          <Eyebrow>Satellite NASA · 7 derniers jours</Eyebrow>
          <Title as="h1" size="hero" animate className="max-w-5xl">
            {hot ? <>Ce que le satellite <Hl tone="chaud">voit chauffer</Hl>.</> : <>En {monthName}, le satellite voit <Hl>surtout des brûlages</Hl>.</>}
          </Title>
          <p className="max-w-3xl font-display text-[clamp(1.2rem,2.4vw,1.6rem)] font-bold leading-snug">
            <Num value={points.length} /> anomalies thermiques repérées en France en 7 jours, dont <Num value={highConf} /> à haute confiance.
            {clusters.some((c) => c.isMajor) && <> <Num value={clusters.filter((c) => c.isMajor).length} /> foyers groupés se détachent.</>}
          </p>
          {!hot && <p className="max-w-3xl text-[17px] leading-relaxed text-ink-soft">Brûlages agricoles, sites industriels. Les feux de végétation, c&apos;est surtout de juin à septembre.</p>}
        </header>

        <WhatPointsShow />

        <FirePageClient
          geojson={geojson}
          cities={citiesFR}
          totalCount={points.length}
          highConf={highConf}
          hasFrp={hasFrp}
          maxFrp={maxFrp}
          peakDay={peakDay}
          peakCount={peakCount}
          days={days}
          byDay={byDay}
          regionRanking={regionRanking}
          autresCount={autresCount}
          zoneWeather={zoneWeather}
          clusters={clusters}
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/signaux">Les signaux du mois <Arrow /></ButtonLink>
            <ButtonLink href="/r" variant="ghost">Toutes les régions</ButtonLink>
          </div>
          <p className="text-[13px] text-mute">
            Source : NASA FIRMS, capteur VIIRS (Suomi NPP), fichier Europe 7 jours. Regroupement des points à moins de 5&#8239;km par un calcul de distance, sans intelligence artificielle. Qualité de l&apos;air : Copernicus CAMS ; vent : Open-Meteo.{" "}
            <Link href="/a-propos" className="underline underline-offset-2">Méthode détaillée</Link>.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
