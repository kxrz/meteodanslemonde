// Point d'entrée unique vers Open-Meteo, côté serveur.
//
// Sans clé : API gratuite (usage non commercial, ~10 000 appels/jour).
// Avec la variable d'environnement OPEN_METEO_API_KEY (abonnement Open-Meteo) : on bascule
// automatiquement sur les hôtes « customer-… » et on ajoute `apikey`. Rien d'autre à changer.
//
// La clé ne doit JAMAIS partir dans le navigateur : les composants client passent par
// le relais /api/meteo/[service] (voir app/api/meteo/[service]/route.ts) via `meteoClientUrl`.

export type MeteoService = "forecast" | "archive" | "air-quality" | "climate"

const HOSTS: Record<MeteoService, { free: string; paid: string; path: string }> = {
  forecast: { free: "api.open-meteo.com", paid: "customer-api.open-meteo.com", path: "/v1/forecast" },
  archive: { free: "archive-api.open-meteo.com", paid: "customer-archive-api.open-meteo.com", path: "/v1/archive" },
  "air-quality": { free: "air-quality-api.open-meteo.com", paid: "customer-air-quality-api.open-meteo.com", path: "/v1/air-quality" },
  climate: { free: "climate-api.open-meteo.com", paid: "customer-climate-api.open-meteo.com", path: "/v1/climate" },
}

export const METEO_SERVICES = Object.keys(HOSTS) as MeteoService[]

type Params = Record<string, string | number | boolean | undefined | null>

function query(params: Params): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v))
  return q.toString()
}

/** URL Open-Meteo complète, avec la clé si elle est configurée. À n'utiliser que côté serveur. */
export function meteoUrl(service: MeteoService, params: Params, apiKey = process.env.OPEN_METEO_API_KEY): string {
  const h = HOSTS[service]
  const key = apiKey?.trim()
  const qs = query(key ? { ...params, apikey: key } : params)
  // Les listes de coordonnées « 1.2,3.4 » restent lisibles : URLSearchParams encode les virgules
  return `https://${key ? h.paid : h.free}${h.path}?${qs.replace(/%2C/g, ",")}`
}

/** URL du relais interne, pour les composants client (aucune clé dans le navigateur). */
export function meteoClientUrl(service: MeteoService, params: Params): string {
  return `/api/meteo/${service}?${query(params).replace(/%2C/g, ",")}`
}

export function hasPaidKey(): boolean {
  return Boolean(process.env.OPEN_METEO_API_KEY?.trim())
}
