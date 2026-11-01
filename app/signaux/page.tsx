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
import AnomalyChip from "@/components/ui/AnomalyChip"
import ShareButton from "@/components/ShareButton"
import { ButtonLink, Arrow } from "@/components/ui/Button"
import FrostGap, { type FrostRow } from "@/components/signaux/FrostGap"
import CityCountTable, { type CountRow } from "@/components/signaux/CityCountTable"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { loadFrostNormals, expectedFrostNights } from "@/lib/frost"
import { fetchArchive, lastValidDate, parisISODate, addDays, signalWindow, summarizeSeries, MILD_ANOMALY, type CitySignals } from "@/lib/signals"
import type { CityExtreme } from "@/lib/year-extremes"
import { MONTHS, deMonth, isColdHalf, isHotSeason } from "@/lib/season"
import { slugify } from "@/lib/slugify"
import citiesFR from "@/data/cities-fr.json"
import yearExtremes from "@/data/year-extremes.json"

// Régénérée toutes les 6 heures (l'archive Open-Meteo n'avance qu'une fois par jour).
export const revalidate = 21600

export const metadata: Metadata = {
  title: "Signaux du mois · gel, douceur, nuits tropicales · cestchaud.fr",
  description: "Nuits de gel observées contre nuits attendues, journées très douces, nuits tropicales et séries de chaleur dans 62 villes françaises. Données Open-Meteo et normales 1991-2020.",
  alternates: { canonical: "https://www.cestchaud.fr/signaux" },
}

type City = { id: string; name: string; lat: number; lon: number; region: string }

/** « 30 octobre » */
function dayMonth(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" })
}

function ArchiveError() {
  return (
    <Card tone="signal" className="flex flex-col gap-2">
      <p className="font-display text-xl font-extrabold">Relevé indisponible pour l&apos;instant.</p>
      <p className="text-[15px] leading-snug">
        L&apos;archive météo Open-Meteo n&apos;a pas répondu. Plutôt que d&apos;afficher des zéros trompeurs, on attend le prochain relevé : la page se met à jour toutes les six heures.
      </p>
    </Card>
  )
}

export default async function SignauxPage() {
  const cities = citiesFR as City[]
  const today = parisISODate(new Date())
  const month = Number(today.slice(5, 7)) - 1
  const monthName = MONTHS[month]
  const cold = isColdHalf(month)
  const hot = isHotSeason(month)
  const between = !cold && !hot

  // ── Archive : 40 derniers jours, lots en parallèle ──
  const [archive, weather] = await Promise.all([
    fetchArchive(cities, addDays(today, -40), addDays(today, -2), revalidate),
    getWeatherData(),
  ])
  const okSeries = archive.filter((r) => r.ok)
  const lastDates = okSeries.map((r) => lastValidDate(r.series)).filter((d): d is string => d != null).sort()
  const archiveOk = lastDates.length > 0
  const win = archiveOk ? signalWindow(lastDates[lastDates.length - 1], today) : null
  const windowLabel = !win ? "" : win.kind === "month" ? `depuis le 1er ${MONTHS[Number(win.start.slice(5, 7)) - 1]}` : "sur les 30 derniers jours"
  const windowDetail = !win ? "" : win.kind === "month" ? `du 1er au ${dayMonth(win.end)}` : `du ${dayMonth(win.start)} au ${dayMonth(win.end)}`

  const signals = new Map<string, CitySignals>()
  if (win) for (const r of okSeries) signals.set(r.id, summarizeSeries(r.series, win))

  // ── Gel : observé vs attendu ──
  const frost = loadFrostNormals()
  const frostRows: FrostRow[] = cities.map((c) => {
    const normals = frost?.cities[c.id]
    return {
      id: c.id, name: c.name, slug: slugify(c.name), region: c.region,
      observed: signals.get(c.id)?.frostNights ?? null,
      expected: normals && win ? expectedFrostNights(normals, win.days) : null,
    }
  })
  const withObs = frostRows.filter((r) => r.observed != null)
  const frostObserved = withObs.reduce((s, r) => s + r.observed!, 0)
  const comparable = withObs.filter((r) => r.expected != null)
  const hasNormals = comparable.length > 0
  const frostExpected = Math.round(comparable.reduce((s, r) => s + r.expected!, 0) * 10) / 10
  const frostObservedComparable = comparable.reduce((s, r) => s + r.observed!, 0)
  const frostRatio = hasNormals && frostExpected > 0 ? frostObservedComparable / frostExpected : null

  // ── Chaleur : nuits tropicales, séries ≥ 35 °C ──
  const sigRows = cities.flatMap((c) => {
    const s = signals.get(c.id)
    return s ? [{ id: c.id, name: c.name, slug: slugify(c.name), region: c.region, ...s }] : []
  })
  const tropicalRows: CountRow[] = sigRows.filter((r) => r.tropicalNights > 0).sort((a, b) => b.tropicalNights - a.tropicalNights).map((r) => ({ ...r, values: [r.tropicalNights] }))
  const tropicalTotal = tropicalRows.reduce((s, r) => s + r.values[0], 0)
  const heatRows: CountRow[] = sigRows
    .filter((r) => r.heatStreakLongest > 0)
    .sort((a, b) => b.heatStreakCurrent - a.heatStreakCurrent || b.heatStreakLongest - a.heatStreakLongest)
    .map((r) => ({ ...r, values: [r.heatStreakCurrent, r.heatStreakLongest] }))
  const inStreak = sigRows.filter((r) => r.heatStreakCurrent > 0).length
  const missingCities = cities.length - sigRows.length
  const plural = missingCities > 1 ? "s" : ""

  // ── Journées très douces : relevé du jour vs normale du mois ──
  const climate = loadClimateMap()
  const dataDate = new Date(weather.fetchedAt)
  const dataMonth = dataDate.getMonth()
  const hasToday = weather.citiesFR.some((c) => c.apparent_temp_max !== 0 || c.temp_min !== 0)
  const mild = hasToday
    ? weather.citiesFR
        .map((c) => {
          const normal = climate[c.id]?.normal?.[dataMonth]
          return { id: c.id, name: c.name, slug: slugify(c.name), anomaly: normal != null ? Math.round((c.apparent_temp_max - normal) * 10) / 10 : null }
        })
        .filter((c): c is { id: string; name: string; slug: string; anomaly: number } => c.anomaly != null && c.anomaly >= MILD_ANOMALY)
        .sort((a, b) => b.anomaly - a.anomaly)
    : []
  const todayLabel = dataDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" })

  // ── Vrai minimum de l'année ──
  const extremes = yearExtremes as Record<string, CityExtreme>
  const coldest = cities
    .flatMap((c) => {
      const e = extremes[c.id]
      return e?.minTempLow != null && e.minTempLowDate ? [{ id: c.id, name: c.name, slug: slugify(c.name), low: e.minTempLow, date: e.minTempLowDate }] : []
    })
    .sort((a, b) => a.low - b.low)
    .slice(0, 5)
  const year = today.slice(0, 4)

  // ── Le chiffre choc du haut de page ──
  const expRounded = Math.round(frostExpected)
  const shock: { tone: "froid" | "chaud"; value: number; from?: number; of?: number; line: string; sub?: string; share: string } | null = !archiveOk
    ? hasToday && !hot
      ? {
          tone: "chaud",
          value: mild.length,
          of: weather.citiesFR.length,
          line: "villes très douces aujourd'hui.",
          sub: `Au moins +${MILD_ANOMALY} °C au-dessus de la normale ${deMonth(dataMonth)}. Le relevé des dernières semaines, lui, n'a pas pu être chargé.`,
          share: `${mild.length} villes françaises sur ${weather.citiesFR.length} à +${MILD_ANOMALY} °C ou plus de leur normale aujourd'hui.`,
        }
      : null
    : hot
    ? {
        tone: "chaud",
        value: tropicalTotal,
        line: `${tropicalTotal > 1 ? "nuits tropicales" : "nuit tropicale"} ${windowLabel}.`,
        sub: `Des nuits à 20 °C ou plus, cumulées dans nos ${cities.length} villes. ${inStreak} ville${inStreak > 1 ? "s" : ""} en pleine série à 35 °C ressentis.`,
        share: `${tropicalTotal} nuits sans redescendre sous 20 °C dans nos villes ${windowLabel}. La chaleur ne redescend plus.`,
      }
    : frostRatio == null
      ? {
          tone: "froid",
          value: frostObserved,
          line: `${frostObserved > 1 ? "nuits" : "nuit"} de gel ${windowLabel}.`,
          sub: `Cumulées dans nos ${cities.length} villes. La comparaison à la normale arrive bientôt.`,
          share: `${frostObserved} ${frostObserved > 1 ? "nuits" : "nuit"} de gel ${windowLabel} dans ${cities.length} villes françaises.`,
        }
      : {
          tone: "froid",
          value: frostObservedComparable,
          from: expRounded,
          of: expRounded,
          line: frostRatio < 0.8
            ? `${frostObservedComparable > 1 ? "nuits" : "nuit"} de gel ${windowLabel}. Il en fallait ${expRounded}.`
            : frostRatio > 1.2
              ? `${frostObservedComparable > 1 ? "nuits" : "nuit"} de gel ${windowLabel}. Plus que les ${expRounded} attendues.`
              : `${frostObservedComparable > 1 ? "nuits" : "nuit"} de gel ${windowLabel}. Autant que les ${expRounded} attendues.`,
          sub: frostRatio < 0.8
            ? `Le gel manque dans nos ${cities.length} villes.`
            : frostRatio > 1.2
              ? "Une période froide. Elle n'efface pas la tendance : le gel recule depuis 30 ans."
              : "Une période dans la normale. C'est sur 30 ans que le gel recule.",
          share: frostRatio < 0.8
            ? `${frostObservedComparable} nuits de gel sur ${expRounded} attendues dans ${cities.length} villes françaises ${windowLabel}. L'hiver ne fait plus son travail.`
            : `${frostObservedComparable} nuits de gel pour ${expRounded} attendues dans ${cities.length} villes françaises ${windowLabel}.`,
        }

  const title = cold
    ? <>Ce que l&apos;hiver <Hl tone="froid">ne fait plus</Hl>.</>
    : hot
      ? <>Quand la chaleur <Hl tone="chaud">ne redescend plus</Hl>.</>
      : <>Entre deux saisons, les signaux <Hl>se croisent</Hl>.</>

  return (
    <PageShell crumbs={[{ label: "Signaux du mois" }]}>
      <div className="flex flex-col gap-16 sm:gap-20">
        {/* ── Accroche ── */}
        <header className="flex flex-col gap-6 pt-4 sm:pt-8">
          <Eyebrow>Signaux {deMonth(month)} · {cities.length} villes françaises</Eyebrow>
          <Title as="h1" size="hero" animate className="max-w-5xl">{title}</Title>
          {!shock ? (
            <Card tone="signal" className="flex flex-col gap-2">
              <p className="font-display text-xl font-extrabold">Relevé indisponible.</p>
              <p className="text-[15px] leading-snug">L&apos;archive météo n&apos;a pas répondu. Pas de zéros inventés : on réessaie dans quelques heures.</p>
            </Card>
          ) : (
            <Card tone={shock.tone} className="flex flex-col gap-4 p-6 sm:p-10">
              <p className="font-display font-extrabold leading-[0.85] tracking-tight">
                <span className="text-[clamp(6rem,30vw,12rem)]"><Num value={shock.value} from={shock.from} /></span>
                {shock.of != null && <span className="text-[clamp(2.4rem,11vw,4.5rem)] text-white/70">&#8239;/&#8239;{shock.of}</span>}
              </p>
              <p className="max-w-2xl font-display text-[clamp(1.4rem,5.5vw,2.2rem)] font-extrabold leading-tight">{shock.line}</p>
              {shock.sub && <p className="max-w-2xl text-[16px] leading-snug text-white/85">{shock.sub}</p>}
              <div><ShareButton text={shock.share} url="https://www.cestchaud.fr/signaux" label="Partager ce chiffre" variant="prominent" /></div>
            </Card>
          )}
        </header>

        {/* ── Le gel qui manque ── */}
        {(cold || between) && (
          <Section
            id="gel"
            eyebrow={win ? `Nuits de gel · ${windowDetail}` : "Nuits de gel"}
            title={<>Le gel <Hl tone="froid">qui manque</Hl>.</>}
            intro={
              <>
                Nuit de gel : minimale sous 0&#8239;°C <Explain term="nuitGel" />. On compare à la normale 1991-2020 <Explain term="normale" />, à la même date.
                {hasNormals && " Basculez : la barre fantôme, c'est le gel attendu."}
              </>
            }
          >
            {archiveOk ? <FrostGap rows={frostRows} windowLabel={windowLabel} limit={cold ? 12 : 6} /> : <ArchiveError />}
            {win?.kind === "rolling" && (
              <p className="text-[13px] text-mute">Le mois vient de commencer : on regarde les 30 derniers jours disponibles, et la normale est calculée jour par jour sur la même période.</p>
            )}
          </Section>
        )}

        {/* ── Journées très douces ── */}
        {(cold || between) && (
          <Section
            id="douceur"
            eyebrow={`Relevé du ${todayLabel}`}
            title={<>Des journées <Hl tone="chaud">très douces</Hl>.</>}
            intro={<>Ressenti à +{MILD_ANOMALY}&#8239;°C ou plus de la normale {deMonth(dataMonth)} <Explain term="anomalie" />. Le froid fait les gros titres. La douceur, rarement.</>}
          >
            {!hasToday ? (
              <Card tone="signal"><p className="font-display text-lg font-bold">Le relevé du jour n&apos;est pas encore arrivé.</p></Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <Card tone="chaud">
                  <Stat invert label="Villes très douces" value={<><Num value={mild.length} /><span className="text-white/60">/{weather.citiesFR.length}</span></>} sub={`à +${MILD_ANOMALY} °C ou plus de leur normale`} explain="anomalie" />
                </Card>
                <Card tone="white">
                  {mild.length === 0 ? (
                    <p className="text-[15px] leading-snug">Aucune ville n&apos;est à +{MILD_ANOMALY}&#8239;°C de sa normale aujourd&apos;hui. Une journée ordinaire ne contredit pas la tendance : c&apos;est la répétition qui compte.</p>
                  ) : (
                    <>
                      <ul className="flex flex-wrap gap-2" aria-label="Villes très douces aujourd'hui">
                        {mild.slice(0, 12).map((c) => (
                          <li key={c.id}>
                            <Link href={`/a/${c.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-line bg-paper pl-4 pr-1.5 font-display text-[15px] font-bold hover:border-ink">
                              {c.name} <AnomalyChip value={c.anomaly} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {mild.length > 12 && (
                        <details className="mt-3 group">
                          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full border-2 border-ink px-4 font-display text-[14px] font-bold hover:bg-ink hover:text-paper">
                            <span className="group-open:hidden">Voir les {mild.length - 12} autres villes</span>
                            <span className="hidden group-open:inline">Masquer</span>
                          </summary>
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {mild.slice(12).map((c) => (
                              <li key={c.id}>
                                <Link href={`/a/${c.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-line bg-paper pl-4 pr-1.5 font-display text-[15px] font-bold hover:border-ink">
                                  {c.name} <AnomalyChip value={c.anomaly} />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </>
                  )}
                </Card>
              </div>
            )}
          </Section>
        )}

        {/* ── Vrai minimum de l'année ── */}
        {cold && coldest.length > 0 && (
          <Section id="minimum" eyebrow={`Minimum ${year}`} title={<>Le plus froid de l&apos;année, <Hl tone="froid">jusqu&apos;ici</Hl>.</>} intro="La température la plus basse relevée depuis le 1er janvier, nuit comprise.">
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-anim="stagger">
              {coldest.map((c, i) => (
                <li key={c.id}>
                  <Card href={`/a/${c.slug}`} tone={i === 0 ? "froid" : "white"} className="flex h-full flex-col gap-1">
                    <span className="font-display text-[clamp(2rem,5vw,2.6rem)] font-extrabold leading-none"><Num value={c.low} decimals={1} unit="&#8239;°C" /></span>
                    <span className="font-display text-[17px] font-bold">{c.name}</span>
                    <span className={i === 0 ? "text-[13px] text-white/80" : "text-[13px] text-mute"}>le {dayMonth(c.date)}</span>
                  </Card>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* ── Nuits tropicales ── */}
        {(hot || between) && (
          <Section
            id="nuits-tropicales"
            eyebrow={win ? `Nuits tropicales · ${windowDetail}` : "Nuits tropicales"}
            title={<>Des nuits qui <Hl tone="chaud">ne rafraîchissent plus</Hl>.</>}
            intro={<>Nuit tropicale : minimale à 20&#8239;°C ou plus <Explain term="nuitTropicale" />. Le corps ne récupère pas. C&apos;est la nuit que la chaleur devient dangereuse.</>}
          >
            {!archiveOk ? <ArchiveError /> : tropicalRows.length === 0 ? (
              <Card tone="paper"><p className="text-[15px] leading-snug"><strong>Aucune nuit tropicale {windowLabel}.</strong> Toutes les nuits sont descendues sous 20&#8239;°C dans les {sigRows.length} villes relevées.</p></Card>
            ) : (
              <>
                <CityCountTable caption={`Nuits tropicales ${windowLabel}, par ville`} columns={["Nuits"]} unit="" rows={between ? tropicalRows.slice(0, 6) : tropicalRows.slice(0, 20)} max={win?.days.length ?? 30} />
                <p className="text-[13px] text-mute">{sigRows.length - tropicalRows.length} ville{sigRows.length - tropicalRows.length > 1 ? "s" : ""} sans nuit tropicale {windowLabel}{tropicalRows.length > 20 && !between ? ` · ${tropicalRows.length - 20} autres villes touchées non affichées` : ""}.</p>
              </>
            )}
          </Section>
        )}

        {/* ── Séries de chaleur ── */}
        {(hot || between) && (
          <Section
            id="series"
            eyebrow={win ? `Ressenti ≥ 35 °C · ${windowDetail}` : "Ressenti ≥ 35 °C"}
            title={<>La chaleur qui <Hl tone="chaud">dure</Hl>.</>}
            intro={<>Jours d&apos;affilée à 35&#8239;°C ressentis ou plus <Explain term="ressenti" />. Un jour chaud, c&apos;est de la météo. La durée, c&apos;est ce qui épuise.</>}
          >
            {!archiveOk ? <ArchiveError /> : heatRows.length === 0 ? (
              <Card tone="paper"><p className="text-[15px] leading-snug"><strong>Aucune journée à 35&#8239;°C de ressenti {windowLabel}.</strong></p></Card>
            ) : (
              <CityCountTable caption={`Séries de jours à ressenti de 35 °C ou plus ${windowLabel}, par ville`} columns={["En cours", "Plus longue"]} rows={heatRows.slice(0, between ? 6 : 20)} max={Math.max(...heatRows.map((r) => r.values[1]))} />
            )}
          </Section>
        )}

        {/* ── Anomalies thermiques ── */}
        {(hot || between) && (
          <Card href="/signaux/anomalies-thermiques" tone="ink" className="flex flex-col gap-3 sm:p-8">
            <Eyebrow className="text-paper/70">Vu de l&apos;espace</Eyebrow>
            <p className="max-w-3xl font-display text-[clamp(1.5rem,3.4vw,2.4rem)] font-extrabold leading-tight">Les anomalies thermiques repérées par satellite cette semaine.</p>
            <p className="max-w-2xl text-[15px] text-paper/80">Feux, brûlages, sites industriels : ce que voit le capteur VIIRS de la NASA, et comment le lire sans se tromper.</p>
            <span className="inline-flex items-center gap-1 font-display font-bold text-signal">Voir la carte <Arrow /></span>
          </Card>
        )}

        {/* ── Pied ── */}
        <div className="flex flex-col gap-4">
          {missingCities > 0 && archiveOk && (
            <p className="text-[13px] text-mute">Relevé indisponible pour {missingCities} ville{plural} sur {cities.length} : signalée{plural} comme telle{plural} dans les tableaux, jamais comptée{plural} à zéro.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/">L&apos;écart du jour <Arrow /></ButtonLink>
            <ButtonLink href="/idees-recues" variant="ghost">« Il fait froid, donc… »</ButtonLink>
          </div>
          <p className="text-[13px] text-mute">
            Sources : minimales et ressentis quotidiens Open-Meteo (archive ERA5), {frost ? `normales de gel ${frost.period} calculées sur la même archive` : "normales de gel 1991-2020 en cours de calcul"}, normales de ressenti Copernicus ERA5.
            {win && <> Dernier jour disponible : {dayMonth(win.end)}.</>}{" "}
            <Link href="/a-propos" className="underline underline-offset-2">Méthode détaillée</Link>.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
