import { MetadataRoute } from "next"
import citiesFR from "@/data/cities-fr.json"
import citiesWorld from "@/data/cities-world.json"
import { slugify } from "@/lib/slugify"

const BASE = "https://www.cestchaud.fr"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/carte`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
    { url: `${BASE}/explorer`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/en/france`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE}/feux`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/terrain`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/citoyens`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 },
    { url: `${BASE}/notifications`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/alertes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/a-propos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/mentions-legales`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/confidentialite`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ]

  const frCityRoutes: MetadataRoute.Sitemap = (citiesFR as { id: string; name: string }[]).map((c) => ({
    url: `${BASE}/a/${slugify(c.name)}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }))

  const worldCityRoutes: MetadataRoute.Sitemap = (citiesWorld as { id: string; name: string }[]).map((c) => ({
    url: `${BASE}/a/${slugify(c.name)}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.6,
  }))

  const regionSlugs = [
    "bretagne", "occitanie", "provence-alpes-cote-d-azur", "auvergne-rhone-alpes",
    "nouvelle-aquitaine", "hauts-de-france", "ile-de-france", "grand-est",
    "pays-de-la-loire", "bourgogne-franche-comte", "normandie", "centre-val-de-loire", "corse",
  ]
  const regionRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/r`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    ...regionSlugs.map((slug) => ({
      url: `${BASE}/r/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]

  return [...staticRoutes, ...regionRoutes, ...frCityRoutes, ...worldCityRoutes]
}
