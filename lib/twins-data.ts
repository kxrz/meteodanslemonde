// Accès aux données des jumeaux côté serveur (pages, images story, jeu).

import citiesFRRaw from "@/data/cities-fr.json"
import citiesWorldRaw from "@/data/cities-world.json"
import climateFull from "@/data/climate-full.json"
import { findTwins2050, type TwinClimate } from "@/lib/twins"
import { slugify } from "@/lib/slugify"
import type { Season } from "@/lib/season"

export interface FrCity { id: string; name: string; slug: string; lat: number; lon: number; region: string }
export interface WorldCity { id: string; name: string; country: string; lat: number; lon: number }

export const FR_CITIES: FrCity[] = (citiesFRRaw as Omit<FrCity, "slug">[]).map((c) => ({
  id: c.id, name: c.name, slug: slugify(c.name), lat: c.lat, lon: c.lon, region: c.region,
}))

export const WORLD_CITIES: WorldCity[] = (citiesWorldRaw as WorldCity[]).map((c) => ({
  id: c.id, name: c.name, country: c.country, lat: c.lat, lon: c.lon,
}))

export const CLIMATE = climateFull as unknown as Record<string, TwinClimate>

export const DEFAULT_CITY = "paris"

/** Ville demandée par ?ville=slug ; Paris si absente ou inconnue. */
export function cityFromSlug(slug: string | undefined | null): FrCity {
  return FR_CITIES.find((c) => c.slug === slug) ?? FR_CITIES.find((c) => c.slug === DEFAULT_CITY)!
}

export function twinsOf(city: FrCity) {
  return findTwins2050(city.id, WORLD_CITIES, CLIMATE)
}

/** « en hiver », « au printemps », « en été », « en automne » */
export function inSeason(s: Season): string {
  return s === "printemps" ? "au printemps" : s === "ete" ? "en été" : `en ${s}`
}
