import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

export const metadata: Metadata = {
  title: "En vrai, c'est chaud — cestchaud.fr",
  description: "Quand Bordeaux atteint 34°C, où dans le monde est-ce la normale ? Jumeaux climatiques et projections GIEC.",
  metadataBase: new URL("https://cestchaud.fr"),
  openGraph: {
    title: "En vrai, c'est chaud — cestchaud.fr",
    description: "Ressenti max du jour, villes jumelles climatiques, et projections GIEC 2030–2050.",
    url: "https://cestchaud.fr",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og/home.png", width: 1200, height: 630, alt: "En vrai, c'est chaud — cestchaud.fr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "En vrai, c'est chaud — cestchaud.fr",
    description: "Ressenti max du jour, villes jumelles climatiques, et projections GIEC 2030–2050.",
    images: ["/og/home.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,900&display=swap"
          rel="stylesheet"
        />
        <link rel="dns-prefetch" href="https://api.open-meteo.com" />
        <link rel="dns-prefetch" href="https://basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://api.resend.com" />
      </head>
      <body className="h-full">{children}<Analytics /></body>
    </html>
  )
}
