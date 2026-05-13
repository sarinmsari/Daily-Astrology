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

export const metadata: Metadata = {
  title:
    "DailyAstrology | Vedic Astrology & Personalized Daily Nakshatra Readings",
  description:
    "Unlock ancient Vedic wisdom with modern AI. Get your personalized daily Nakshatra reading, transit insights, and cosmic guidance tailored to your birth star.",
  keywords: [
    "Vedic Astrology",
    "Nakshatra",
    "Know my day",
    "Daily Horoscope",
    "Jyotish",
    "AI Astrology",
    "Birth Star",
  ],
  openGraph: {
    title:
      "DailyAstrology | Vedic Astrology & Personalized Daily Nakshatra Readings",
    description:
      "Unlock ancient Vedic wisdom with modern AI. Get your personalized daily Nakshatra reading, transit insights, and cosmic guidance tailored to your birth star.",
    url: "/",
    siteName: "DailyAstrology",
    locale: "en_US",
    type: "website",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import GoogleAnalytics from "@/components/GoogleAnalytics";

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
      <body className="min-h-full flex flex-col font-body">
        <AuthProvider>{children}</AuthProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}

