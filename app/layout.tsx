import type { Metadata } from "next";
import { Eczar, Spectral } from "next/font/google";
import "./globals.css";

const eczar = Eczar({
  variable: "--font-eczar",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

const BASE_URL = "https://today.doops.site";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:
      "Daily Astrology | Vedic Astrology & Personalized Nakshatra Readings",
    template: "%s | Daily Astrology",
  },
  description:
    "Unlock ancient Vedic wisdom with modern AI. Get your personalized daily Nakshatra reading, transit insights, and cosmic guidance tailored to your birth star.",
  keywords: [
    "Vedic Astrology",
    "Nakshatra reading",
    "daily horoscope",
    "Jyotish",
    "AI astrology",
    "birth star",
    "Nakshatra",
    "know my day",
    "daily astrology",
    "cosmic guidance",
    "astrology app",
    "personalized astrology",
    "Indian astrology",
    "planetary transits",
  ],
  authors: [{ name: "Daily Astrology", url: BASE_URL }],
  creator: "Daily Astrology",
  publisher: "Daily Astrology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title:
      "Daily Astrology | Vedic Astrology & Personalized Daily Nakshatra Readings",
    description:
      "Unlock ancient Vedic wisdom with modern AI. Get your personalized daily Nakshatra reading, transit insights, and cosmic guidance tailored to your birth star.",
    url: BASE_URL,
    siteName: "Daily Astrology",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Daily Astrology — Vedic Nakshatra Readings powered by AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Daily Astrology | Vedic Astrology & Personalized Nakshatra Readings",
    description:
      "Unlock ancient Vedic wisdom with modern AI. Get your personalized daily Nakshatra reading, transit insights, and cosmic guidance tailored to your birth star.",
    images: [`${BASE_URL}/opengraph-image`],
    creator: "@dailyastrology",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  verification: {
    // Add your Google Search Console verification token here when available:
    // google: "YOUR_GOOGLE_VERIFICATION_TOKEN",
  },
  category: "astrology",
};

/** JSON-LD structured data for rich Google results */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Daily Astrology",
      description:
        "Personalized Vedic Nakshatra readings powered by modern AI.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/reading?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE_URL}/#app`,
      name: "Daily Astrology",
      url: BASE_URL,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web, Android, iOS",
      description:
        "Unlock ancient Vedic wisdom with modern AI. Get your personalized daily Nakshatra reading, real-time transit insights, and cosmic guidance tailored to your birth star.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      author: {
        "@type": "Organization",
        name: "Daily Astrology",
        url: BASE_URL,
      },
      featureList: [
        "Personalized Nakshatra reading",
        "Real-time planetary transits",
        "Karmic guidance",
        "AI-powered Vedic astrology",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Daily Astrology",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/icon-512.png`,
        width: 512,
        height: 512,
      },
      sameAs: [],
    },
  ],
};

import { AuthProvider } from "@/context/AuthContext";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import PWARegister from "@/components/PWARegister";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${eczar.variable} ${spectral.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-body">
        <AuthProvider>{children}</AuthProvider>
        <GoogleAnalytics />
        <PWARegister />
      </body>
    </html>
  );
}
