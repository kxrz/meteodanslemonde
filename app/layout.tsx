import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const BASE_URL = "https://meteo.leswww.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Chaud comme là — Jumeaux climatiques",
  description: "Quand il fait 38°C à Lille, où dans le monde est-ce la normale ? Explorez les jumeaux climatiques de vos villes françaises en temps réel.",
  keywords: [
    "jumeaux climatiques",
    "canicule France",
    "comparaison météo mondiale",
    "chaleur villes France",
    "ressenti thermique",
    "carte météo interactive",
    "changement climatique",
  ],
  authors: [{ name: "leswww.com", url: "https://leswww.com" }],
  creator: "leswww.com",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Chaud comme là.",
    description: "38°C à Lille ? Découvrez où dans le monde c’est la normale. Carte interactive des jumeaux climatiques.",
    url: BASE_URL,
    siteName: "Chaud comme là",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Chaud comme là — Jumeaux climatiques de vos villes françaises",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaud comme là.",
    description: "38°C à Lille ? Découvrez où dans le monde c’est la normale.",
    images: ["/og-image.png"],
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
  name: "Chaud comme là",
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
      <body className="bg-neutral-50 text-neutral-900">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
