import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const BASE_URL = "https://meteo.leswww.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Comme Ailleurs — Jumeaux climatiques de vos villes françaises",
  description: "Quand il fait 38°C à Lille ou 41°C à Strasbourg, où dans le monde est-ce la normale ? Explorez en temps réel les jumeaux climatiques de 30 villes françaises sur une carte interactive mondiale.",
  keywords: [
    "jumeaux climatiques",
    "canicule France",
    "comparaison météo mondiale",
    "chaleur villes France",
    "ressenti thermique",
    "carte météo interactive",
    "Open-Meteo",
    "changement climatique",
  ],
  authors: [{ name: "leswww.com", url: "https://leswww.com" }],
  creator: "leswww.com",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Comme Ailleurs — Jumeaux climatiques de vos villes",
    description: "38°C à Lille ? Découvrez où dans le monde c'est la normale. Carte interactive des jumeaux climatiques en temps réel.",
    url: BASE_URL,
    siteName: "Comme Ailleurs",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Comme Ailleurs — Jumeaux climatiques de vos villes françaises",
    description: "38°C à Lille ? Découvrez où dans le monde c'est la normale. Carte interactive en temps réel.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "geo.region": "FR",
    "geo.placename": "France",
    "DC.language": "fr",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Comme Ailleurs",
  url: BASE_URL,
  description: "Carte interactive des jumeaux climatiques : comparez le ressenti maximal des villes françaises avec leurs équivalents mondiaux.",
  applicationCategory: "WeatherApplication",
  operatingSystem: "All",
  inLanguage: "fr",
  isAccessibleForFree: true,
  author: {
    "@type": "Organization",
    name: "leswww.com",
    url: "https://leswww.com",
  },
  about: [
    { "@type": "Thing", name: "Météorologie" },
    { "@type": "Thing", name: "Climat" },
    { "@type": "Thing", name: "Canicule" },
    { "@type": "Thing", name: "France" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="antialiased">
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
