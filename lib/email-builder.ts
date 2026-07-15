import { fmt, fmtDelta } from "@/lib/format"
import { BASE_URL } from "@/lib/resend"

export interface CityEmailData {
  slug: string
  name: string
  apparentTempMax: number | null
  anomaly: number | null
  proj2050: number | null
  normal: number | null
  caniculeStreak?: number
  climateTwin?: { name: string; country: string } | null
}

function anomalyLabel(a: number): { label: string; color: string; severity: string } {
  if (a >= 8)  return { label: "Chaleur extrême", color: "#dc2626", severity: "extreme" }
  if (a >= 5)  return { label: "Chaleur très forte", color: "#ea580c", severity: "high" }
  if (a >= 2)  return { label: "Chaleur notable", color: "#f97316", severity: "medium" }
  if (a >= 0)  return { label: "Légèrement au-dessus des normales", color: "#f59e0b", severity: "low" }
  if (a >= -2) return { label: "Proche des normales", color: "#6b7280", severity: "normal" }
  return       { label: "En dessous des normales", color: "#3b82f6", severity: "cool" }
}

function healthAdvice(severity: string): string {
  switch (severity) {
    case "extreme":
      return "Restez à l'intérieur entre 11h et 19h, hydratez-vous régulièrement (au moins 1,5 L d'eau) et vérifiez sur vos proches âgés ou isolés. Le corps peut se déshydrater sans ressentir la soif en forte chaleur."
    case "high":
      return "Limitez les efforts physiques aux heures fraîches (avant 10h, après 19h). Pensez à aérer la nuit et à occulter les fenêtres exposées au soleil dans la journée."
    case "medium":
      return "Hydratez-vous davantage que d'habitude et évitez l'exposition directe au soleil aux heures de pointe. Une douche fraîche en milieu de journée aide à réguler la température corporelle."
    default:
      return "Les conditions sont supportables, mais restez attentif à votre hydratation tout au long de la journée."
  }
}

function climateNarrative(anomaly: number, proj2050: number | null, month: number): string {
  const monthNames = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"]
  const m = monthNames[month]
  let text = ""

  if (anomaly >= 5) {
    text = `Un écart de ${fmtDelta(anomaly)}°C par rapport aux normales de ${m} est statistiquement exceptionnel. Ce type d'événement, rare il y a 30 ans, devient plus fréquent à mesure que les moyennes de fond augmentent.`
  } else if (anomaly >= 2) {
    text = `${fmtDelta(anomaly)}°C au-dessus des normales de ${m}. Ce type de journée s'observe plus souvent depuis les années 2000, reflet d'un réchauffement de fond progressif.`
  } else {
    text = `Les températures restent proches des normales de ${m}, même si la tendance de long terme continue à faire monter ces normales d'environ +0,2°C par décennie.`
  }

  if (proj2050 !== null) {
    text += ` Selon le scénario GIEC SSP2-4.5, cette région pourrait connaître ${fmtDelta(proj2050)}°C supplémentaires en été d'ici 2050 par rapport à la période 1981-2010.`
  }

  return text
}

function buildCityBlock(city: CityEmailData, month: number, unsubToken?: string): string {
  const { slug, name, apparentTempMax, anomaly, proj2050, normal, caniculeStreak, climateTwin } = city

  if (!apparentTempMax) {
    return `
      <tr>
        <td style="padding:24px 0;border-top:1px solid #f3f4f6">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af">${name}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#9ca3af">Données météo indisponibles aujourd'hui (couverture nuageuse ou station hors ligne).</p>
        </td>
      </tr>`
  }

  const info = anomaly !== null ? anomalyLabel(anomaly) : null
  const advice = info ? healthAdvice(info.severity) : ""
  const narrative = anomaly !== null ? climateNarrative(anomaly, proj2050, month) : ""

  return `
    <tr>
      <td style="padding:24px 0;border-top:1px solid #f3f4f6">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af">${name}</p>

        <p style="margin:8px 0 0;font-size:40px;font-weight:900;color:#111111;line-height:1">
          ${fmt(apparentTempMax)}°
          <span style="font-size:16px;color:#9ca3af;font-weight:400"> ressenti max aujourd'hui</span>
        </p>

        ${info && anomaly !== null ? `
        <p style="margin:8px 0 0;font-size:14px;font-weight:700;color:${info.color}">${info.label} &mdash; ${anomaly > 0 ? "+" : ""}${anomaly}°C vs normale de saison${normal !== null ? ` (${fmt(normal)}°C)` : ""}</p>
        ` : ""}

        ${advice ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0">
          <tr>
            <td style="background:#fffbeb;border-left:3px solid #f97316;border-radius:0 8px 8px 0;padding:12px 16px">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#92400e">Conseils du jour</p>
              <p style="margin:6px 0 0;font-size:13px;color:#78350f;line-height:1.6">${advice}</p>
            </td>
          </tr>
        </table>
        ` : ""}

        ${caniculeStreak && caniculeStreak >= 3 ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0">
          <tr>
            <td style="background:#fef2f2;border-left:3px solid #dc2626;border-radius:0 8px 8px 0;padding:12px 16px">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#991b1b">Alerte canicule</p>
              <p style="margin:6px 0 0;font-size:13px;color:#7f1d1d;line-height:1.6">Episode en cours depuis <strong>${caniculeStreak} jour${caniculeStreak > 1 ? "s" : ""}</strong> (ressenti &ge; 35°C). Un épisode caniculaire prolongé est le facteur de risque le plus dangereux : le corps ne récupère pas entre les journées.</p>
            </td>
          </tr>
        </table>
        ` : caniculeStreak && caniculeStreak > 0 ? `
        <p style="margin:14px 0 0;font-size:13px;color:#dc2626;font-weight:600">Ressenti &ge; 35°C depuis ${caniculeStreak} jour${caniculeStreak > 1 ? "s" : ""} &mdash; seuil d'alerte canicule.</p>
        ` : ""}

        ${climateTwin ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0">
          <tr>
            <td style="background:#f0fdf4;border-left:3px solid #16a34a;border-radius:0 8px 8px 0;padding:12px 16px">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#14532d">Jumeau climatique du jour</p>
              <p style="margin:6px 0 0;font-size:13px;color:#166534;line-height:1.6">Aujourd'hui, <strong>${name}</strong> vit la même chaleur que <strong>${climateTwin.name}</strong> (${climateTwin.country}). Une façon concrète de visualiser votre ressenti à l'échelle mondiale.</p>
            </td>
          </tr>
        </table>
        ` : ""}

        ${narrative ? `
        <p style="margin:14px 0 0;font-size:13px;color:#6b7280;line-height:1.7">${narrative}</p>
        ` : ""}

        <p style="margin:14px 0 0;display:flex;gap:16px;align-items:center">
          <a href="${BASE_URL}/a/${slug}" style="font-size:12px;color:#f97316;font-weight:600;text-decoration:none">Voir la carte climatique de ${name} &rarr;</a>
          ${unsubToken ? `<a href="${BASE_URL}/api/unsubscribe-city?token=${unsubToken}&city=${slug}" style="font-size:11px;color:#d1d5db;text-decoration:none">Retirer cette ville</a>` : ""}
        </p>
      </td>
    </tr>`
}

export function buildDailyEmailHtml({
  firstName,
  cities,
  dateLabel,
  month,
  unsubToken,
}: {
  firstName: string
  cities: CityEmailData[]
  dateLabel: string
  month: number
  unsubToken?: string
}) {
  const cityBlocks = cities.map(c => buildCityBlock(c, month, unsubToken)).join("")
  const unsubUrl = unsubToken
    ? `${BASE_URL}/api/confirm?token=${unsubToken}`
    : `${BASE_URL}/api/confirm?token=unsub`

  const intro = cities.length === 1
    ? `Voici votre briefing thermique pour <strong>${cities[0].name}</strong>.`
    : `Voici votre briefing thermique pour vos ${cities.length} villes suivies.`

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'DM Sans',system-ui,sans-serif;color:#111111">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden">

        <tr>
          <td style="background:#f97316;padding:24px 36px">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#ffffff">
              <a href="${BASE_URL}" style="color:#ffffff;text-decoration:none">cestchaud&#8203;.fr</a> &middot; briefing matinal
            </p>
            <p style="margin:6px 0 0;font-size:20px;font-weight:900;color:#ffffff;text-transform:capitalize">${dateLabel}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 36px 8px">
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.6">
              Bonjour ${firstName},<br>
              ${intro}
              Chaque matin, nous compilons pour vous les données ERA5 de la veille et les projections climatiques GIEC CMIP6.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${cityBlocks}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 36px;background:#f9fafb;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:12px;font-weight:700;color:#374151">Pourquoi ces chiffres ?</p>
            <p style="margin:6px 0 0;font-size:12px;color:#6b7280;line-height:1.7">
              Le "ressenti max" combine température, humidité et vent (indice UTCI). Les normales de saison sont calculées sur la période ERA5 1981-2010. L'anomalie mesure l'écart entre aujourd'hui et cette référence historique pour le même mois. Les projections 2050 sont issues du modèle CMIP6 sous scénario SSP2-4.5 (trajectoire intermédiaire).
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 36px 28px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center">
              cestchaud.fr &middot; données ERA5 &amp; GIEC CMIP6 &middot;
              <a href="${unsubUrl}" style="color:#d1d5db">Se désabonner</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
