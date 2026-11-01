import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // polices lues depuis public/fonts par les images générées (stories, OG)
  outputFileTracingIncludes: { "/**/*": ["./public/fonts/**"] },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "meteo.leswww.com" }],
        destination: "https://www.cestchaud.fr/:path*",
        permanent: true,
      },
      // v2 : pages fusionnées
      { source: "/carte", destination: "/#carte", permanent: true },
      { source: "/en/france", destination: "/", permanent: true },
      { source: "/alertes", destination: "/signaux", permanent: true },
      { source: "/feux", destination: "/signaux/anomalies-thermiques", permanent: true },
      { source: "/explorer", destination: "/jumeaux", permanent: true },
      { source: "/jeu", destination: "/jumeaux/jeu", permanent: true },
    ]
  },
};

export default nextConfig;
