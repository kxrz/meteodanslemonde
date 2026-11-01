// Email quotidien « briefing matinal ». Structure en tables (Outlook), styles en ligne.
// Textes valables toute l'année : vocabulaire de l'écart à la normale, conseils selon les conditions
// réelles du jour (chaleur, gel), jamais « chaleur » codé en dur.

import { fmt, fmtDeltaTemp, fmtTemp } from "@/lib/format"
import { BASE_URL } from "@/lib/resend"
import { anomalyWords } from "@/lib/anomaly"
import { MONTHS, deMonth, seasonOf, type Season } from "@/lib/season"
import { mythOfTheDay } from "@/lib/myths"
import type { SeasonalProjection } from "@/lib/climate-season"
import { EMAIL_COLORS as C, emailFooterText, emailShell, escapeHtml } from "@/lib/email-layout"

const FONT = "Arial,Helvetica,sans-serif"

export interface CityEmailData {
  slug: string
  name: string
  /** ressenti maximal prévu du jour (Open-Meteo), null si la prévision n'a pas répondu */
  apparentTempMax: number | null
  /** normale 1991-2020 du ressenti maximal pour ce mois (ERA5) */
  normal: number | null
  anomaly: number | null
  /** évolution de la normale du mois en 30 ans, lissée sur 3 mois (ERA5) */
  trend?: number | null
  /** saison en cours projetée en 2050 (centrale SSP2-4.5 + fourchette entre scénarios) */
  projection?: SeasonalProjection | null
  /** température minimale prévue (air), pour repérer les nuits de gel */
  tempMin?: number | null
  /** jours consécutifs avec un ressenti ≥ 35 °C */
  caniculeStreak?: number
  climateTwin?: { name: string; country: string } | null
}

const SEASON_2050: Record<Season, string> = {
  hiver: "L'hiver 2050",
  printemps: "Le printemps 2050",
  ete: "L'été 2050",
  automne: "L'automne 2050",
}

/** Couleur du texte d'écart : rouge au-dessus, bleu en dessous, encre autour de la normale. */
export function anomalyColor(a: number | null): string {
  if (a == null) return C.mute
  if (a >= 0.5) return C.chaud
  if (a <= -0.5) return C.froid
  return C.ink
}

/**
 * Conseil du jour, uniquement quand les conditions le justifient (valable en toute saison).
 * Retourne null les jours ordinaires : pas de conseil de principe.
 */
export function dailyAdvice({ apparentTempMax, tempMin, caniculeStreak }: Pick<CityEmailData, "apparentTempMax" | "tempMin" | "caniculeStreak">): { title: string; text: string; tone: "chaud" | "froid" } | null {
  if (apparentTempMax != null && (apparentTempMax >= 35 || (caniculeStreak ?? 0) >= 3)) {
    return {
      title: "Forte chaleur",
      tone: "chaud",
      text: "Évitez les efforts entre 11 h et 19 h, buvez régulièrement sans attendre la soif, et prenez des nouvelles des personnes âgées ou isolées. Fermez volets et fenêtres le jour, aérez la nuit.",
    }
  }
  if (apparentTempMax != null && apparentTempMax >= 30) {
    return {
      title: "Journée chaude",
      tone: "chaud",
      text: "Buvez davantage que d'habitude et décalez les efforts aux heures fraîches.",
    }
  }
  if (tempMin != null && tempMin <= 0) {
    return {
      title: "Nuit de gel",
      tone: "froid",
      text: "Prudence sur les trottoirs et les routes au petit matin. Pensez aux plantes en pot et, si vous croisez une personne à la rue, au 115.",
    }
  }
  if (apparentTempMax != null && apparentTempMax <= -5) {
    return {
      title: "Froid marqué",
      tone: "froid",
      text: "Couvrez les extrémités et limitez les longues expositions. Si vous croisez une personne à la rue, appelez le 115.",
    }
  }
  return null
}

function calloutBlock(title: string, html: string, tone: "chaud" | "froid" | "signal" | "neutre"): string {
  const bar = tone === "chaud" ? C.chaud : tone === "froid" ? C.froid : tone === "signal" ? C.ink : C.line
  const bg = tone === "signal" ? C.signal : C.paper
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 0">
    <tr><td style="background:${bg};border-left:4px solid ${bar};padding:12px 16px">
      <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.ink}">${title}</p>
      <p style="margin:6px 0 0;font-family:${FONT};font-size:14px;color:${C.inkSoft};line-height:1.6">${html}</p>
    </td></tr>
  </table>`
}

function buildCityBlock(city: CityEmailData, month: number, unsubToken?: string): string {
  const { slug, apparentTempMax, anomaly, normal, trend, projection, tempMin, caniculeStreak, climateTwin } = city
  const name = escapeHtml(city.name)
  const monthName = MONTHS[month]
  const season = seasonOf(month)

  const links = `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 0">
    <tr>
      <td style="padding:0 18px 0 0"><a href="${BASE_URL}/a/${slug}" style="font-family:${FONT};font-size:14px;color:${C.ink};font-weight:700;text-decoration:underline">Fiche de ${name} &rarr;</a></td>
      ${unsubToken ? `<td><a href="${BASE_URL}/profil/desabonnement?token=${unsubToken}&amp;city=${encodeURIComponent(slug)}" style="font-family:${FONT};font-size:13px;color:${C.mute};text-decoration:underline">Retirer cette ville</a></td>` : ""}
    </tr>
  </table>`

  // `== null` et non `!x` : un ressenti de 0 °C en hiver est une vraie valeur.
  if (apparentTempMax == null) {
    return `
    <tr><td style="padding:22px 0;border-top:1px solid ${C.line}">
      <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.mute}">${name}</p>
      <p style="margin:8px 0 0;font-family:${FONT};font-size:15px;color:${C.inkSoft};line-height:1.6">Relevé indisponible ce matin : le service de prévision n'a pas répondu. Normale, tendance et projections restent consultables sur la fiche de la ville.</p>
      ${links}
    </td></tr>`
  }

  const advice = dailyAdvice({ apparentTempMax, tempMin, caniculeStreak })
  const blocks: string[] = []

  if (advice) blocks.push(calloutBlock(advice.title, advice.text, advice.tone))

  if ((caniculeStreak ?? 0) >= 3) {
    blocks.push(calloutBlock(
      "Chaleur qui dure",
      `Ressenti maximal &ge; 35&nbsp;°C depuis <strong>${caniculeStreak} jours</strong>. Le corps récupère mal quand la chaleur s'installe. Ce compteur n'est pas la vigilance officielle : consultez <a href="https://vigilance.meteofrance.fr" style="color:${C.ink}">vigilance.meteofrance.fr</a>.`,
      "chaud",
    ))
  }

  if (tempMin != null && tempMin <= 0 && !(advice && advice.title === "Nuit de gel")) {
    blocks.push(calloutBlock("Nuit de gel", `Minimale prévue : ${fmtTemp(tempMin)}.`, "froid"))
  }

  const climateLines: string[] = []
  if (trend != null) {
    climateLines.push(`En 30 ans, la normale ${deMonth(month)} a déjà bougé de <strong>${fmtDeltaTemp(trend)}</strong> à ${name} (ERA5, années 1990 comparées à 2015-2024). Une journée, c'est de la météo ; cette dérive, c'est le climat.`)
  }
  if (projection?.central != null) {
    const range = projection.low != null && projection.high != null && projection.high - projection.low >= 0.1
      ? `, entre ${fmtDeltaTemp(projection.low)} et ${fmtDeltaTemp(projection.high)} selon les scénarios`
      : ""
    climateLines.push(`${SEASON_2050[season]} à ${name} : <strong>${fmtDeltaTemp(projection.central)}</strong> par rapport à 2000-2020 (scénario intermédiaire SSP2-4.5${range}).`)
  }
  if (climateLines.length) {
    blocks.push(calloutBlock("Le climat derrière la météo", climateLines.join("<br><br>"), "neutre"))
  }

  if (climateTwin) {
    blocks.push(calloutBlock(
      "Jumeau du jour",
      `Aujourd'hui, ${name} a le même ressenti maximal que <strong>${escapeHtml(climateTwin.name)}</strong> (${escapeHtml(climateTwin.country)}).`,
      "neutre",
    ))
  }

  const anomalyLine = anomaly != null
    ? `<p style="margin:10px 0 0;font-family:${FONT};font-size:16px;font-weight:700;color:${anomalyColor(anomaly)}">${fmtDeltaTemp(anomaly)} par rapport à un ${monthName} normal${normal != null ? ` (${fmtTemp(normal)})` : ""} : ${anomalyWords(anomaly)}.</p>`
    : `<p style="margin:10px 0 0;font-family:${FONT};font-size:14px;color:${C.mute}">Normale du mois indisponible pour cette ville.</p>`

  return `
    <tr><td style="padding:22px 0;border-top:1px solid ${C.line}">
      <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.mute}">${name}</p>
      <p style="margin:8px 0 0;font-family:${FONT};font-size:44px;font-weight:800;color:${C.ink};line-height:1">${fmt(apparentTempMax, 0)}°<span style="font-size:15px;color:${C.mute};font-weight:400"> ressenti max prévu</span></p>
      ${anomalyLine}
      ${blocks.join("")}
      ${links}
    </td></tr>`
}

function mythBlock(month: number, date: Date): string {
  const myth = mythOfTheDay(seasonOf(month), date)
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px">
    <tr><td style="background:${C.signal};border-radius:16px;padding:20px 22px">
      <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.ink}">Idée reçue du jour</p>
      <p style="margin:10px 0 0;font-family:${FONT};font-size:15px;color:${C.inkSoft};line-height:1.5">« ${escapeHtml(myth.claim)} »</p>
      <p style="margin:8px 0 0;font-family:${FONT};font-size:19px;font-weight:800;color:${C.ink};line-height:1.3">${escapeHtml(myth.answer)}</p>
      <p style="margin:12px 0 0"><a href="${BASE_URL}/idees-recues#${myth.slug}" style="font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink};text-decoration:underline">Comprendre en 1 minute &rarr;</a></p>
    </td></tr>
  </table>`
}

export function buildDailyEmailHtml({
  firstName,
  cities,
  dateLabel,
  month,
  unsubToken,
  date = new Date(),
}: {
  firstName: string
  cities: CityEmailData[]
  dateLabel: string
  month: number
  unsubToken?: string
  date?: Date
}) {
  const cityBlocks = cities.map((c) => buildCityBlock(c, month, unsubToken)).join("")
  const profilUrl = unsubToken ? `${BASE_URL}/profil?token=${unsubToken}` : `${BASE_URL}/notifications`
  const unsubUrl = unsubToken ? `${BASE_URL}/profil/desabonnement?token=${unsubToken}` : `${BASE_URL}/notifications`

  const intro = cities.length === 1
    ? `Le chiffre du jour de <strong>${escapeHtml(cities[0].name)}</strong>, en 10 secondes.`
    : `Le chiffre du jour de vos ${cities.length} villes, en 10 secondes.`

  const header = `
    <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${C.signal}">
      <a href="${BASE_URL}" style="color:${C.signal};text-decoration:none">cestchaud&#8203;.fr</a> &middot; briefing matinal
    </p>
    <p style="margin:6px 0 0;font-family:${FONT};font-size:22px;font-weight:800;color:#ffffff">${escapeHtml(dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1))}</p>`

  const body = `
    <p style="margin:0 0 6px;font-family:${FONT};font-size:15px;color:${C.inkSoft};line-height:1.6">
      ${firstName.trim() ? `Bonjour ${escapeHtml(firstName.trim())},` : "Bonjour,"}<br>${intro}
    </p>
    <p style="margin:0 0 4px;font-family:${FONT};font-size:13px;color:${C.mute};line-height:1.6">
      Ressenti du jour : prévision Open-Meteo de ce matin. Normales : réanalyse ERA5, 1991-2020. Projections : modèles du GIEC (CMIP6).
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cityBlocks}</table>
    ${mythBlock(month, date)}
    <p style="margin:0 0 6px;font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink}">Comment lire ces chiffres</p>
    <p style="margin:0 0 18px;font-family:${FONT};font-size:13px;color:${C.inkSoft};line-height:1.7">
      Le ressenti maximal est la température apparente calculée par Open-Meteo à partir de l'air, de l'humidité, du vent et du rayonnement. La normale est la moyenne de ce ressenti pour le même mois entre 1991 et 2020. L'écart du jour, c'est la différence entre les deux : il se lit pareil en janvier et en juillet. <a href="${BASE_URL}/a-propos" style="color:${C.ink}">La méthode en détail</a>.
    </p>`

  const footer = emailFooterText(`cestchaud.fr &middot; Open-Meteo, Copernicus ERA5 &amp; GIEC CMIP6<br>
    <a href="${profilUrl}" style="color:${C.inkSoft};text-decoration:underline">Gérer mon profil</a> &middot;
    <a href="${unsubUrl}" style="color:${C.inkSoft};text-decoration:underline">Se désabonner</a>`)

  return emailShell({ preheader: `Votre briefing du ${escapeHtml(dateLabel)}`, header, body, footer })
}
