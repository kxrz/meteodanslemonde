import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/profil"],
      },
      // Crawlers IA — accès explicite au contenu public + llms.txt
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Googlebot-Extended", "anthropic-ai", "cohere-ai"],
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/", "/admin/", "/profil"],
      },
    ],
    sitemap: "https://www.cestchaud.fr/sitemap.xml",
    host: "https://www.cestchaud.fr",
  }
}
